/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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

// for mojaloop there is lack for @types files
// to stop typescript complains, we have to declare some modules here
declare module '@mojaloop/central-services-error-handling'{
  export function validateRoutes(options?: object): object;
}
declare module '@mojaloop/central-services-shared'
declare module '@mojaloop/central-services-metrics'
declare module '@hapi/good'
declare module 'hapi-openapi'
declare module 'blipp'
declare module 'string-to-arraybuffer'

// version 2.4 -> https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/javascript-state-machine/index.d.ts
// we are using ^3.1.0
declare module 'javascript-state-machine' {
  type Method = (...args: unknown[]) => void | Promise<void>
  type Data = Record<string, string | number | boolean | unknown>


    interface Transition {
      name: string;
      from: string;
      to: string;
    }
  interface TransitionEvent<JSM> {
    transition: string;
    from: string;
    to: string;
    fsm: JSM;
    event: string;
  }
  interface StateMachineConfig {
    init?: string;
    transitions: Transition[];
    data?: Data;
    methods?: Record<string, Method>;
  }

  interface StateMachineInterface {
    // current state
    state: string;

    // return true if state s is the current state
    is(s: string): boolean

    // return true if transition t can occur from the current state
    can(t: string): boolean

    // return true if transition t cannot occur from the current state
    cannot(t: string): boolean

    // return list of transitions that are allowed from the current state
    transitions(): string[]

    // return list of all possible transitions
    allTransitions(): string[]

    // return list of all possible states
    allStates(): string []
  }
  export default class StateMachine {
    constructor(config: StateMachineConfig)

    // current state
    state: string;

    // return true if state s is the current state
    is(s: string): boolean

    // return true if transition t can occur from the current state
    can(t: string): boolean

    // return true if transition t cannot occur from the current state
    cannot(t: string): boolean

    // return list of transitions that are allowed from the current state
    transitions(): string[]

    // return list of all possible transitions
    allTransitions(): string[]

    // return list of all possible states
    allStates(): string []

    static factory(spec: StateMachineConfig): StateMachine
  }

}
