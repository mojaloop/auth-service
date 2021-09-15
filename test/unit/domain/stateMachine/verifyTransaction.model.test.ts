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

- Lewis Daly <lewisd@crosslaketech.com>
--------------
******/


import { KVS } from '~/shared/kvs'
import {
  Message,
  NotificationCallback,
  PubSub
} from '~/shared/pub-sub'
import { ThirdpartyRequests, MojaloopRequests } from '@mojaloop/sdk-standard-components'

import { RedisConnectionConfig } from '~/shared/redis-connection'
import { mocked } from 'ts-jest/utils'

import mockLogger from 'test/unit/mockLogger'
import sortedArray from 'test/unit/sortedArray'
import config from '~/shared/config'
import { VerifyTransactionData, VerifyTransactionModelConfig } from '~/domain/stateMachine/verifyTransaction.interface'
import { create, VerifyTransactionModel } from '~/domain/stateMachine/verifyTransaction.model'
import {
  thirdparty as tpAPI
} from '@mojaloop/api-snippets'
import * as ConsentDomain from '~/domain/consents'
const atob = require('atob')


// mock KVS default exported class
jest.mock('~/shared/kvs')

// mock PubSub default exported class
jest.mock('~/shared/pub-sub')

// // mock ConsentDomain functions
// jest.mock(`~/domain/consents`)

jest.mock('axios')

const mockGetConsent = jest.spyOn(ConsentDomain, 'getConsent')
// yubi demo
const credential: tpAPI.Schemas.VerifiedCredential = {
  credentialType: 'FIDO',
  status: 'VERIFIED',
  payload: {
    "id": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA"),
    "rawId": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA=="),
    "response": {
      "attestationObject": "o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEgwRgIhAOrrUscl/GRHvjoAtJE6KbgQxUSj3vwp3Ztmh9nQEvuSAiEAgDjZEL8PKFvgJnX7JCk260lOeeht5Ffe/kmA9At17a9jeDVjgVkCwTCCAr0wggGloAMCAQICBAsFzVMwDQYJKoZIhvcNAQELBQAwLjEsMCoGA1UEAxMjWXViaWNvIFUyRiBSb290IENBIFNlcmlhbCA0NTcyMDA2MzEwIBcNMTQwODAxMDAwMDAwWhgPMjA1MDA5MDQwMDAwMDBaMG4xCzAJBgNVBAYTAlNFMRIwEAYDVQQKDAlZdWJpY28gQUIxIjAgBgNVBAsMGUF1dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xJzAlBgNVBAMMHll1YmljbyBVMkYgRUUgU2VyaWFsIDE4NDkyOTYxOTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCEab7G1iSXLCsEYX3wq46i0iBAUebEe//VV4H2XUb0rF2olLe5Z7OOFmSBbs+oov4/X/H2nXAVCcq5IWOWR/FqjbDBqMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS4xMBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEBSaICGO9kEzlriB+NW38fUwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAPv6j3z0q4HJXj34E0N1aS2jbAa/oYy4YtOC4c0MYkRlsGEvrwdUzoj13i7EECMG5qkFOdXaFWwk2lxizSK9c72ywMIZy1h+4vZuGoQqmgs6MLU7wkO1QVBj+U9TOHmJ6KPNyAwlY0I/6WRvEGIDhjooM7RqFgH+QlnFBegtFMhWzjcFHKiRJdkC06Gv+xPFUY5uFuOiAFJY2JDg1WQEr/Id8C0TsfaeU0gZUsprcHbpcUHvwym3zUrzN3nQNLqfhCCSizjlPkE0dmUFeOnxFtf4oepvL3GmOi9zVtHmKXO013oo1CQIKFLcmv785p0QHnLmPW53KCbfD67y9oq9pA2hhdXRoRGF0YVjExGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7dBAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD3Zt06R0Mb5mDHTSnGN0eovDx0XGarb0khbLCadDkGsHITDmAZ6T0OxPewj8v3Gk8TzWFSS/hO3E/xwZuLCLjSlAQIDJiABIVggiSfmVgOyesk2SDOaPhShPbnahfrl3Vs0iQUW6QF4IHUiWCDi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==",
      "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJBcEZqVmZSVFF3NV9OUjRZNXBvVHo4a3RkM2dhNGpJNUx5NjJfZzk3b0ZrIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0="
    },
    type: 'public-key'
  }
}

const validConsent: ConsentDomain.Consent = {
  consentId: expect.stringMatching('.*'),
  participantId: expect.stringMatching('.*'),
  scopes: [
    {
      accountId: 'as2342',
      actions: ['accounts.getBalance', 'accounts.transfer'],
    },
    {
      accountId: 'as22',
      actions: ['accounts.getBalance'],
    },
  ],
  credential: credential,
  status: 'VERIFIED',
  credentialCounter: 0,
  credentialPayload: '-----BEGIN PUBLIC KEY-----\n' +
    'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEiSfmVgOyesk2SDOaPhShPbnahfrl\n' +
    '3Vs0iQUW6QF4IHXi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==\n' +
    '-----END PUBLIC KEY-----\n',
  createdAt: expect.objectContaining({}),
}

const verificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  // challenge: '0fd916df0d0f9ecac2df16906027838bae2aa87935cf3e1a3a71971635da1844',
  // not a 'real' challenge from mojaloop, but taken from a demo credential here
  // https://demo.yubico.com/webauthn-technical/login
  challenge: 'quFYNCTWwfM6VDKmrxTT12zbSOhWJyWglzKoqF0PjMU=',
  consentId: '8d34f91d-d078-4077-8263-2c0498dhbjr',
  signedPayloadType: 'FIDO',
  signedPayload: {
    // id: '45c-TkfkjQovQeAWmOy-RLBHEJ_e4jYzQYgD8VdbkePgM5d98BaAadadNYrknxgH0jQEON8zBydLgh1EqoC9DA',
    // rawId: '45c+TkfkjQovQeAWmOy+RLBHEJ/e4jYzQYgD8VdbkePgM5d98BaAadadNYrknxgH0jQEON8zBydLgh1EqoC9DA==',
    // response: {
    //   authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAACA==',
    //   clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQUFBQUFBQUFBQUFBQUFBQUFBRUNBdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIxODEiLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ==',
    //   signature: 'MEUCIDcJRBu5aOLJVc/sPyECmYi23w8xF35n3RNhyUNVwQ2nAiEA+Lnd8dBn06OKkEgAq00BVbmH87ybQHfXlf1Y4RJqwQ8='
    // },
    "id": "xLTeD-OP1DVEh7tviGu0jDRuN0H8KGRIJBstMc96XbtpGBi8MXvtSArI3IAdcJiDMAHhjugGM1Gz9F-1u8aQBA",
    "rawId": "xLTeD-OP1DVEh7tviGu0jDRuN0H8KGRIJBstMc96XbtpGBi8MXvtSArI3IAdcJiDMAHhjugGM1Gz9F-1u8aQBA",
    "response": {
      "authenticatorData": "xGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7cBAAAAAw==",
      "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJhdUQwQzdvUF9PQldfdW9UZ3gzRzZOU3ZJbDdXLXV3RG9PR1hDU0RwR2VrIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uZ2V0In0=",
      "signature": "MEUCIQDmiC6+ugp9tU4Czl3mXaTByykjKdcrn+4vWkk7K5mGTwIgOBt3xwuaovUxBMdvtQnaY+pWKunIGPtXdnLNa9x1wlA="
    },
    type: 'public-key'
  }
}

describe('VerifyTransactionModel', () => {
  const connectionConfig: RedisConnectionConfig = {
    port: 6789,
    host: 'localhost',
    logger: mockLogger()
  }
  let modelConfig: VerifyTransactionModelConfig
  let publisher: PubSub

  beforeEach(async () => {
    jest.clearAllMocks()

    let subId = 0
    let handler: NotificationCallback

    publisher = new PubSub(connectionConfig)
    await publisher.connect()

    modelConfig = {
      key: 'cache-key',
      kvs: new KVS(connectionConfig),
      subscriber: new PubSub(connectionConfig),
      logger: connectionConfig.logger,
      mojaloopRequests: {
        _put: jest.fn(() => Promise.resolve({ statusCode: 200 })),
      } as unknown as MojaloopRequests,
      thirdpartyRequests: {} as unknown as ThirdpartyRequests,
      authServiceParticipantFSPId: config.PARTICIPANT_ID,
      requestProcessingTimeoutSeconds: 3
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

  function checkModelLayout(VerifyTransactionModel: VerifyTransactionModel, optData?: VerifyTransactionData) {
    expect(VerifyTransactionModel).toBeTruthy()
    expect(VerifyTransactionModel.data).toBeDefined()
    expect(VerifyTransactionModel.fsm.state).toEqual(optData?.currentState || 'start')

    // check new getters
    expect(VerifyTransactionModel.subscriber).toEqual(modelConfig.subscriber)
    expect(VerifyTransactionModel.thirdpartyRequests).toEqual(modelConfig.thirdpartyRequests)
    expect(VerifyTransactionModel.mojaloopRequests).toEqual(modelConfig.mojaloopRequests)

    // check is fsm correctly constructed
    expect(typeof VerifyTransactionModel.fsm.init).toEqual('function')
    expect(typeof VerifyTransactionModel.fsm.retreiveConsent).toEqual('function')
    expect(typeof VerifyTransactionModel.fsm.verifyTransaction).toEqual('function')
    expect(typeof VerifyTransactionModel.fsm.sendCallbackToDFSP).toEqual('function')

    // check fsm notification handler
    expect(typeof VerifyTransactionModel.onRetreiveConsent).toEqual('function')
    expect(typeof VerifyTransactionModel.onVerifyTransaction).toEqual('function')
    expect(typeof VerifyTransactionModel.onSendCallbackToDFSP).toEqual('function')

    expect(sortedArray(VerifyTransactionModel.fsm.allStates())).toEqual([
      'callbackSent',
      'consentRetreived',
      'errored',
      'none',
      'start',
      'transactionVerified'
    ])
    expect(sortedArray(VerifyTransactionModel.fsm.allTransitions())).toEqual([
      'error',
      'init',
      'retreiveConsent',
      'sendCallbackToDFSP',
      'verifyTransaction',
    ])
  }

  it('module layout', () => {
    expect(typeof VerifyTransactionModel).toEqual('function')
    expect(typeof create).toEqual('function')
  })

  describe('onRetreiveConsent', () => {
    const verifyTransactionData: VerifyTransactionData = {
      currentState: 'start',
      participantDFSPId: 'dfspa',
      verificationRequest
    }

    it('should be well constructed', async () => {
      const model = await create(verifyTransactionData, modelConfig)
      checkModelLayout(model, verifyTransactionData)
    })


    it.todo('fetches the consent from the database')
    it.todo('responds with an error if something went wrong fetching the consent')
  })

  describe('onVerifyTransaction', () => {
    it.todo('verifies that the transaction is correct')
    it.todo('responds with an error if the transaction was not signed correctly')
    it.todo('responds with an error if clientDataJSON cannot be parsed')
    it.todo('responds with an error if the consent status is REVOKED')
    it.todo('responds with an error if the signedPayloadType !== FIDO')
  })

  describe('onSendCallbackToDFSP', () => {
    it.todo('sends the callback to the DFSP')
    it.todo('sends an error callback to the DFSP if the original request fails')
  })

  describe('checkModelDataForErrorInformation', () => {
    it('should transition fsm to errored state if errorInformation is truthy', async () => {
      const verifyTransactionData: VerifyTransactionData = {
        participantDFSPId: 'dfspA',
        currentState: 'start',
        verificationRequest,
        errorInformation: {
          errorCode: '3000',
          errorDescription: 'Generic error'
        }
      }
      const model = await create(verifyTransactionData, modelConfig)
      await model.checkModelDataForErrorInformation()

      // check that the fsm was able to transition properly
      expect(model.data.currentState).toEqual('errored')
    })
  })

  // run this test last since it can interfere with other tests because of the
  // timed pubsub publishing
  describe('run workflow', () => {
    const registerConsentData: VerifyTransactionData = {
      currentState: 'start',
      participantDFSPId: 'dfspA',
      verificationRequest
    }

    it.only('start', async () => {
      // Arrange
      mockGetConsent.mockResolvedValueOnce(validConsent)

      // Assert
      const model = await create(registerConsentData, modelConfig)

      // const waitOnParticipantResponseFromALSChannel = RegisterConsentModel.notificationChannel(
      //   RegisterConsentPhase.waitOnParticipantResponseFromALS,
      //   registerConsentData.consentsPostRequestAUTH.consentId
      // )

      // setImmediate(() => {
      //   publisher.publish(
      //     waitOnParticipantResponseFromALSChannel,
      //     participantsTypeIDPutResponse as unknown as Message
      //   )
      // })

      // Act
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

    it('exceptions - sendCallbackToDFSP stage', async () => {
      const error = { message: 'error from modelConfig.thirdpartyRequests.putConsents', consentReqState: 'broken' }
      //@ts-ignore - note this will we removed once we add the putVerifications function to thirdpartyRequests
      mocked(modelConfig.mojaloopRequests._put).mockImplementationOnce(
        () => {
          throw error
        }
      )
      const model = await create({ ...registerConsentData, currentState: 'transactionVerified' }, modelConfig)

      expect(async () => await model.run()).rejects.toEqual(error)
    })

    it('exceptions - Error - sendCallbackToDFSP stage', async () => {
      const error = { message: 'error from modelConfig.thirdpartyRequests.putConsents', consentReqState: 'broken' }
      //@ts-ignore - note this will we removed once we add the putVerifications function to thirdpartyRequests
      mocked(modelConfig.mojaloopRequests._put).mockImplementationOnce(
        () => {
          throw error
        }
      )
      const model = await create({ ...registerConsentData, currentState: 'transactionVerified' }, modelConfig)
      expect(model.run()).rejects.toEqual(error)
    })
  })
})
