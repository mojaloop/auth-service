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

 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import { KVS } from '~/shared/kvs'
import { RedisConnectionConfig } from '~/shared/redis-connection'
import { StateMachineConfig, Method } from 'javascript-state-machine'
import {
  ControlledStateMachine,
  PersistentModel,
  PersistentModelConfig,
  StateData,
  create,
  loadFromKVS
} from '~/model/persistent.model'
import { mocked } from 'ts-jest/utils'
import mockLogger from 'test/unit/mockLogger'
import shouldNotBeExecuted from 'test/unit/shouldNotBeExecuted'
import sortedArray from 'test/unit/sortedArray'

// mock KVS default exported class
jest.mock('~/shared/kvs')

describe('PersistentModel', () => {
  interface TestStateMachine extends ControlledStateMachine {
    start2End: Method;
    start2Middle: Method;
    middle2End: Method;

    onStart2End: Method;
    onStart2Middle: Method;
    onMiddle2End: Method;
  }

  interface TestData extends StateData {
    the: string;
  }

  const KVSConfig: RedisConnectionConfig = {
    port: 6789,
    host: 'localhost',
    logger: mockLogger()
  }
  let modelConfig: PersistentModelConfig
  let smConfig: StateMachineConfig

  let data: TestData

  function checkPSMLayout (pm: PersistentModel<TestStateMachine, TestData>, optData?: TestData) {
    expect(pm).toBeTruthy()
    expect(pm.fsm.state).toEqual(optData?.currentState || smConfig.init || 'none')

    expect(pm.data).toBeDefined()
    expect(pm.data.currentState).toEqual(pm.fsm.state)
    // test get accessors
    expect(pm.kvs).toEqual(modelConfig.kvs)
    expect(pm.key).toEqual(modelConfig.key)
    expect(pm.logger).toEqual(modelConfig.logger)

    expect(typeof pm.onAfterTransition).toEqual('function')
    expect(typeof pm.onPendingTransition).toEqual('function')
    expect(typeof pm.saveToKVS).toEqual('function')
    expect(typeof pm.fsm.init).toEqual('function')
    expect(typeof pm.fsm.start2End).toEqual('function')
    expect(typeof pm.fsm.start2Middle).toEqual('function')
    expect(typeof pm.fsm.middle2End).toEqual('function')
    expect(typeof pm.fsm.error).toEqual('function')
    expect(sortedArray(pm.fsm.allStates())).toEqual(['end', 'errored', 'middle', 'none', 'start'])
    expect(sortedArray(pm.fsm.allTransitions())).toEqual(['error', 'init', 'middle2End', 'start2End', 'start2Middle'])
  }

  beforeEach(async () => {
    smConfig = {
      init: 'start',
      transitions: [
        { name: 'start2End', from: 'start', to: 'end' },
        { name: 'start2Middle', from: 'start', to: 'middle' },
        { name: 'middle2End', from: 'middle', to: 'end' }
      ],
      methods: {
        onStart2End: jest.fn(() => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve()
            }, 50)
          })
        }),
        onStart2Middle: jest.fn(() => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve()
            }, 100)
          })
        }),
        onMiddle2End: jest.fn(() => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve()
            }, 100)
          })
        }),
        onError: jest.fn(() => {
          console.error('onError')
        })
      }
    }

    // model config
    modelConfig = {
      kvs: new KVS(KVSConfig),
      key: 'cache-key',
      logger: KVSConfig.logger
    }
    // test data
    data = { the: 'data' } as TestData

    await modelConfig.kvs.connect()
  })

  afterEach(async () => {
    await modelConfig.kvs.disconnect()
  })

  it('module layout', () => {
    expect(typeof PersistentModel).toEqual('function')
    expect(typeof loadFromKVS).toEqual('function')
    expect(typeof create).toEqual('function')
  })

  it('create with initial state not specified -> no auto transition', async () => {
    const withoutInitialState = { ...smConfig }
    delete withoutInitialState.init
    const pm = await create<TestStateMachine, TestData>(data, modelConfig, withoutInitialState)
    checkPSMLayout(pm, { currentState: 'none' } as TestData)
  })

  it('create with initial state not specified -> with auto transition to start', async () => {
    const withoutInitialStateAuto = { ...smConfig }
    delete withoutInitialStateAuto.init
    withoutInitialStateAuto.transitions.push({ name: 'init', from: 'none', to: 'start' })
    const pm = await create<TestStateMachine, TestData>(data, modelConfig, withoutInitialStateAuto)
    checkPSMLayout(pm, { currentState: 'start' } as TestData)
    expect(KVSConfig.logger.info).toHaveBeenCalledWith('State machine transitioned \'init\': none -> start')
  })

  it('create always with auto transition to default state when auto transition defined', async () => {
    const withInitialStateAutoOverload = { ...smConfig }
    // we would like to set initial state to 'end'
    withInitialStateAutoOverload.init = 'end'

    // and there is initial auto transition which should transist to start
    withInitialStateAutoOverload.transitions.push({ name: 'init', from: 'none', to: 'start' })

    const pm = await create<TestStateMachine, TestData>(
      data, modelConfig, withInitialStateAutoOverload
    )

    // check auto transition ended at 'start' not 'end'
    checkPSMLayout(pm, { currentState: 'start' } as TestData)
    expect(KVSConfig.logger.info).toHaveBeenCalledWith('State machine transitioned \'init\': none -> start')
  })
  it('create with initial state \'end\' specified', async () => {
    const endConfig = { ...smConfig }
    endConfig.init = 'end'
    const pm = await create<TestStateMachine, TestData>(data, modelConfig, endConfig)
    checkPSMLayout(pm, { currentState: 'end' } as TestData)
    expect(KVSConfig.logger.info).toHaveBeenCalledWith('State machine transitioned \'init\': none -> end')
  })

  it('create with initial state \'start\' specified', async () => {
    const pm = await create<TestStateMachine, TestData>(data, modelConfig, smConfig)
    checkPSMLayout(pm, { currentState: 'start' } as TestData)
  })
  describe('transition notifications', () => {
    it('should call notification handlers', async () => {
      const pm = await create<TestStateMachine, TestData>(data, modelConfig, smConfig)
      checkPSMLayout(pm, { currentState: 'start' } as TestData)

      await pm.fsm.start2Middle()
      expect(smConfig.methods!.onStart2Middle).toBeCalledTimes(1)
      await pm.fsm.middle2End()
      expect(smConfig.methods!.onMiddle2End).toBeCalledTimes(1)
    })
  })
  describe('onPendingTransition', () => {
    it('should throw error if not `error` transition', async () => {
      const pm = new PersistentModel<TestStateMachine, TestData>(data, modelConfig, smConfig)
      checkPSMLayout(pm, { currentState: 'start' } as TestData)
      expect(
        () => pm.fsm.start2Middle()
      ).toThrowError('Transition \'start2Middle\' requested while another transition is in progress')
    })

    it('should not throw error if `error` transition called when any transition is pending', async () => {
      const pm = await create<TestStateMachine, TestData>(data, modelConfig, smConfig)
      checkPSMLayout(pm)
      expect(pm.fsm.state).toBe('start')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(pm.fsm._fsm.pending).toBe(false)
      // not awaiting on start2Middle to resolve!
      pm.fsm.start2Middle()
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(pm.fsm._fsm.pending).toBe(true)
      expect(() => pm.fsm.error()).not.toThrow()
    })
  })

  describe('loadFromKVS', () => {
    it('should properly call `KVS.get`, get expected data in `context.data` and setup state of machine', async () => {
      const dataFromCache: TestData = { the: 'data from cache', currentState: 'end' }
      mocked(modelConfig.kvs.get).mockImplementationOnce(async () => dataFromCache)
      const pm = await loadFromKVS<TestStateMachine, TestData>(modelConfig, smConfig)
      checkPSMLayout(pm, dataFromCache)

      // to get value from cache proper key should be used
      expect(mocked(modelConfig.kvs.get)).toHaveBeenCalledWith(modelConfig.key)

      // check what has been stored in `data`
      expect(pm.data).toEqual(dataFromCache)
    })

    it('should throw when received invalid data from `KVS.get`', async () => {
      mocked(modelConfig.kvs.get).mockImplementationOnce(async () => null)
      try {
        await loadFromKVS<TestStateMachine, TestData>(modelConfig, smConfig)
        shouldNotBeExecuted()
      } catch (error) {
        expect(error.message).toEqual(`No data found in KVS for: ${modelConfig.key}`)
      }
    })

    it('should propagate error received from `KVS.get`', async () => {
      mocked(modelConfig.kvs.get).mockImplementationOnce(jest.fn(async () => { throw new Error('error from KVS.get') }))
      expect(() => loadFromKVS<TestStateMachine, TestData>(modelConfig, smConfig))
        .rejects.toEqual(new Error('error from KVS.get'))
    })
  })
  describe('saveToKVS', () => {
    it('should store using KVS.set', async () => {
      mocked(modelConfig.kvs.set).mockImplementationOnce(() => { throw new Error('error from KVS.set') })

      const pm = await create<TestStateMachine, TestData>(data, modelConfig, smConfig)
      checkPSMLayout(pm)

      // transition `init` should encounter exception when saving `context.data`
      expect(() => pm.saveToKVS()).rejects.toEqual(new Error('error from KVS.set'))
      expect(mocked(modelConfig.kvs.set)).toBeCalledWith(pm.key, pm.data)
    })
    it('should propagate error from KVS.set', async () => {
      mocked(modelConfig.kvs.set).mockImplementationOnce(() => { throw new Error('error from KVS.set') })

      const pm = await create<TestStateMachine, TestData>(data, modelConfig, smConfig)
      checkPSMLayout(pm)

      // transition `init` should encounter exception when saving `context.data`
      expect(() => pm.saveToKVS()).rejects.toEqual(new Error('error from KVS.set'))
      expect(mocked(modelConfig.kvs.set)).toBeCalledWith(pm.key, pm.data)
    })
  })
})
