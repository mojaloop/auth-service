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

/* IMPORTANT
   The fido challenges found in `auth-service` are signed with
   Kevin Leyow's <kevin.leyow@modusbox.com> Yubikey. If the POST /consent
   `consentId` and `scopes` ever change form you will need to derivie and resign the challenges,
   update the `credential` object and update this PSA.
   You will also need to update the public keys found in every verify transaction flow.
   Use https://github.com/mojaloop/contrib-fido-test-ui to retrieve data used to update
   the response bodies.
*/

import {
  v1_1 as fspiopAPI,
  thirdparty as tpAPI
} from '@mojaloop/api-snippets'
import { KVS } from '~/shared/kvs'
import {
  Message,
  NotificationCallback,
  PubSub
} from '~/shared/pub-sub'
import { ThirdpartyRequests, MojaloopRequests } from '@mojaloop/sdk-standard-components'
import {
  RegisterConsentModel,
  create
} from '~/domain/stateMachine/registerConsent.model'
import { RedisConnectionConfig } from '~/shared/redis-connection'
import { mocked } from 'ts-jest/utils'

import mockLogger from 'test/unit/mockLogger'
import sortedArray from 'test/unit/sortedArray'
import { RegisterConsentModelConfig, RegisterConsentData, RegisterConsentPhase } from '~/domain/stateMachine/registerConsent.interface'
import config from '~/shared/config'
import axios from 'axios'
import shouldNotBeExecuted from '../../shouldNotBeExecuted'
import { createAndStoreConsent } from '~/domain/consents'
import * as challenge from '~/domain/challenge'
import * as consents from '~/domain/consents'
import { MojaloopApiErrorCode } from '~/shared/api-error'
import { mockDeferredJobWithCallbackMessage } from '../../mockDeferredJob'

// mock KVS default exported class
jest.mock('~/shared/kvs')

// mock PubSub default exported class
jest.mock('~/shared/pub-sub')

jest.mock('axios')

// mocking the createAndStoreConsent function since
// our test payload does not have any scopes so the function will fail
// todo: un-mock this once we have a better payload
jest.mock('~/domain/consents')

// Mock deferredJob to inject our async callbacks
jest.mock('~/shared/deferred-job')

const consentsPostRequestAUTH: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  status: 'ISSUED',
  consentId: '76059a0a-684f-4002-a880-b01159afe119',
  scopes: [
    {
      actions: [
        'ACCOUNTS_TRANSFER'
      ],
      address: 'dfspa.username.5678'
    }
  ],
  credential: {
    credentialType: 'FIDO',
    status: 'PENDING',
    fidoPayload: {
      id: 'yprZ16jRaI9OCbGp_afYJs2715cPe3SJPXAcuISI7PTU9i7_4hEBKd0mSqz-uYPm85DVL4VvaH9aRVuejwpVow',
      rawId: 'yprZ16jRaI9OCbGp/afYJs2715cPe3SJPXAcuISI7PTU9i7/4hEBKd0mSqz+uYPm85DVL4VvaH9aRVuejwpVow==',
      response: {
        attestationObject: 'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEcwRQIhAIGw4y8XlGL098qLZ9BeAFopKc3hVUMj8LtcOD0J0p88AiB1nNKNpShrJwTwtQwTdhg9xBXQgsfFMy0up2OXdJEK4GN4NWOBWQLcMIIC2DCCAcCgAwIBAgIJALA5KjdfOKLrMA0GCSqGSIb3DQEBCwUAMC4xLDAqBgNVBAMTI1l1YmljbyBVMkYgUm9vdCBDQSBTZXJpYWwgNDU3MjAwNjMxMCAXDTE0MDgwMTAwMDAwMFoYDzIwNTAwOTA0MDAwMDAwWjBuMQswCQYDVQQGEwJTRTESMBAGA1UECgwJWXViaWNvIEFCMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMScwJQYDVQQDDB5ZdWJpY28gVTJGIEVFIFNlcmlhbCA5MjU1MTQxNjAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATBUzDbxw7VyKPri/NcB5oy/eVWBkwkXfQNU1gLc+nLR5EP7xcV93l5aHDpq1wXjOuZA5jBJoWpb6nbhhWOI9nCo4GBMH8wEwYKKwYBBAGCxAoNAQQFBAMFBAMwIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjcwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQL8BXn4ETR+qxFrtajbkgKjAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQABaTFk5Jj2iKM7SQ+rIS9YLEj4xxyJlJ9fGOoidDllzj4z7UpdC2JQ+ucOBPY81JO6hJTwcEkIdwoQPRZO5ZAScmBDNuIizJxqiQct7vF4J6SJHwEexWpF4XztIHtWEmd8JbnlvMw1lMwx+UuD06l11LxkfhK/LN613S91FABcf/ViH6rqmSpHu+II26jWeYEltk0Wf7jvOtRFKkROFBl2WPc2Dg1eRRYOKSJMqQhQn2Bud83uPFxT1H5yT29MKtjy6DJyzP4/UQjhLmuy9NDt+tlbtvfrXbrIitVMRE6oRert0juvM8PPMb6tvVYQfiM2IaYLKChn5yFCywvR9Xa+aGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAAAAAAAAAAAAAAAAAAAAAAAAABAyprZ16jRaI9OCbGp/afYJs2715cPe3SJPXAcuISI7PTU9i7/4hEBKd0mSqz+uYPm85DVL4VvaH9aRVuejwpVo6UBAgMmIAEhWCC41o0jwHjxFDhbuQG7Rv101+U0DWWjU76bCV0zmLUuACJYILo9Dt2SDXLftbCfhUML1r4Wm3L6oDGETEJEaszyY9Vt',
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiTWpobU1EVTBNemcxTnpNNU16SXlaRGxsWmpReU9HWXdOamxsTmpJek5qUTJZbUV4TmpVNVlURTVaamcwWlRGaU4yRm1NR001WW1KaU1UZGtPV016T1EiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJjcm9zc09yaWdpbiI6ZmFsc2V9'
      },
      type: 'public-key'
    }
  }
}

const participantsTypeIDPutResponse: fspiopAPI.Schemas.ParticipantsTypeIDPutResponse = {
  fspId: config.PARTICIPANT_ID
}

const genericErrorResponse: fspiopAPI.Schemas.ErrorInformationObject = {
  errorInformation: {
    errorCode: '7200',
    errorDescription: 'Generic Thirdparty account linking error'
  }
}

describe('RegisterConsentModel', () => {
  const connectionConfig: RedisConnectionConfig = {
    port: 6789,
    host: 'localhost',
    logger: mockLogger()
  }
  let modelConfig: RegisterConsentModelConfig
  let publisher: PubSub

  beforeEach(async () => {
    // jest.clearAllMocks()
    let subId = 0
    let handler: NotificationCallback

    publisher = new PubSub(connectionConfig)
    await publisher.connect()

    modelConfig = {
      key: 'cache-key',
      kvs: new KVS(connectionConfig),
      subscriber: new PubSub(connectionConfig),
      logger: connectionConfig.logger,
      mojaloopRequests: {} as unknown as MojaloopRequests,
      thirdpartyRequests: {
        putConsents: jest.fn(() => Promise.resolve({ statusCode: 200 })),
        putConsentsError: jest.fn(() => Promise.resolve({ statusCode: 200 }))
      } as unknown as ThirdpartyRequests,
      authServiceParticipantFSPId: config.PARTICIPANT_ID,
      alsEndpoint: config.SHARED.ALS_ENDPOINT!,
      requestProcessingTimeoutSeconds: 3,
      demoSkipValidationForCredentialIds: [
        '123456789'
      ]
    }
    mocked(modelConfig.subscriber.subscribe).mockImplementationOnce(
      (_channel: string, cb: NotificationCallback) => {
        handler = cb
        return ++subId
      }
    )

    mocked(publisher.publish).mockImplementationOnce(
      async (channel: string, message: Message) => handler(channel, message, subId)
    )
    await modelConfig.kvs.connect()
    await modelConfig.subscriber.connect()
  })

  afterEach(async () => {
    await publisher.disconnect()
    await modelConfig.kvs.disconnect()
    await modelConfig.subscriber.disconnect()
  })

  function checkRegisterConsentModelLayout (RegisterConsentModel: RegisterConsentModel, optData?: RegisterConsentData) {
    expect(RegisterConsentModel).toBeTruthy()
    expect(RegisterConsentModel.data).toBeDefined()
    expect(RegisterConsentModel.fsm.state).toEqual(optData?.currentState || 'start')

    // check new getters
    expect(RegisterConsentModel.subscriber).toEqual(modelConfig.subscriber)
    expect(RegisterConsentModel.thirdpartyRequests).toEqual(modelConfig.thirdpartyRequests)
    expect(RegisterConsentModel.mojaloopRequests).toEqual(modelConfig.mojaloopRequests)

    // check is fsm correctly constructed
    expect(typeof RegisterConsentModel.fsm.init).toEqual('function')
    expect(typeof RegisterConsentModel.fsm.verifyConsent).toEqual('function')
    expect(typeof RegisterConsentModel.fsm.registerAuthoritativeSourceWithALS).toEqual('function')
    expect(typeof RegisterConsentModel.fsm.sendConsentCallbackToDFSP).toEqual('function')

    // check fsm notification handler
    expect(typeof RegisterConsentModel.onVerifyConsent).toEqual('function')
    expect(typeof RegisterConsentModel.onRegisterAuthoritativeSourceWithALS).toEqual('function')
    expect(typeof RegisterConsentModel.onSendConsentCallbackToDFSP).toEqual('function')

    expect(sortedArray(RegisterConsentModel.fsm.allStates())).toEqual([
      'callbackSent',
      'consentStoredAndVerified',
      'consentVerified',
      'errored',
      'none',
      'registeredAsAuthoritativeSource',
      'start'
    ])
    expect(sortedArray(RegisterConsentModel.fsm.allTransitions())).toEqual([
      'error',
      'init',
      'registerAuthoritativeSourceWithALS',
      'sendConsentCallbackToDFSP',
      'storeConsent',
      'verifyConsent'
    ])
  }

  it('module layout', () => {
    expect(typeof RegisterConsentModel).toEqual('function')
    expect(typeof create).toEqual('function')
  })

  describe('notificationChannel', () => {
    it('should generate proper channel name', () => {
      const id = '123'
      expect(RegisterConsentModel.notificationChannel(
        RegisterConsentPhase.waitOnParticipantResponseFromALS,
        id)).toEqual('RegisterConsent_waitOnParticipantResponseFromALS_123')
    })

    it('input validation', () => {
      expect(
        () => RegisterConsentModel.notificationChannel(
          RegisterConsentPhase.waitOnParticipantResponseFromALS,
          null as unknown as string
        )
      ).toThrow()
    })
  })

  describe('checkModelDataForErrorInformation', () => {
    it('should transition fsm to errored state if errorInformation is truthy', async () => {
      const registerConsentData: RegisterConsentData = {
        currentState: 'start',
        participantDFSPId: 'dfspA',
        consentsPostRequestAUTH,
        errorInformation: {
          errorCode: '3000',
          errorDescription: 'Generic error'
        }
      }
      const model = await create(registerConsentData, modelConfig)
      await model.checkModelDataForErrorInformation()

      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('errored')
    })
  })

  describe('verifyConsent', () => {
    const registerConsentData: RegisterConsentData = {
      currentState: 'start',
      participantDFSPId: 'dfspA',
      consentsPostRequestAUTH
    }

    it('should be well constructed', async () => {
      const model = await create(registerConsentData, modelConfig)
      checkRegisterConsentModelLayout(model, registerConsentData)
    })

    it('verifyConsent() should transition start to consentVerified state when successful', async () => {
      const model = await create(registerConsentData, modelConfig)
      await model.fsm.verifyConsent()
      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('consentVerified')

      expect(model.data.credentialPublicKey).toBeDefined()
      expect(model.data.credentialCounter).toBeDefined()
    })

    it('verifyConsent() should work with an example from yubikey site', async () => {
      // We can't use the scopes to derive the challenge, it must be provided for us
      jest.spyOn(challenge, 'deriveChallenge').mockReturnValueOnce('ApFjVfRTQw5/NR4Y5poTz8ktd3ga4jI5Ly62/g97oFk=')
      const consentsPostRequestYubi: tpAPI.Schemas.ConsentsPostRequestAUTH = {
        status: 'ISSUED',
        consentId: '76059a0a-684f-4002-a880-b01159afe119',
        scopes: [
          {
            address: 'dfspa.username.5678',
            actions: [
              'ACCOUNTS_TRANSFER'
            ]
          }
        ],
        credential: {
          credentialType: 'FIDO',
          status: 'PENDING',
          fidoPayload: {
            id: 'Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA',
            rawId: 'Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA==',
            response: {
              attestationObject: 'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEgwRgIhAOrrUscl/GRHvjoAtJE6KbgQxUSj3vwp3Ztmh9nQEvuSAiEAgDjZEL8PKFvgJnX7JCk260lOeeht5Ffe/kmA9At17a9jeDVjgVkCwTCCAr0wggGloAMCAQICBAsFzVMwDQYJKoZIhvcNAQELBQAwLjEsMCoGA1UEAxMjWXViaWNvIFUyRiBSb290IENBIFNlcmlhbCA0NTcyMDA2MzEwIBcNMTQwODAxMDAwMDAwWhgPMjA1MDA5MDQwMDAwMDBaMG4xCzAJBgNVBAYTAlNFMRIwEAYDVQQKDAlZdWJpY28gQUIxIjAgBgNVBAsMGUF1dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xJzAlBgNVBAMMHll1YmljbyBVMkYgRUUgU2VyaWFsIDE4NDkyOTYxOTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCEab7G1iSXLCsEYX3wq46i0iBAUebEe//VV4H2XUb0rF2olLe5Z7OOFmSBbs+oov4/X/H2nXAVCcq5IWOWR/FqjbDBqMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS4xMBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEBSaICGO9kEzlriB+NW38fUwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAPv6j3z0q4HJXj34E0N1aS2jbAa/oYy4YtOC4c0MYkRlsGEvrwdUzoj13i7EECMG5qkFOdXaFWwk2lxizSK9c72ywMIZy1h+4vZuGoQqmgs6MLU7wkO1QVBj+U9TOHmJ6KPNyAwlY0I/6WRvEGIDhjooM7RqFgH+QlnFBegtFMhWzjcFHKiRJdkC06Gv+xPFUY5uFuOiAFJY2JDg1WQEr/Id8C0TsfaeU0gZUsprcHbpcUHvwym3zUrzN3nQNLqfhCCSizjlPkE0dmUFeOnxFtf4oepvL3GmOi9zVtHmKXO013oo1CQIKFLcmv785p0QHnLmPW53KCbfD67y9oq9pA2hhdXRoRGF0YVjExGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7dBAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD3Zt06R0Mb5mDHTSnGN0eovDx0XGarb0khbLCadDkGsHITDmAZ6T0OxPewj8v3Gk8TzWFSS/hO3E/xwZuLCLjSlAQIDJiABIVggiSfmVgOyesk2SDOaPhShPbnahfrl3Vs0iQUW6QF4IHUiWCDi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==',
              clientDataJSON: 'eyJjaGFsbGVuZ2UiOiJBcEZqVmZSVFF3NV9OUjRZNXBvVHo4a3RkM2dhNGpJNUx5NjJfZzk3b0ZrIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0='
            },
            type: 'public-key'
          }
        }
      }

      const registerConsentYubiData: RegisterConsentData = {
        ...registerConsentData,
        consentsPostRequestAUTH: consentsPostRequestYubi
      }

      const model = await create(registerConsentYubiData, modelConfig)
      await model.fsm.verifyConsent()
      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('consentVerified')

      console.log('publicKey is', model.data.credentialPublicKey)
      expect(model.data.credentialPublicKey).toBeDefined()
      expect(model.data.credentialCounter).toBeDefined()
    })

    it('verifyConsent() should transition start to errored state when unsuccessful', async () => {
      const error = new Error('the-exception')
      jest.spyOn(challenge, 'deriveChallenge')
        .mockImplementationOnce(() => {
          throw error
        })
      const model = await create(registerConsentData, modelConfig)

      try {
        await model.fsm.verifyConsent()
        shouldNotBeExecuted()
      } catch (error: any) {
        expect(error.message).toEqual('the-exception')
      }

      // check we send an error callback to DFSP
      expect(model.thirdpartyRequests.putConsentsError).toBeCalledWith(
        '76059a0a-684f-4002-a880-b01159afe119',
        {
          errorInformation: {
            errorCode: '2000',
            errorDescription: 'Generic server error',
            extensionList: {
              extension: [
                {
                  key: 'authServiceParticipant',
                  value: 'centralAuth'
                },
                {
                  key: 'transitionFailure',
                  value: 'RegisterConsentModel: start -> consentVerified'
                },
                {
                  key: 'rawError',
                  value: '{}'
                }
              ]
            }
          }
        },
        'dfspA'
      )
    })

    it('verifyConsent() should transition start to errored state when unsuccessful with a planned error code', async () => {
      const error: MojaloopApiErrorCode = {
        code: '7200',
        message: 'Generic Thirdparty account linking error',
        httpStatusCode: 500
      }
      jest.spyOn(challenge, 'deriveChallenge')
        .mockImplementationOnce(() => {
          throw error
        })
      const model = await create(registerConsentData, modelConfig)

      try {
        await model.fsm.verifyConsent()
        shouldNotBeExecuted()
      } catch (error: any) {
        expect(error.message).toEqual('Generic Thirdparty account linking error')
      }

      // check we send an error callback to DFSP
      expect(model.thirdpartyRequests.putConsentsError).toBeCalledWith(
        '76059a0a-684f-4002-a880-b01159afe119',
        {
          errorInformation: {
            errorCode: '2000',
            errorDescription: 'Generic server error',
            extensionList: {
              extension: [
                {
                  key: 'authServiceParticipant',
                  value: 'centralAuth'
                },
                {
                  key: 'transitionFailure',
                  value: 'RegisterConsentModel: start -> consentVerified'
                },
                {
                  key: 'rawError',
                  value: JSON.stringify(error)
                }
              ]
            }
          }
        },
        'dfspA'
      )
    })

    it('skips consent verification if the payload.id is in the DEMO_SKIP_VALIDATION_FOR_CREDENTIAL_IDS list', async () => {
      // Arrange
      const consentsPostRequestSkipCredentialId = JSON.parse(JSON.stringify(consentsPostRequestAUTH))
      consentsPostRequestSkipCredentialId.credential.fidoPayload.id = '123456789'
      // Change the consentId so that that derived challenge will be incorrect
      consentsPostRequestSkipCredentialId.consentId = 'some_consent_id'

      const registerConsentSkipVerificationData: RegisterConsentData = {
        currentState: 'start',
        participantDFSPId: 'dfspA',
        consentsPostRequestAUTH: consentsPostRequestSkipCredentialId
      }
      const model = await create(registerConsentSkipVerificationData, modelConfig)

      // Act
      await model.fsm.verifyConsent()

      // Assert
      expect(model.data.currentState).toEqual('consentVerified')
    })
  })

  describe('storeConsent', () => {
    const registerConsentData: RegisterConsentData = {
      currentState: 'consentVerified',
      participantDFSPId: 'dfspA',
      consentsPostRequestAUTH,
      credentialPublicKey: '-----BEGIN PUBLIC KEY-----\n' +
        'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWM/klen0su2Yxc3Y/klsWjG32sOG\n' +
        'U/sGIApTd7/d5FVks2ONQzS64dY16eCed6gp6uPm/R2F7nf9FBLGarg3lQ==\n' +
        '-----END PUBLIC KEY-----\n',
      credentialCounter: 4
    }

    it('should be well constructed', async () => {
      const model = await create(registerConsentData, modelConfig)
      checkRegisterConsentModelLayout(model, registerConsentData)
    })

    it('storeConsent() should transition consentVerified to consentStoredAndVerified state when successful', async () => {
      const model = await create(registerConsentData, modelConfig)
      await model.fsm.storeConsent()
      expect(createAndStoreConsent).toBeCalledWith(
        consentsPostRequestAUTH.consentId,
        'dfspA',
        consentsPostRequestAUTH.scopes,
        consentsPostRequestAUTH.credential,
        '-----BEGIN PUBLIC KEY-----\n' +
        'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWM/klen0su2Yxc3Y/klsWjG32sOG\n' +
        'U/sGIApTd7/d5FVks2ONQzS64dY16eCed6gp6uPm/R2F7nf9FBLGarg3lQ==\n' +
        '-----END PUBLIC KEY-----\n',
        'MjhmMDU0Mzg1NzM5MzIyZDllZjQyOGYwNjllNjIzNjQ2YmExNjU5YTE5Zjg0ZTFiN2FmMGM5YmJiMTdkOWMzOQ==',
        4
      )
      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('consentStoredAndVerified')
    })

    it('storeConsent() should transition consentVerified to errored state when unsuccessful', async () => {
      const error = new Error('the-exception')
      jest.spyOn(consents, 'createAndStoreConsent')
        .mockImplementationOnce(() => {
          throw error
        })
      const model = await create(registerConsentData, modelConfig)

      try {
        await model.fsm.storeConsent()
        shouldNotBeExecuted()
      } catch (error: any) {
        expect(error.message).toEqual('the-exception')
      }

      // check we send an error callback to DFSP
      expect(model.thirdpartyRequests.putConsentsError).toBeCalledWith(
        '76059a0a-684f-4002-a880-b01159afe119',
        {
          errorInformation: {
            errorCode: '2000',
            errorDescription: 'Generic server error',
            extensionList: {
              extension: [
                {
                  key: 'authServiceParticipant',
                  value: 'centralAuth'
                },
                {
                  key: 'transitionFailure',
                  value: 'RegisterConsentModel: consentVerified -> consentStoredAndVerified'
                },
                {
                  key: 'rawError',
                  value: '{}'
                }
              ]
            }
          }
        },
        'dfspA'
      )
    })
  })

  describe('registerAuthoritativeSourceWithALS', () => {
    const registerConsentData: RegisterConsentData = {
      currentState: 'consentStoredAndVerified',
      participantDFSPId: 'dfspA',
      consentsPostRequestAUTH
    }

    const genericALSErrorResponse: fspiopAPI.Schemas.ErrorInformationObject = {
      errorInformation: {
        errorCode: '3000',
        errorDescription: 'Generic error'
      }
    }

    it('should be well constructed', async () => {
      const model = await create(registerConsentData, modelConfig)
      checkRegisterConsentModelLayout(model, registerConsentData)
    })

    it('registerAuthoritativeSourceWithALS() should transition consentVerified to registeredAsAuthoritativeSource state when successful', async () => {
      const model = await create(registerConsentData, modelConfig)
      const waitOnParticipantResponseFromALSChannel = RegisterConsentModel.notificationChannel(
        RegisterConsentPhase.waitOnParticipantResponseFromALS,
        registerConsentData.consentsPostRequestAUTH.consentId
      )
      mockDeferredJobWithCallbackMessage(waitOnParticipantResponseFromALSChannel, participantsTypeIDPutResponse)

      await model.fsm.registerAuthoritativeSourceWithALS()
      await model.checkModelDataForErrorInformation()

      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('registeredAsAuthoritativeSource')

      // check we made a call to the als
      expect(axios.post).toBeCalledWith(
        `http://${config.SHARED.ALS_ENDPOINT}/participants/CONSENT/${consentsPostRequestAUTH.consentId}`,
        { fspId: 'centralAuth' },
        expect.any(Object)
      )
    })

    it('should handle a PUT /participants/CONSENT/{ID}/error response', async () => {
      const waitOnParticipantResponseFromALSChannel = RegisterConsentModel.notificationChannel(
        RegisterConsentPhase.waitOnParticipantResponseFromALS,
        registerConsentData.consentsPostRequestAUTH.consentId
      )
      mockDeferredJobWithCallbackMessage(waitOnParticipantResponseFromALSChannel, genericALSErrorResponse)

      const model = await create(registerConsentData, modelConfig)
      await model.fsm.registerAuthoritativeSourceWithALS()

      // check for errors
      await model.checkModelDataForErrorInformation()
      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('errored')

      // check it sends an error back to DFSP
      expect(model.thirdpartyRequests.putConsentsError).toBeCalledWith(
        '76059a0a-684f-4002-a880-b01159afe119',
        genericErrorResponse,
        'dfspA'
      )
    })
  })

  describe('sendConsentCallbackToDFSP', () => {
    const registerConsentData: RegisterConsentData = {
      currentState: 'registeredAsAuthoritativeSource',
      participantDFSPId: 'dfspA',
      consentsPostRequestAUTH
    }

    it('should be well constructed', async () => {
      const model = await create(registerConsentData, modelConfig)
      checkRegisterConsentModelLayout(model, registerConsentData)
    })

    it('sendConsentCallbackToDFSP() should transition registeredAsAuthoritativeSource to callbackSent state when successful', async () => {
      const model = await create(registerConsentData, modelConfig)
      await model.fsm.sendConsentCallbackToDFSP()

      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('callbackSent')

      // check we made a call to thirdpartyRequests.putConsents
      expect(model.thirdpartyRequests.putConsents).toBeCalledWith(
        '76059a0a-684f-4002-a880-b01159afe119',
        {
          scopes: consentsPostRequestAUTH.scopes,
          credential: {
            ...consentsPostRequestAUTH.credential,
            status: 'VERIFIED'
          }
        },
        'dfspA'
      )
    })

    it('sendConsentCallbackToDFSP() should transition registeredAsAuthoritativeSource to errored state when unsuccessful', async () => {
      const error = new Error('the-exception')
      mocked(modelConfig.thirdpartyRequests.putConsents).mockImplementationOnce(
        () => {
          throw error
        }
      )

      const model = await create(registerConsentData, modelConfig)

      try {
        await model.fsm.sendConsentCallbackToDFSP()
        shouldNotBeExecuted()
      } catch (error: any) {
        expect(error.message).toEqual('the-exception')
      }

      // check we send an error callback to DFSP
      expect(model.thirdpartyRequests.putConsentsError).toBeCalledWith(
        '76059a0a-684f-4002-a880-b01159afe119',
        {
          errorInformation: {
            errorCode: '2000',
            errorDescription: 'Generic server error',
            extensionList: {
              extension: [
                {
                  key: 'authServiceParticipant',
                  value: 'centralAuth'
                },
                {
                  key: 'transitionFailure',
                  value: 'RegisterConsentModel: registeredAsAuthoritativeSource -> callbackSent'
                },
                {
                  key: 'rawError',
                  value: '{}'
                }
              ]
            }
          }
        },
        'dfspA'
      )
    })
  })

  // run this test last since it can interfere with other tests because of the
  // timed pubsub publishing
  describe('run workflow', () => {
    const registerConsentData: RegisterConsentData = {
      currentState: 'start',
      participantDFSPId: 'dfspA',
      consentsPostRequestAUTH
    }

    it('start', async () => {
      const waitOnParticipantResponseFromALSChannel = RegisterConsentModel.notificationChannel(
        RegisterConsentPhase.waitOnParticipantResponseFromALS,
        registerConsentData.consentsPostRequestAUTH.consentId
      )
      mockDeferredJobWithCallbackMessage(waitOnParticipantResponseFromALSChannel, participantsTypeIDPutResponse)

      const model = await create(registerConsentData, modelConfig)

      await model.run()
      // check that the fsm was able complete the workflow
      expect(model.data.currentState).toEqual('callbackSent')
      mocked(modelConfig.logger.info).mockReset()
    })

    it('errored', async () => {
      const model = await create({ ...registerConsentData, currentState: 'errored' }, modelConfig)

      const result = await model.run()

      expect(mocked(modelConfig.logger.info)).toBeCalledWith('State machine in errored state')

      expect(result).toBeUndefined()
    })

    it('wrong state', async () => {
      const model = await create({ ...registerConsentData, currentState: 'adga' }, modelConfig)

      const result = await model.run()

      expect(mocked(modelConfig.logger.info)).toBeCalledWith('State machine in errored state')

      expect(result).toBeUndefined()
    })

    it('exceptions - sendConsentCallbackToDFSP stage', async () => {
      const error = { message: 'error from modelConfig.thirdpartyRequests.putConsents', consentReqState: 'broken' }
      mocked(modelConfig.thirdpartyRequests.putConsents).mockImplementationOnce(
        () => {
          throw error
        }
      )
      mockDeferredJobWithCallbackMessage('test1', participantsTypeIDPutResponse)
      const model = await create({ ...registerConsentData, currentState: 'registeredAsAuthoritativeSource' }, modelConfig)

      expect(async () => await model.run()).rejects.toEqual(error)
    })

    it('exceptions - Error - sendConsentCallbackToDFSP stage', async () => {
      const error = new Error('the-exception')
      mocked(modelConfig.thirdpartyRequests.putConsents).mockImplementationOnce(
        () => {
          throw error
        }
      )
      mockDeferredJobWithCallbackMessage('test2', participantsTypeIDPutResponse)
      const model = await create({ ...registerConsentData, currentState: 'registeredAsAuthoritativeSource' }, modelConfig)
      expect(model.run()).rejects.toEqual(error)
    })

    it('exceptions - registerAuthoritativeSourceWithALS stage', async () => {
      const error = { message: 'error from axios.post', consentReqState: 'broken' }
      mockDeferredJobWithCallbackMessage('test3', participantsTypeIDPutResponse)

      mocked(axios.post).mockImplementationOnce(
        () => {
          throw error
        }
      )
      const model = await create({ ...registerConsentData, currentState: 'consentStoredAndVerified' }, modelConfig)

      expect(async () => await model.run()).rejects.toEqual(error)
    })

    it('exceptions - Error - registerAuthoritativeSourceWithALS stage', async () => {
      const error = new Error('the-exception')
      mockDeferredJobWithCallbackMessage('test4', participantsTypeIDPutResponse)

      mocked(axios.post).mockImplementationOnce(
        () => {
          throw error
        }
      )
      const model = await create({ ...registerConsentData, currentState: 'consentStoredAndVerified' }, modelConfig)
      expect(model.run()).rejects.toEqual(error)
    })
  })
})
