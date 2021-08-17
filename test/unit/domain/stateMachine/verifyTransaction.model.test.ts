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


// mock KVS default exported class
jest.mock('~/shared/kvs')

// mock PubSub default exported class
jest.mock('~/shared/pub-sub')

jest.mock('axios')


const verificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
    challenge: 'some challenge base64 encoded',
      consentId: '8d34f91d-d078-4077-8263-2c0498dhbjr',
        signedPayloadType: 'FIDO',
          signedPayload: {
    id: '45c-TkfkjQovQeAWmOy-RLBHEJ_e4jYzQYgD8VdbkePgM5d98BaAadadNYrknxgH0jQEON8zBydLgh1EqoC9DA',
      rawId: '45c+TkfkjQovQeAWmOy+RLBHEJ/e4jYzQYgD8VdbkePgM5d98BaAadadNYrknxgH0jQEON8zBydLgh1EqoC9DA==',
        response: {
      authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAACA==',
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQUFBQUFBQUFBQUFBQUFBQUFBRUNBdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIxODEiLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ==',
          signature: 'MEUCIDcJRBu5aOLJVc/sPyECmYi23w8xF35n3RNhyUNVwQ2nAiEA+Lnd8dBn06OKkEgAq00BVbmH87ybQHfXlf1Y4RJqwQ8='
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
      thirdpartyRequests: { } as unknown as ThirdpartyRequests,
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

  // TODO: do we need notification channel? Delete if not...
  // describe('notificationChannel', () => {
  //   it('should generate proper channel name', () => {
  //     const id = '123'
  //     expect(VerifyTransactionModel.notificationChannel(
  //       RegisterConsentPhase.waitOnParticipantResponseFromALS,
  //       id)).toEqual('RegisterConsent_waitOnParticipantResponseFromALS_123')
  //   })

  //   it('input validation', () => {
  //     expect(
  //       () => RegisterConsentModel.notificationChannel(
  //         RegisterConsentPhase.waitOnParticipantResponseFromALS,
  //         null as unknown as string
  //       )
  //     ).toThrow()
  //   })
  // })


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

    it('start', async () => {
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
