/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License")
 and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed
 on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Kevin Leyow - kevin.leyow@modusbox.com
 --------------
 ******/

import { PubSub, Message } from '~/shared/pub-sub'
import { PersistentModel } from '~/domain/stateMachine/persistent.model'
import { StateMachineConfig } from 'javascript-state-machine'
import { ThirdpartyRequests, MojaloopRequests, Errors } from '@mojaloop/sdk-standard-components'
import inspect from '~/shared/inspect'
import {
  RegisterConsentData,
  RegisterConsentStateMachine,
  RegisterConsentModelConfig
  , RegisterConsentPhase
} from './registerConsent.interface'

import deferredJob from '~/shared/deferred-job'

import { reformatError } from '~/shared/api-error'
import axios from 'axios'
import { deriveChallenge } from '~/domain/challenge'
import { decodeBase64String } from '../buffer'
import {
  v1_1 as fspiopAPI,
  thirdparty as tpAPI
} from '@mojaloop/api-snippets'
import { AttestationResult, ExpectedAttestationResult, Fido2Lib } from 'fido2-lib'
import str2ab from 'string-to-arraybuffer'
import { createAndStoreConsent } from '~/domain/consents'

const atob = require('atob')
export class RegisterConsentModel
  extends PersistentModel<RegisterConsentStateMachine, RegisterConsentData> {
  protected config: RegisterConsentModelConfig

  constructor (
    data: RegisterConsentData,
    config: RegisterConsentModelConfig
  ) {
    const spec: StateMachineConfig = {
      init: 'start',
      transitions: [
        { name: 'verifyConsent', from: 'start', to: 'consentVerified' },
        { name: 'storeConsent', from: 'consentVerified', to: 'consentStoredAndVerified' },
        { name: 'registerAuthoritativeSourceWithALS', from: 'consentStoredAndVerified', to: 'registeredAsAuthoritativeSource' },
        { name: 'sendConsentCallbackToDFSP', from: 'registeredAsAuthoritativeSource', to: 'callbackSent' }
      ],
      methods: {
        // specific transitions handlers methods
        onVerifyConsent: () => this.onVerifyConsent(),
        onStoreConsent: () => this.onStoreConsent(),
        onRegisterAuthoritativeSourceWithALS: () => this.onRegisterAuthoritativeSourceWithALS(),
        onSendConsentCallbackToDFSP: () => this.onSendConsentCallbackToDFSP()
      }
    }
    super(data, config, spec)
    this.config = { ...config }
  }

  // getters
  get subscriber (): PubSub {
    return this.config.subscriber
  }

  get mojaloopRequests (): MojaloopRequests {
    return this.config.mojaloopRequests
  }

  get thirdpartyRequests (): ThirdpartyRequests {
    return this.config.thirdpartyRequests
  }

  // utility function to check if an error after a transition which
  // pub/subs for a response that can return a mojaloop error
  async checkModelDataForErrorInformation (): Promise<void> {
    if (this.data.errorInformation) {
      await this.fsm.error(this.data.errorInformation)
    }
  }

  static notificationChannel (phase: RegisterConsentPhase, id: string): string {
    if (!id) {
      throw new Error('RegisterConsentModel.notificationChannel: \'id\' parameter is required')
    }
    // channel name
    return `RegisterConsent_${phase}_${id}`
  }

  static async triggerWorkflow (
    phase: RegisterConsentPhase,
    id: string,
    pubSub: PubSub,
    message: Message
  ): Promise<void> {
    const channel = RegisterConsentModel.notificationChannel(phase, id)
    return deferredJob(pubSub, channel).trigger(message)
  }

  async onVerifyConsent (): Promise<void> {
    const { consentsPostRequestAUTH, participantDFSPId } = this.data
    try {

      const challenge = deriveChallenge(consentsPostRequestAUTH)
      const decodedJsonString = decodeBase64String(consentsPostRequestAUTH.credential.payload.response.clientDataJSON)
      const parsedClientData = JSON.parse(decodedJsonString)
 
      const attestationExpectations: ExpectedAttestationResult = {
        challenge,
        // not sure what origin should be here
        // decoding and copying the origin for now
        // PISP should be the origin
        origin: parsedClientData.origin,
        factor: 'either'
      }

      const f2l = new Fido2Lib()
      const clientAttestationResponse: AttestationResult = {  
        // This is a little tricky here
        // we first need to convert from ascii (base64 representation) --> Binary
        // then to an ArrayBuffer to reconstruct the object
        // TODO: fix me!
        id: str2ab(atob(consentsPostRequestAUTH.credential.payload.id)),
        // id: str2ab(consentsPostRequestAUTH.credential.payload.id),
        response: {
          clientDataJSON: consentsPostRequestAUTH.credential.payload.response.clientDataJSON,
          attestationObject: consentsPostRequestAUTH.credential.payload.response.attestationObject
        }
      }

      // if consentsPostRequestAUTH.credential.payload.id is in config.get('SKIP_VALIDATION_FOR_CREDENTIAL_IDS')
      // then skip this step, and make up a random public key
      if (this.config.demoSkipValidationForCredentialIds.length > 0 &&
        this.config.demoSkipValidationForCredentialIds.indexOf(consentsPostRequestAUTH.credential.payload.id) > -1) {
        
        this.logger.warn(`found demo credentialId: ${consentsPostRequestAUTH.credential.payload.id}. Skipping FIDO attestation validation step.`)
        
        this.data.credentialCounter = 0;
        this.data.credentialPublicKey = 'demo public key.'
        return
      }

      const attestationResult =  await f2l.attestationResult(
        clientAttestationResponse,
        attestationExpectations
      )

      this.data.credentialPublicKey = attestationResult!.authnrData.get('credentialPublicKeyPem')
      this.data.credentialCounter = attestationResult!.authnrData.get('counter')
    } catch (error) {
      this.logger.push({ error }).error('start -> consentVerified')

      let mojaloopError
      // if error is planned and is a MojaloopApiErrorCode we send back that code
      if ((error as Errors.MojaloopApiErrorCode).code) {
        mojaloopError = reformatError(error, this.logger)
      } else {
        // if error is not planned send back a generalized error
        mojaloopError = reformatError(
          Errors.MojaloopApiErrorCodes.TP_ACCOUNT_LINKING_ERROR,
          this.logger
        )
      }

      await this.thirdpartyRequests.putConsentsError(
        consentsPostRequestAUTH.consentId,
        mojaloopError as unknown as fspiopAPI.Schemas.ErrorInformationObject,
        participantDFSPId
      )

      // throw error to stop state machine
      throw error
    }
  }

  async onStoreConsent (): Promise<void> {
    const { consentsPostRequestAUTH, participantDFSPId, credentialPublicKey, credentialCounter } = this.data

    try {
      await createAndStoreConsent(
        consentsPostRequestAUTH.consentId,
        participantDFSPId,
        consentsPostRequestAUTH.scopes,
        consentsPostRequestAUTH.credential,
        credentialPublicKey!,
        deriveChallenge(consentsPostRequestAUTH),
        credentialCounter!
      )
    } catch (error) {
      this.logger.push({ error }).error('consentVerified -> consentStoredAndVerified')

      let mojaloopError
      // if error is planned and is a MojaloopApiErrorCode we send back that code
      if ((error as Errors.MojaloopApiErrorCode).code) {
        mojaloopError = reformatError(error, this.logger)
      } else {
        // if error is not planned send back a generalized error
        mojaloopError = reformatError(
          Errors.MojaloopApiErrorCodes.TP_ACCOUNT_LINKING_ERROR,
          this.logger
        )
      }

      await this.thirdpartyRequests.putConsentsError(
        consentsPostRequestAUTH.consentId,
        mojaloopError as unknown as fspiopAPI.Schemas.ErrorInformationObject,
        participantDFSPId
      )

      // throw error to stop state machine
      throw error
    }
  }

  async onRegisterAuthoritativeSourceWithALS (): Promise<void> {
    const { consentsPostRequestAUTH, participantDFSPId } = this.data

    // catch any unplanned errors and notify DFSP
    try {
      const waitOnParticipantResponseFromALSResponse = RegisterConsentModel.notificationChannel(
        RegisterConsentPhase.waitOnParticipantResponseFromALS,
        consentsPostRequestAUTH.consentId
      )

      await deferredJob(this.subscriber, waitOnParticipantResponseFromALSResponse)
        .init(async (channel) => {
          // todo: sdk-standard-components needs a postParticipantsTypeId function
          //       building the request from scratch for now
          const alsParticipantURI = `http://${this.config.alsEndpoint}/participants/CONSENT/${consentsPostRequestAUTH.consentId}`
          const axiosConfig = {
            headers: {
              Accept: 'application/vnd.interoperability.participants+json;version=1.1',
              'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
              'FSPIOP-Source': this.config.authServiceParticipantFSPId,
              Date: (new Date()).toUTCString()
            }
          }
          const payload: fspiopAPI.Schemas.ParticipantsTypeIDSubIDPostRequest = {
            fspId: this.config.authServiceParticipantFSPId
          }
          await axios.post(alsParticipantURI, payload, axiosConfig)
          this.logger.push({ channel })
            .debug('POST /participants/{Type}/{ID} call sent to ALS, listening on response')
        })
        .job(async (message: Message): Promise<void> => {
          try {
            type PutResponse =
              fspiopAPI.Schemas.ParticipantsTypeIDPutResponse
            type PutResponseOrError = PutResponse & fspiopAPI.Schemas.ErrorInformationObject
            const putResponse = message as unknown as PutResponseOrError

            if (putResponse.errorInformation) {
              // if the ALS sends back any error, inform the DFSP
              // that the consent verification has failed
              // todo: more detailed error handling depending on ALS error response
              // todo: need to create auth-service specific errors
              const mojaloopError = reformatError(
                Errors.MojaloopApiErrorCodes.TP_ACCOUNT_LINKING_ERROR,
                this.logger
              )

              await this.thirdpartyRequests.putConsentsError(
                consentsPostRequestAUTH.consentId,
                mojaloopError as unknown as fspiopAPI.Schemas.ErrorInformationObject,
                participantDFSPId
              )
              // store the error so we can transition to an errored state
              this.data.errorInformation = mojaloopError.errorInformation as unknown as fspiopAPI.Schemas.ErrorInformation
            }
          } catch (error) {
            return Promise.reject(error)
          }
        })
        .wait(this.config.requestProcessingTimeoutSeconds * 1000)
    } catch (error) {
      this.logger.push({ error }).error('consentStoredAndVerified -> registeredAsAuthoritativeSource')
      // we send back an account linking error despite the actual error
      const mojaloopError = reformatError(
        Errors.MojaloopApiErrorCodes.TP_ACCOUNT_LINKING_ERROR,
        this.logger
      )

      // if the flow fails to run for any reason notify the DFSP that the account
      // linking process has failed
      await this.thirdpartyRequests.putConsentsError(
        consentsPostRequestAUTH.consentId,
        mojaloopError as unknown as fspiopAPI.Schemas.ErrorInformationObject,
        participantDFSPId
      )

      // throw the actual error
      throw error
    }
  }

  async onSendConsentCallbackToDFSP (): Promise<void> {
    const { consentsPostRequestAUTH, participantDFSPId } = this.data

    try {
      // copy credential and update status
      const verifiedCredential: tpAPI.Schemas.VerifiedCredential = {
        ...consentsPostRequestAUTH.credential,
        status: 'VERIFIED'
      }

      const consentsIDPutResponseVerified: tpAPI.Schemas.ConsentsIDPutResponseVerified = {
        scopes: consentsPostRequestAUTH.scopes,
        credential: verifiedCredential
      }

      await this.thirdpartyRequests.putConsents(
        consentsPostRequestAUTH.consentId,
        consentsIDPutResponseVerified,
        participantDFSPId
      )
    } catch (error) {
      this.logger.push({ error }).error('registeredAsAuthoritativeSource -> callbackSent')
      // we send back an account linking error despite the actual error
      const mojaloopError = reformatError(
        Errors.MojaloopApiErrorCodes.TP_ACCOUNT_LINKING_ERROR,
        this.logger
      )

      await this.thirdpartyRequests.putConsentsError(
        consentsPostRequestAUTH.consentId,
        mojaloopError as unknown as fspiopAPI.Schemas.ErrorInformationObject,
        participantDFSPId
      )

      // throw error to stop state machine
      throw error
    }
  }

  async run (): Promise<void> {
    const data = this.data
    try {
      // run transitions based on incoming state
      switch (data.currentState) {
        case 'start':
          await this.fsm.verifyConsent()
          return this.run()

        case 'consentVerified':
          await this.fsm.storeConsent()
          return this.run()

        case 'consentStoredAndVerified':
          await this.fsm.registerAuthoritativeSourceWithALS()
          // check if the ALS sent back an error
          await this.checkModelDataForErrorInformation()
          return this.run()

        case 'registeredAsAuthoritativeSource':
          await this.fsm.sendConsentCallbackToDFSP()
          // flow is finished
          return
        default:
          this.logger.info('State machine in errored state')
          return
      }
    } catch (err) {
      this.logger.info(`Error running RegisterConsentModel : ${inspect(err)}`)

      // as this function is recursive, we don't want to error the state machine multiple times
      if (data.currentState !== 'errored') {
        // err should not have a RegisterConsentState property here!
        if (err.RegisterConsentState) {
          this.logger.info('State machine is broken')
        }
        // transition to errored state
        await this.fsm.error(err)

        // avoid circular ref between RegisterConsentState.lastError and err
        err.RegisterConsentState = { ...this.data }
      }
      throw err
    }
  }
}

export async function create (
  data: RegisterConsentData,
  config: RegisterConsentModelConfig
): Promise<RegisterConsentModel> {
  // create a new model
  const model = new RegisterConsentModel(data, config)

  // enforce to finish any transition to state specified by data.currentState or spec.init
  await model.fsm.state
  return model
}

export default {
  RegisterConsentModel,
  create
}
