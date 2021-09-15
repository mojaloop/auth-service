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

import { PubSub } from '~/shared/pub-sub'
import { PersistentModel } from '~/domain/stateMachine/persistent.model'
import { StateMachineConfig } from 'javascript-state-machine'
import { ThirdpartyRequests, MojaloopRequests, Errors } from '@mojaloop/sdk-standard-components'
import inspect from '~/shared/inspect'
import { reformatError } from '~/shared/api-error'
import { VerifyTransactionModelConfig, VerifyTransactionData, VerifyTransactionStateMachine } from './verifyTransaction.interface'
import {
  thirdparty as tpAPI,
  v1_1 as fspiopAPI,
} from '@mojaloop/api-snippets'
import * as ConsentDomain from '../consents'
import { IncorrectConsentStatusError } from '../errors'
import { InvalidDataError } from '~/shared/invalidDataError'
import { AssertionResult, ExpectedAssertionResult, Fido2Lib } from 'fido2-lib'
import FidoUtils from '~/shared/fido-utils'

export class VerifyTransactionModel
  extends PersistentModel<VerifyTransactionStateMachine, VerifyTransactionData> {
  protected config: VerifyTransactionModelConfig

  constructor(
    data: VerifyTransactionData,
    config: VerifyTransactionModelConfig
  ) {
    const spec: StateMachineConfig = {
      init: 'start',
      transitions: [
        { name: 'retreiveConsent', from: 'start', to: 'consentRetreived' },
        { name: 'verifyTransaction', from: 'consentRetreived', to: 'transactionVerified' },
        { name: 'sendCallbackToDFSP', from: 'transactionVerified', to: 'callbackSent' },
      ],
      methods: {
        // specific transitions handlers methods
        onRetreiveConsent: () => this.onRetreiveConsent(),
        onVerifyTransaction: () => this.onVerifyTransaction(),
        onSendCallbackToDFSP: () => this.onSendCallbackToDFSP(),
      }
    }
    super(data, config, spec)
    this.config = { ...config }
  }

  // getters
  get subscriber(): PubSub {
    return this.config.subscriber
  }

  get mojaloopRequests(): MojaloopRequests {
    return this.config.mojaloopRequests
  }

  get thirdpartyRequests(): ThirdpartyRequests {
    return this.config.thirdpartyRequests
  }

  // utility function to check if an error after a transition which
  // pub/subs for a response that can return a mojaloop error
  async checkModelDataForErrorInformation(): Promise<void> {
    if (this.data.errorInformation) {
      await this.fsm.error(this.data.errorInformation)
    }
  }

  async onRetreiveConsent(): Promise<void> {
    try {
      const consentId = this.data.verificationRequest.consentId
      const consent = await ConsentDomain.getConsent(consentId)
      this.data.consent = consent
    } catch (error) {
      this.logger.push({ error }).error('start -> consentRetreived')

      let mojaloopError
      // if error is planned and is a MojaloopApiErrorCode we send back that code
      if ((error as Errors.MojaloopApiErrorCode).code) {
        mojaloopError = reformatError(error, this.logger)
      } else {
        // if error is not planned send back a generalized error
        mojaloopError = reformatError(
          Errors.MojaloopApiErrorCodes.TP_AUTH_SERVICE_ERROR,
          this.logger
        )
      }

      await this.thirdpartyRequests.putThirdpartyRequestsVerificationsError(
        mojaloopError as unknown as fspiopAPI.Schemas.ErrorInformationObject,
        this.data.verificationRequest.verificationRequestId,
        this.data.participantDFSPId
      )

      // throw error to stop state machine
      throw error
    }
  }

  async onVerifyTransaction(): Promise<void> {
    try {
      InvalidDataError.throwIfInvalidProperty(this.data, 'consent')
      const f2l = new Fido2Lib()

      const consent = this.data.consent!
      const request = this.data.verificationRequest

      if (consent.status === 'REVOKED') {
        throw new IncorrectConsentStatusError(consent.consentId)
      }

      if (request.signedPayloadType !== 'FIDO') {
        throw new Error('Auth-Service currently only supports verifying FIDO-based credentials')
      }

      const clientDataObj = FidoUtils.parseClientDataBase64(request.signedPayload.response.clientDataJSON)
      const origin = clientDataObj.origin

      const assertionExpectations: ExpectedAssertionResult = {
        challenge: request.challenge,
        origin,
        factor: "either",
        publicKey: consent.credentialPayload,
        prevCounter: consent.credentialCounter,
        userHandle: request.signedPayload.response.userHandle || null
      };
      const assertionResult: AssertionResult = {
        // fido2lib requires an ArrayBuffer, not just any old Buffer!
        id: FidoUtils.stringToArrayBuffer(request.signedPayload.id),
        response: {
          clientDataJSON: request.signedPayload.response.clientDataJSON,
          authenticatorData: FidoUtils.stringToArrayBuffer(request.signedPayload.response.authenticatorData),
          signature: request.signedPayload.response.signature,
          userHandle: request.signedPayload.response.userHandle
        }
      }

      // TODO: for greater security, store the updated counter result
      // out of scope for now.
      await f2l.assertionResult(assertionResult, assertionExpectations); // will throw on error

    } catch (error) {
      this.logger.push({ error }).error('consentRetreived -> transactionVerified')

      let mojaloopError
      // if error is planned and is a MojaloopApiErrorCode we send back that code
      if ((error as Errors.MojaloopApiErrorCode).code) {
        mojaloopError = reformatError(error, this.logger)
      } else {
        // if error is not planned send back a generalized error
        mojaloopError = reformatError(
          Errors.MojaloopApiErrorCodes.TP_FSP_TRANSACTION_AUTHORIZATION_NOT_VALID,
          this.logger
        )
      }

      await this.thirdpartyRequests.putThirdpartyRequestsVerificationsError(
        mojaloopError as unknown as fspiopAPI.Schemas.ErrorInformationObject,
        this.data.verificationRequest.verificationRequestId,
        this.data.participantDFSPId
      )

      // throw error to stop state machine
      throw error
    }
  }

  async onSendCallbackToDFSP(): Promise<void> {
    const { verificationRequest, participantDFSPId } = this.data

    try {
      const response: tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse = {
        authenticationResponse: 'VERIFIED'
      }

      await this.thirdpartyRequests.putThirdpartyRequestsVerifications(
        response, verificationRequest.verificationRequestId, participantDFSPId
      )
    } catch (error) {
      this.logger.push({ error }).error('onSendCallbackToDFSP -> callbackSent')
  //     // we send back an account linking error despite the actual error
      const mojaloopError = reformatError(
        Errors.MojaloopApiErrorCodes.TP_FSP_TRANSACTION_REQUEST_NOT_VALID,
        this.logger
      )

      // TODO: implement PUT /thirdpartyRequests/verifications/{ID} in sdk-standard-components
      const url = `thirdpartyRequests/verifications/${verificationRequest.verificationRequestId}/error`
      // @ts-ignore
      await this.mojaloopRequests._put(url, 'thirdpartyRequests', mojaloopError, participantDFSPId);

      // throw error to stop state machine
      throw error
    }
  }

  async run(): Promise<void> {
    const data = this.data
    try {
      // run transitions based on incoming state
      switch (data.currentState) {
        case 'start':
          await this.fsm.retreiveConsent()
          return this.run()
        case 'consentRetreived':
          await this.fsm.verifyTransaction()
          return this.run()
        case 'transactionVerified':
          await this.fsm.sendCallbackToDFSP()
          return this.run()
        case 'callbackSent':
          // flow is finished
          return
        default:
          this.logger.info('State machine in errored state')
          return
      }
    } catch (err: any) {
      this.logger.info(`Error running VerifyTransactionModel : ${inspect(err)}`)

      // as this function is recursive, we don't want to error the state machine multiple times
      if (data.currentState !== 'errored') {
        // err should not have a VerifyTransactionState property here!
        if (err.VerifyTransactionState) {
          this.logger.info('State machine is broken')
        }
        // transition to errored state
        await this.fsm.error(err)

        // avoid circular ref between VerifyTransactionState.lastError and err
        err.VerifyTransactionState = { ...this.data }
      }
      throw err
    }
  }
}

export async function create(
  data: VerifyTransactionData,
  config: VerifyTransactionModelConfig
): Promise<VerifyTransactionModel> {
  // create a new model
  const model = new VerifyTransactionModel(data, config)

  // enforce to finish any transition to state specified by data.currentState or spec.init
  await model.fsm.state
  return model
}

export default {
  VerifyTransactionModel,
  create
}
