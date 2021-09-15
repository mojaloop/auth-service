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
import * as challenge  from '~/domain/challenge'
import * as consents from '~/domain/consents'
import { MojaloopApiErrorCode } from '~/shared/api-error'


// mock KVS default exported class
jest.mock('~/shared/kvs')

// mock PubSub default exported class
jest.mock('~/shared/pub-sub')

jest.mock('axios')

// mocking the createAndStoreConsent function since
// our test payload does not have any scopes so the function will fail
// todo: un-mock this once we have a better payload
jest.mock('~/domain/consents')

const consentsPostRequestAUTH: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  consentId: '76059a0a-684f-4002-a880-b01159afe119',
  scopes: [
    {
      accountId: 'dfspa.username.5678',
      actions: [
        'accounts.transfer'
      ]
    },
  ],
  // todo: make note in api that we are converting all array buffers to base64 encoded strings
  credential: {
    credentialType: 'FIDO',
    status: 'PENDING',
    payload: {
      id: 'HskU2gw4np09IUtYNHnxMM696jJHqvccUdBmd0xP6XEWwH0xLei1PUzDJCM19SZ3A2Ex0fNLw0nc2hrIlFnAtw',
      rawId: Buffer.from([30, 201, 20, 218, 12, 56, 158, 157, 61, 33, 75, 88, 52, 121, 241, 48, 206, 189,
        234, 50, 71, 170, 247, 28, 81, 208, 102, 119, 76, 79, 233, 113, 22, 192, 125, 49, 45,
        232, 181, 61, 76, 195, 36, 35, 53, 245, 38, 119, 3, 97, 49, 209, 243, 75, 195, 73, 220,
        218, 26, 200, 148, 89, 192, 183]).toString('base64'),
      response: {
        clientDataJSON: Buffer.from(
          [123, 34, 116, 121,
            112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 99, 114, 101, 97, 116,
            101, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 89, 122, 82, 104,
            90, 71, 70, 105, 89, 106, 77, 122, 90, 84, 107, 122, 77, 68, 90, 105, 77, 68, 77, 52, 77,
            68, 103, 52, 77, 84, 77, 121, 89, 87, 90, 109, 89, 50, 82, 108, 78, 84, 85, 50, 89, 122,
            85, 119, 90, 68, 103, 121, 90, 106, 89, 119, 77, 50, 89, 48, 78, 122, 99, 120, 77, 87,
            69, 53, 78, 84, 69, 119, 89, 109, 89, 122, 89, 109, 86, 108, 90, 106, 90, 107, 78, 103,
            34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47,
            108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 52, 50, 49, 56, 49, 34, 44, 34, 99, 114,
            111, 115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 125]
        ).toString('base64'),
        attestationObject: Buffer.from([163, 99, 102, 109, 116,
          102, 112, 97, 99, 107, 101, 100, 103, 97, 116, 116, 83, 116, 109, 116, 163, 99, 97, 108,
          103, 38, 99, 115, 105, 103, 88, 71, 48, 69, 2, 33, 0, 221, 137, 12, 243, 211, 177, 239,
          248, 228, 65, 210, 169, 42, 68, 38, 40, 168, 147, 155, 39, 179, 225, 234, 116, 151, 33,
          223, 232, 44, 47, 79, 85, 2, 32, 33, 237, 110, 217, 133, 0, 188, 128, 194, 36, 131, 7, 0,
          249, 46, 43, 66, 70, 135, 160, 121, 207, 244, 9, 36, 162, 22, 138, 10, 235, 128, 235, 99,
          120, 53, 99, 129, 89, 2, 193, 48, 130, 2, 189, 48, 130, 1, 165, 160, 3, 2, 1, 2, 2, 4,
          11, 5, 205, 83, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 48, 46, 49, 44,
          48, 42, 6, 3, 85, 4, 3, 19, 35, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 82, 111,
          111, 116, 32, 67, 65, 32, 83, 101, 114, 105, 97, 108, 32, 52, 53, 55, 50, 48, 48, 54, 51,
          49, 48, 32, 23, 13, 49, 52, 48, 56, 48, 49, 48, 48, 48, 48, 48, 48, 90, 24, 15, 50, 48,
          53, 48, 48, 57, 48, 52, 48, 48, 48, 48, 48, 48, 90, 48, 110, 49, 11, 48, 9, 6, 3, 85, 4,
          6, 19, 2, 83, 69, 49, 18, 48, 16, 6, 3, 85, 4, 10, 12, 9, 89, 117, 98, 105, 99, 111, 32,
          65, 66, 49, 34, 48, 32, 6, 3, 85, 4, 11, 12, 25, 65, 117, 116, 104, 101, 110, 116, 105,
          99, 97, 116, 111, 114, 32, 65, 116, 116, 101, 115, 116, 97, 116, 105, 111, 110, 49, 39,
          48, 37, 6, 3, 85, 4, 3, 12, 30, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 69, 69,
          32, 83, 101, 114, 105, 97, 108, 32, 49, 56, 52, 57, 50, 57, 54, 49, 57, 48, 89, 48, 19,
          6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134, 72, 206, 61, 3, 1, 7, 3, 66, 0, 4, 33,
          26, 111, 177, 181, 137, 37, 203, 10, 193, 24, 95, 124, 42, 227, 168, 180, 136, 16, 20,
          121, 177, 30, 255, 245, 85, 224, 125, 151, 81, 189, 43, 23, 106, 37, 45, 238, 89, 236,
          227, 133, 153, 32, 91, 179, 234, 40, 191, 143, 215, 252, 125, 167, 92, 5, 66, 114, 174,
          72, 88, 229, 145, 252, 90, 163, 108, 48, 106, 48, 34, 6, 9, 43, 6, 1, 4, 1, 130, 196, 10,
          2, 4, 21, 49, 46, 51, 46, 54, 46, 49, 46, 52, 46, 49, 46, 52, 49, 52, 56, 50, 46, 49, 46,
          49, 48, 19, 6, 11, 43, 6, 1, 4, 1, 130, 229, 28, 2, 1, 1, 4, 4, 3, 2, 4, 48, 48, 33, 6,
          11, 43, 6, 1, 4, 1, 130, 229, 28, 1, 1, 4, 4, 18, 4, 16, 20, 154, 32, 33, 142, 246, 65,
          51, 150, 184, 129, 248, 213, 183, 241, 245, 48, 12, 6, 3, 85, 29, 19, 1, 1, 255, 4, 2,
          48, 0, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 3, 130, 1, 1, 0, 62, 254,
          163, 223, 61, 42, 224, 114, 87, 143, 126, 4, 208, 221, 90, 75, 104, 219, 1, 175, 232, 99,
          46, 24, 180, 224, 184, 115, 67, 24, 145, 25, 108, 24, 75, 235, 193, 213, 51, 162, 61,
          119, 139, 177, 4, 8, 193, 185, 170, 65, 78, 117, 118, 133, 91, 9, 54, 151, 24, 179, 72,
          175, 92, 239, 108, 176, 48, 134, 114, 214, 31, 184, 189, 155, 134, 161, 10, 166, 130,
          206, 140, 45, 78, 240, 144, 237, 80, 84, 24, 254, 83, 212, 206, 30, 98, 122, 40, 243,
          114, 3, 9, 88, 208, 143, 250, 89, 27, 196, 24, 128, 225, 142, 138, 12, 237, 26, 133, 128,
          127, 144, 150, 113, 65, 122, 11, 69, 50, 21, 179, 141, 193, 71, 42, 36, 73, 118, 64, 180,
          232, 107, 254, 196, 241, 84, 99, 155, 133, 184, 232, 128, 20, 150, 54, 36, 56, 53, 89, 1,
          43, 252, 135, 124, 11, 68, 236, 125, 167, 148, 210, 6, 84, 178, 154, 220, 29, 186, 92,
          80, 123, 240, 202, 109, 243, 82, 188, 205, 222, 116, 13, 46, 167, 225, 8, 36, 162, 206,
          57, 79, 144, 77, 29, 153, 65, 94, 58, 124, 69, 181, 254, 40, 122, 155, 203, 220, 105,
          142, 139, 220, 213, 180, 121, 138, 92, 237, 53, 222, 138, 53, 9, 2, 10, 20, 183, 38, 191,
          191, 57, 167, 68, 7, 156, 185, 143, 91, 157, 202, 9, 183, 195, 235, 188, 189, 162, 175,
          105, 3, 104, 97, 117, 116, 104, 68, 97, 116, 97, 88, 196, 73, 150, 13, 229, 136, 14, 140,
          104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92,
          243, 186, 131, 29, 151, 99, 65, 0, 0, 0, 4, 20, 154, 32, 33, 142, 246, 65, 51, 150, 184,
          129, 248, 213, 183, 241, 245, 0, 64, 30, 201, 20, 218, 12, 56, 158, 157, 61, 33, 75, 88,
          52, 121, 241, 48, 206, 189, 234, 50, 71, 170, 247, 28, 81, 208, 102, 119, 76, 79, 233,
          113, 22, 192, 125, 49, 45, 232, 181, 61, 76, 195, 36, 35, 53, 245, 38, 119, 3, 97, 49,
          209, 243, 75, 195, 73, 220, 218, 26, 200, 148, 89, 192, 183, 165, 1, 2, 3, 38, 32, 1, 33,
          88, 32, 88, 207, 228, 149, 233, 244, 178, 237, 152, 197, 205, 216, 254, 73, 108, 90, 49,
          183, 218, 195, 134, 83, 251, 6, 32, 10, 83, 119, 191, 221, 228, 85, 34, 88, 32, 100, 179,
          99, 141, 67, 52, 186, 225, 214, 53, 233, 224, 158, 119, 168, 41, 234, 227, 230, 253, 29,
          133, 238, 119, 253, 20, 18, 198, 106, 184, 55, 149]
        ).toString('base64')
      },
      type: 'public-key'
    }
  }
}

const participantsTypeIDPutResponse: fspiopAPI.Schemas.ParticipantsTypeIDPutResponse = {
  'fspId': config.PARTICIPANT_ID
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
      // TODO: fill these in
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
      'verifyConsent',
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

    it.only('verifyConsent() should transition start to consentVerified state when successful', async () => {
      const model = await create(registerConsentData, modelConfig)
      await model.fsm.verifyConsent()
      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('consentVerified')

      console.log('publicKey is', model.data.credentialPublicKey)
      expect(model.data.credentialPublicKey).toBeDefined()
      expect(model.data.credentialCounter).toBeDefined()
    })

    it('verifyConsent() should work with an example from yubikey site', async () => {
      // We can't use the scopes to derive the challenge, it must be provided for us
      jest.spyOn(challenge, 'deriveChallenge').mockReturnValueOnce('ApFjVfRTQw5/NR4Y5poTz8ktd3ga4jI5Ly62/g97oFk=')
      const consentsPostRequestYubi: tpAPI.Schemas.ConsentsPostRequestAUTH = {
        consentId: '76059a0a-684f-4002-a880-b01159afe119',
        scopes: [
          {
            accountId: 'dfspa.username.5678',
            actions: [
              'accounts.transfer'
            ]
          },
        ],
        credential: {
          credentialType: 'FIDO',
          status: 'PENDING',
          payload: {
            "id": "Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA",
            "rawId": "Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA",
            "response": {
              "attestationObject": "o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEgwRgIhAOrrUscl/GRHvjoAtJE6KbgQxUSj3vwp3Ztmh9nQEvuSAiEAgDjZEL8PKFvgJnX7JCk260lOeeht5Ffe/kmA9At17a9jeDVjgVkCwTCCAr0wggGloAMCAQICBAsFzVMwDQYJKoZIhvcNAQELBQAwLjEsMCoGA1UEAxMjWXViaWNvIFUyRiBSb290IENBIFNlcmlhbCA0NTcyMDA2MzEwIBcNMTQwODAxMDAwMDAwWhgPMjA1MDA5MDQwMDAwMDBaMG4xCzAJBgNVBAYTAlNFMRIwEAYDVQQKDAlZdWJpY28gQUIxIjAgBgNVBAsMGUF1dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xJzAlBgNVBAMMHll1YmljbyBVMkYgRUUgU2VyaWFsIDE4NDkyOTYxOTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCEab7G1iSXLCsEYX3wq46i0iBAUebEe//VV4H2XUb0rF2olLe5Z7OOFmSBbs+oov4/X/H2nXAVCcq5IWOWR/FqjbDBqMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS4xMBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEBSaICGO9kEzlriB+NW38fUwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAPv6j3z0q4HJXj34E0N1aS2jbAa/oYy4YtOC4c0MYkRlsGEvrwdUzoj13i7EECMG5qkFOdXaFWwk2lxizSK9c72ywMIZy1h+4vZuGoQqmgs6MLU7wkO1QVBj+U9TOHmJ6KPNyAwlY0I/6WRvEGIDhjooM7RqFgH+QlnFBegtFMhWzjcFHKiRJdkC06Gv+xPFUY5uFuOiAFJY2JDg1WQEr/Id8C0TsfaeU0gZUsprcHbpcUHvwym3zUrzN3nQNLqfhCCSizjlPkE0dmUFeOnxFtf4oepvL3GmOi9zVtHmKXO013oo1CQIKFLcmv785p0QHnLmPW53KCbfD67y9oq9pA2hhdXRoRGF0YVjExGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7dBAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD3Zt06R0Mb5mDHTSnGN0eovDx0XGarb0khbLCadDkGsHITDmAZ6T0OxPewj8v3Gk8TzWFSS/hO3E/xwZuLCLjSlAQIDJiABIVggiSfmVgOyesk2SDOaPhShPbnahfrl3Vs0iQUW6QF4IHUiWCDi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==",
              "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJBcEZqVmZSVFF3NV9OUjRZNXBvVHo4a3RkM2dhNGpJNUx5NjJfZzk3b0ZrIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0="
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
            errorCode: '7200',
            errorDescription: 'Generic Thirdparty account linking error'
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
            errorCode: '7200',
            errorDescription: 'Generic Thirdparty account linking error'
          }
        },
        'dfspA'
      )
    })

    it('skips consent verification if the payload.id is in the DEMO_SKIP_VALIDATION_FOR_CREDENTIAL_IDS list', async () => {
      // Arrange
      const consentsPostRequestSkipCredentialId = JSON.parse(JSON.stringify(consentsPostRequestAUTH))
      consentsPostRequestSkipCredentialId.credential.payload.id = '123456789'
      // Change the consentId so that that derived challenge will be incorrect
      consentsPostRequestSkipCredentialId.consentId = 'some_consent_id'

      const registerConsentSkipVerificationData: RegisterConsentData = {
        currentState: 'start',
        participantDFSPId: 'dfspA',
        consentsPostRequestAUTH: consentsPostRequestSkipCredentialId,
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
        'c4adabb33e9306b038088132affcde556c50d82f603f47711a9510bf3beef6d6',
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
            errorCode: '7200',
            errorDescription: 'Generic Thirdparty account linking error'
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
      // defer publication to notification channel
      setImmediate(() => publisher.publish(
        RegisterConsentModel.notificationChannel(
          RegisterConsentPhase.waitOnParticipantResponseFromALS,
          registerConsentData.consentsPostRequestAUTH.consentId
        ),
        participantsTypeIDPutResponse as unknown as Message
      ))
      await model.fsm.registerAuthoritativeSourceWithALS()
      await model.checkModelDataForErrorInformation()

      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('registeredAsAuthoritativeSource')

      // check we made a call to the als
      expect(axios.post).toBeCalledWith(
        `http://${config.SHARED.ALS_ENDPOINT}/participants/CONSENT/${consentsPostRequestAUTH.consentId}`,
        { fspId: "centralAuth"},
        expect.any(Object)
      )
    })

    it('should handle a PUT /participants/CONSENT/{ID}/error response', async () => {
      setImmediate(() => publisher.publish(
        RegisterConsentModel.notificationChannel(
          RegisterConsentPhase.waitOnParticipantResponseFromALS,
          registerConsentData.consentsPostRequestAUTH.consentId
        ),
        genericALSErrorResponse as unknown as Message
      ))

      const model = await create(registerConsentData, modelConfig)
      await model.fsm.registerAuthoritativeSourceWithALS()

      // check for errors
      await model.checkModelDataForErrorInformation()
      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('errored')

      // check it sends an error back to DFSP
      expect(model.thirdpartyRequests.putConsentsError).toBeCalledWith(
        "76059a0a-684f-4002-a880-b01159afe119",
        genericErrorResponse,
        "dfspA"
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
            errorCode: '7200',
            errorDescription: 'Generic Thirdparty account linking error'
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
      const model = await create(registerConsentData, modelConfig)
      const waitOnParticipantResponseFromALSChannel = RegisterConsentModel.notificationChannel(
        RegisterConsentPhase.waitOnParticipantResponseFromALS,
        registerConsentData.consentsPostRequestAUTH.consentId
      )

      setImmediate(() => {
        publisher.publish(
          waitOnParticipantResponseFromALSChannel,
          participantsTypeIDPutResponse as unknown as Message
        )
      })

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
      const model = await create({ ...registerConsentData, currentState: 'registeredAsAuthoritativeSource' }, modelConfig)
      expect(model.run()).rejects.toEqual(error)
    })

    it('exceptions - registerAuthoritativeSourceWithALS stage', async () => {
      const error = { message: 'error from axios.post', consentReqState: 'broken' }
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
