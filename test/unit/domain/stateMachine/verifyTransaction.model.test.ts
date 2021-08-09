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
import { ThirdpartyRequests, MojaloopRequests } from '@mojaloop/sdk-standard-components';
import {
  RegisterConsentModel,
  create
} from '~/domain/stateMachine/registerConsent.model'
import { RedisConnectionConfig } from '~/shared/redis-connection'
import { mocked } from 'ts-jest/utils'

import mockLogger from 'test/unit/mockLogger'
import sortedArray from 'test/unit/sortedArray'
import { RegisterConsentModelConfig, RegisterConsentData, RegisterConsentPhase } from '~/domain/stateMachine/registerConsent.interface'
import config from '~/shared/config';
import axios from 'axios';
import shouldNotBeExecuted from '../../shouldNotBeExecuted'
import { createAndStoreConsent } from '~/domain/consents'
import * as challenge from '~/domain/challenge'
import * as consents from '~/domain/consents'


// mock KVS default exported class
jest.mock('~/shared/kvs')

// mock PubSub default exported class
jest.mock('~/shared/pub-sub')

jest.mock('axios')

// mocking the createAndStoreConsent function since
// our test payload does not have any scopes so the function will fail
// todo: un-mock this once we have a better payload
jest.mock('~/domain/consents')



describe('VerifyTransactionModel', () => {
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

  function checkRegisterConsentModelLayout(RegisterConsentModel: RegisterConsentModel, optData?: RegisterConsentData) {
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




  describe('onRetreiveConsent', () => {
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