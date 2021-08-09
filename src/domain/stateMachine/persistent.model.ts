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

// eslint-disable-next-line import/no-named-as-default
import StateMachine, {
  Method,
  StateMachineConfig,
  StateMachineInterface,
  TransitionEvent
} from 'javascript-state-machine'
import { KVS } from '~/shared/kvs'
import { Logger as SDKLogger } from '@mojaloop/sdk-standard-components'

/**
 * @interface ControlledStateMachine
 * @description specialized state machine with init & error transitions
 *              and transition notification methods
 */
export interface ControlledStateMachine extends StateMachineInterface {
  /**
   * @method init
   * @description all controlled state machines needs to be initiated
   */
  init: Method

  /**
   * @method error
   * @description error or exceptions could happen in state machine life cycle,
   *              so we need a transition and corresponding state to reflect this
   */
  error: Method

  /**
   * @method onAfterTransition
   * @description callback called after every transition
   */
  onAfterTransition: Method;

  /**
   * @method onPendingTransition
   * @description callback called when transition is pending,
   *              before calling specialized transition handler
   */
  onPendingTransition: Method;
  onError: Method;
}

/**
 * @interface StateData
 * @description data interface to represent the model's state data
 */
export interface StateData<StateType extends string = string> extends Record<string, unknown> {
  /**
   * @property {StateType=string} currentState
   * @description the model's current state value
   */
  currentState: StateType
}

/**
 * @interface PersistentModelConfig
 * @description config dependencies needed to deliver persistent model features
*/
export interface PersistentModelConfig {
  /**
   * @property {string} key
   * @description the key at which the model instance will be persisted
   */
  key: string;

  /**
   * @property {KVS} kvs
   * @description Key-Value storage used to persist model
   */
  kvs: KVS;

  /**
   * @property {SDKLogger.Logger} logger
   * @description used to send log events
   */
  logger: SDKLogger.Logger;
}

/**
 * @class PersistentModel
 * @description persistent model with defined workflow (life cycle) which operates on state data entity
 * @param {ControlledStateMachine} JSM - type of state machine to handle and execute workflow
 * @param {StateData} Data - type of state data needed by model
 */
export class PersistentModel<JSM extends ControlledStateMachine, Data extends StateData> {
  /**
   * @property {PersistentModelConfig} config
   * @description specified model's dependencies
   *              declared readonly, because it should be only setup at construction
  */
  protected readonly config: PersistentModelConfig

  /**
   * @property {<JSM>} fsm
   * @description  Final State Machine instance which handles/executes workflow's state transitions
   */
  public readonly fsm: JSM

  /**
   * @property {<Data>} data
   * @description state data instance
   */
  public data: Data

  /**
   * @param {<Data>} data - initial state data
   * @param {PersistentModelConfig} config - dependencies
   * @param {StateMachineConfig} specOrig - state machine configuration which describes the model's workflow
   */
  constructor (
    data: Data,
    config: PersistentModelConfig,
    specOrig: StateMachineConfig
  ) {
    // flat copy of parameters
    this.data = { ...data }
    this.config = { ...config }
    const spec = { ...specOrig }

    // prepare transition methods
    spec.methods = {
      // inject basic methods here, so they can be overloaded by spec.methods
      onAfterTransition: this.onAfterTransition.bind(this) as Method,
      onPendingTransition: this.onPendingTransition.bind(this) as Method,

      // copy methods from received state machine specification
      ...spec.methods
    }

    // prepare transitions' specification
    spec.transitions = [
      // inject error transition here, so it can be overloaded by spec.transitions
      { name: 'error', from: '*', to: 'errored' },

      // copy transitions from received state machine specification
      ...spec.transitions
    ]

    // propagate state from data.currentState, then spec.init and use 'none' as default
    spec.init = (data.currentState || spec.init || 'none') as string

    // create a new state machine instance
    this.fsm = new StateMachine(spec) as JSM
  }

  // accessors to config properties
  get logger (): SDKLogger.Logger {
    return this.config.logger
  }

  get key (): string {
    return this.config.key
  }

  get kvs (): KVS {
    return this.config.kvs
  }

  /**
   * @method onAfterTransition
   * @description called after every transition and updates data.currentState
   * @param {TransitionEvent<JSM>)} event - transition's event description
   */
  async onAfterTransition (event: TransitionEvent<JSM>): Promise<void> {
    this.logger.info(`State machine transitioned '${event.transition}': ${event.from} -> ${event.to}`)
    // update internal state data
    this.data.currentState = event.to
  }

  /**
   * @method onPendingTransition
   * @description called when transition starts,
   *              it allows to call `error` transition even
   *              if there is a pending transition
   * @param {string} transition - the name of the pending transition
   */
  onPendingTransition (transition: string): void {
    // allow transitions to 'error' state while other transitions are in progress
    if (transition !== 'error') {
      throw new Error(`Transition '${transition}' requested while another transition is in progress.`)
    }
  }

  /**
   * @method saveToKVS
   * @description stores model's state data in Key-Value Store
   */
  async saveToKVS (): Promise<void> {
    try {
      const res = await this.kvs.set(this.key, this.data)
      this.logger.info({ res })
      this.logger.info(`Persisted model in cache: ${this.key}`)
    } catch (err) {
      this.logger.push({ err })
      this.logger.info(`Error saving model: ${this.key}`)
      throw err
    }
  }
}

/**
 * @name create
 * @description allows to create a new instance of persistent model
 * @param {<Data>} data - initial model's state data
 * @param {<PersistentModelConfig>} config - model's configured dependencies
 * @param {<StateMachineConfig>} spec - state machine configuration
 * @returns {Promise<PersistenModel<JSM, Data>>} persistent model instance
 */
export async function create<JSM extends ControlledStateMachine, Data extends StateData> (
  data: Data,
  config: PersistentModelConfig,
  spec: StateMachineConfig
): Promise <PersistentModel<JSM, Data>> {
  // create a new model
  const model = new PersistentModel<JSM, Data>(data, config, spec)

  // enforce to finish any transition to state specified by data.currentState or spec.init
  await model.fsm.state
  return model
}

/**
 * @name loadFromKVS
 * @description loads PersistentModel from KVS storage using given `config` and `spec`
 * @param {PersistentModelConfig} config - model's configured dependencies - should be the same used with `create`
 * @param {StateMachineConfig} spec - state machine configuration - should be the same used with `create`
 * @returns {Promise <PersistentModel<JSM, Data>>} persistent model instance loaded from KVS
 */
export async function loadFromKVS<JSM extends ControlledStateMachine, Data extends StateData> (
  config: PersistentModelConfig,
  spec: StateMachineConfig
): Promise <PersistentModel<JSM, Data>> {
  try {
    const data = await config.kvs.get<Data>(config.key)
    if (!data) {
      throw new Error(`No data found in KVS for: ${config.key}`)
    }
    config.logger.push({ data })
    config.logger.info('data loaded from KVS')
    return new PersistentModel<JSM, Data>(data, config, spec)
  } catch (err) {
    config.logger.push({ err })
    config.logger.info(`Error loading data from KVS for key: ${config.key}`)
    throw err
  }
}
