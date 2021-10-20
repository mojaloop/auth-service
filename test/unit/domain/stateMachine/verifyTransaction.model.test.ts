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
import shouldNotBeExecuted from 'test/unit/shouldNotBeExecuted'

const atob = require('atob')
const btoa = require('btoa')


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

// yubico example
const validConsent: ConsentDomain.Consent = {
  consentId: 'c121df2a-2a36-4163-ad04-2c8f2913dadd',
  participantId: 'dfspa',
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
  createdAt: new Date('2021-01-01'),
}


// yubico example
const verificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  // not a 'real' challenge from mojaloop, but taken from a demo credential here
  // https://demo.yubico.com/webauthn-technical/login
  // we decode to binary so that we can line up with the challenge in clientDataJSON,
  // which navigator.credentials.get converts to base64 encoding before signing
  challenge: atob('quFYNCTWwfM6VDKmrxTT12zbSOhWJyWglzKoqF0PjMU='),
  consentId: '8d34f91d-d078-4077-8263-2c0498dhbjr',
  signedPayloadType: 'FIDO',
  signedPayload: {
    "id": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA"),
    "rawId": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA"),
    "response": {
      "authenticatorData": "xGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7cBAAAABA==",
      "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJxdUZZTkNUV3dmTTZWREttcnhUVDEyemJTT2hXSnlXZ2x6S29xRjBQak1VIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uZ2V0In0=",
      "signature": "MEUCIQCb/nwG57/d8lWXfbBA7HtgIf8wM6A1XJ+LgZlEnClJBAIgKV8FAGkE9B8UXenmp589uTPgkDCJh5jiNMs+Tx2GQG8="
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
      thirdpartyRequests: {
        putThirdpartyRequestsVerifications: jest.fn(() => Promise.resolve({ statusCode: 200 })),
        putThirdpartyRequestsVerificationsError: jest.fn(() => Promise.resolve({ statusCode: 200 })),
      } as unknown as ThirdpartyRequests,
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
    const retreiveConsentData: VerifyTransactionData = {
      currentState: 'start',
      participantDFSPId: 'dfspa',
      verificationRequest
    }

    it('should be well constructed', async () => {
      const model = await create(retreiveConsentData, modelConfig)
      checkModelLayout(model, retreiveConsentData)
    })


    it('fetches the consent from the database', async () => {
      // Arrange
      mockGetConsent.mockResolvedValueOnce(validConsent)
      const model = await create(retreiveConsentData, modelConfig)

      // Act
      await model.fsm.retreiveConsent()

      // Assert
      expect(mockGetConsent).toHaveBeenCalledTimes(1)
      expect(model.data.currentState).toEqual('consentRetreived')
    })

    it('responds with an error if something went wrong fetching the consent', async () => {
      // Arrange
      mockGetConsent.mockImplementationOnce(() => {
        throw new Error('test error')
      })
      const model = await create(retreiveConsentData, modelConfig)

      // Act
      try {
        await model.fsm.retreiveConsent()
        shouldNotBeExecuted()
      } catch (error: any) {
        // Assert
        expect(mockGetConsent).toHaveBeenCalledTimes(1)
        expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerificationsError).toHaveBeenCalledTimes(1)
        expect(error.message).toEqual('test error')
      }
    })
  })

  describe('onVerifyTransaction', () => {
    const verifyTransactionData: VerifyTransactionData = {
      currentState: 'consentRetreived',
      participantDFSPId: 'dfspa',
      verificationRequest,
      consent: validConsent
    }

    it('verifies that the transaction is correct', async () => {
      // Arrange
      const model = await create(verifyTransactionData, modelConfig)

      // Act
      await model.fsm.verifyTransaction()

      // Assert
      expect(model.data.currentState).toEqual('transactionVerified')
    })

    it('responds with an error if the transaction signature does not match the publickey', async () => {
      // Arrange
      const invalidTransactionData = JSON.parse(JSON.stringify(verifyTransactionData))
      // the wrong publickey:
      invalidTransactionData.consent.credentialPayload = '-----BEGIN PUBLIC KEY-----\n' +
        'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEgAxzw4HxmDWmxJ8dWuzV/DR6+N1diG3U\n' +
        'rPwJWdQbUAvDtQ+mRKPl8lD6WrN6PajHwxyeBE77QyOrOCGWn16xzQ==\n' +
        '-----END PUBLIC KEY-----'
      const model = await create(invalidTransactionData, modelConfig)

      // Act
      try {
        await model.fsm.verifyTransaction()
        shouldNotBeExecuted()
      } catch (error: any) {
        // Assert
        expect(error.message).toEqual('signature validation failed')
        expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerificationsError).toHaveBeenCalledTimes(1)
      }
    })

    it('responds with an error if clientDataJSON cannot be parsed', async () => {
      // Arrange
      const invalidTransactionData: VerifyTransactionData = JSON.parse(JSON.stringify(verifyTransactionData))
      // Add an assertion to help ts out
      if (invalidTransactionData.verificationRequest.signedPayloadType !== 'FIDO') {
        throw new Error('test data error')
      }
      invalidTransactionData.verificationRequest.signedPayload.response.clientDataJSON = 
        btoa('{"notChallenge":"quFYNCTWwfM6VDKmrxTT12zbSOhWJyWglzKoqF0PjMU","clientExtensions":{},"hashAlgorithm":"SHA-256","origin":"https://demo.yubico.com","type":"webauthn.get"}')
      
      const model = await create(invalidTransactionData, modelConfig)

      // Act
      try {
        await model.fsm.verifyTransaction()
        shouldNotBeExecuted()
      } catch (error: any) {
        // Assert
        expect(error.message).toEqual('clientData challenge was not a string')
        expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerificationsError).toHaveBeenCalledTimes(1)
      }
    })

    it('responds with an error if the consent status is REVOKED', async () => {
      // Arrange
      const invalidTransactionData: VerifyTransactionData = JSON.parse(JSON.stringify(verifyTransactionData))
      invalidTransactionData.consent!.status = 'REVOKED'
      invalidTransactionData.consent!.revokedAt = new Date('2020-01-1')
     
      const model = await create(invalidTransactionData, modelConfig)

      // Act
      try {
        await model.fsm.verifyTransaction()
        shouldNotBeExecuted()
      } catch (error: any) {
        // Assert
        expect(error.message).toEqual('Incorrect Consent status c121df2a-2a36-4163-ad04-2c8f2913dadd')
        expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerificationsError).toHaveBeenCalledTimes(1)
      }
    })

    it('responds with an error if the signedPayloadType !== FIDO', async () => {
      // Arrange
      const invalidTransactionData: VerifyTransactionData = JSON.parse(JSON.stringify(verifyTransactionData))
      invalidTransactionData.verificationRequest = {
        verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
        challenge: 'quFYNCTWwfM6VDKmrxTT12zbSOhWJyWglzKoqF0PjMU=',
        consentId: '8d34f91d-d078-4077-8263-2c0498dhbjr',
        signedPayloadType: 'GENERIC',
        signedPayload: '12345678'
      }
    
      const model = await create(invalidTransactionData, modelConfig)

      // Act
      try {
        await model.fsm.verifyTransaction()
        shouldNotBeExecuted()
      } catch (error: any) {
        // Assert
        expect(error.message).toEqual('Auth-Service currently only supports verifying FIDO-based credentials')
        expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerificationsError).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('onSendCallbackToDFSP', () => {
    const sendCallbackData: VerifyTransactionData = {
      currentState: 'transactionVerified',
      participantDFSPId: 'dfspa',
      verificationRequest,
      consent: validConsent
    }

    it('sends the callback to the DFSP', async () => { 
      // Arrange
      const model = await create(sendCallbackData, modelConfig)
  
      // Act
      await model.fsm.sendCallbackToDFSP()

      // Assert
      expect(model.data.currentState).toEqual('callbackSent')
      expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerifications).toHaveBeenCalledTimes(1)
    })

    it('sends an error callback to the DFSP if the original request fails', async () => {
      // Arrange
      const model = await create(sendCallbackData, modelConfig)
      modelConfig.thirdpartyRequests.putThirdpartyRequestsVerifications
      // @ts-ignore - mocked function
        .mockRejectedValueOnce(new Error('Test Error'))

      // Act
      try {
        await model.fsm.sendCallbackToDFSP()
        shouldNotBeExecuted()
      } catch (err: any) { 
        // Assert
        expect(err.message).toBe('Test Error')
        expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerifications).toHaveBeenCalledTimes(1)
        expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerificationsError).toHaveBeenCalledTimes(1)
      }
    })
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

    it('start', async () => {
      // Arrange
      mockGetConsent.mockResolvedValueOnce(validConsent)
      const model = await create(registerConsentData, modelConfig)
      
      // Act
      await model.run()
      
      // Assert
      // check that the fsm was able complete the workflow
      expect(model.data.currentState).toEqual('callbackSent')
      expect(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerifications)
        .toHaveBeenCalledTimes(1)
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
      mocked(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerifications).mockImplementationOnce(
        () => {
          throw error
        }
      )
      const model = await create({ ...registerConsentData, currentState: 'transactionVerified' }, modelConfig)

      expect(async () => await model.run()).rejects.toEqual(error)
    })

    it('exceptions - Error - sendCallbackToDFSP stage', async () => {
      const error = { message: 'error from modelConfig.thirdpartyRequests.putConsents', consentReqState: 'broken' }
      mocked(modelConfig.thirdpartyRequests.putThirdpartyRequestsVerifications).mockImplementationOnce(
        () => {
          throw error
        }
      )
      const model = await create({ ...registerConsentData, currentState: 'transactionVerified' }, modelConfig)
      expect(model.run()).rejects.toEqual(error)
    })
  })
})
