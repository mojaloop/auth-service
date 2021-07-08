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

/**
 * deferredJob is a workflow to
 * - setup pub/sub one time subscription to channel
 * - initiate the workflow start by jobInitiator callback
 * - consume published message by jobListener callback
 * - wait for workflow to fulfill till timeout reached
 */

import { timeout as prTimeout } from 'promise-timeout'
import { PubSub, Message } from '~/shared/pub-sub'

// re-export TimeoutError so client will not be bothered about promise-timeout
export { TimeoutError } from 'promise-timeout'

// function responsible for initiate the flow which should result, somewhere in the future,
// in publishing message to the queue
// parameter to deferredJob(...).init(jobInitiator)
export type JobInitiator = (channel: string, sid: number) => Promise<void>;

// function responsible for consuming the message
// parameter to deferredJob(...).init().job(jobListener)
export type JobListener = (message: Message) => Promise<void>;

// minimal mvp validation for JobInitiator
export class InitiatorRequired extends Error {
  public channel: string

  constructor (channel: string) {
    super(`'init' expects JobInitiator value for channel: '${channel}'`)
    this.channel = channel
  }

  // validation logic
  static throwIfInvalid (channel: string, jobInitiator: JobInitiator): void {
    if (typeof jobInitiator !== 'function') {
      throw new InitiatorRequired(channel)
    }
  }
}

// minimal mvp validation for JobListener
export class ListenerRequired extends Error {
  public channel: string

  constructor (channel: string) {
    super(`'job' expects JobListener value for channel: '${channel}'`)
    this.channel = channel
  }

  // validation logic
  static throwIfInvalid (channel: string, jobListener: JobListener): void {
    if (typeof jobListener !== 'function') {
      throw new ListenerRequired(channel)
    }
  }
}

// minimal mvp validation for timeout
export class PositiveTimeoutRequired extends Error {
  public channel: string

  constructor (channel: string) {
    super(`'wait' expects to be positive number for channel: '${channel}'`)
    this.channel = channel
  }

  // validation logic
  static throwIfInvalid (channel: string, timeout: number): void {
    if (timeout <= 0) {
      throw new PositiveTimeoutRequired(channel)
    }
  }
}

// async method which returns promise resolved when JobListener consume the Message
// this method invokes JobInitiator and setup promise timeout
// throws TimeoutError if Message isn't published or JobListener doesn't finish Message consumption in time
// https://www.npmjs.com/package/promise-timeout
export interface DeferredWait {
  wait: (timeout: number) => Promise<void>
}

// method to setup JobListener
// returns interface with next possible step method - DeferredWait
export interface DeferredJob {
  job: (jobListener: JobListener) => DeferredWait
}

// only two methods are allowed on fresh result from deferredJob function
// these two methods reflects two possible flows
// - init method -> setups JobInitiator and returns interface to setupDeferredJob
//   which will effects in DeferredWait interface at end
// - trigger method -> used to publish message to the channel

export interface DeferredInitOrTrigger {
  init: (jobInitiator: JobInitiator) => DeferredJob
  trigger: (message: Message) => Promise<void>
}

// deferredJob
export default function deferredJob (cache: PubSub, channel: string): DeferredInitOrTrigger {
  return {

    // initialize the deferred job
    init: (jobInitiator: JobInitiator) => {
      // mvp validation for jobInitiator
      InitiatorRequired.throwIfInvalid(channel, jobInitiator)
      return {
        job: (jobListener: JobListener) => {
          // mvp validation for jobListener
          ListenerRequired.throwIfInvalid(channel, jobListener)
          return {
            wait: async (timeout = 2000): Promise<void> => {
              // mvp validation for timeout
              PositiveTimeoutRequired.throwIfInvalid(channel, timeout)

              // cache subscription id
              let sid = 0
              // cache un-subscription wrapper
              const unsubscribe = (): void => {
                // unsubscribe only if elements needed are valid
                if (sid && cache && channel) {
                  cache.unsubscribe(channel, sid)
                  // protect against multiple un-subscription
                  sid = 0
                }
              }

              // eslint-disable-next-line no-async-promise-executor
              const promise = new Promise<void>(async (resolve, reject) => {
                try {
                  // subscribe to the channel to execute the jobListener when the message arrive
                  sid = await cache.subscribe(channel, async (_channel, message: Message) => {
                    // consume message
                    try {
                      // unsubscribe first to be sure the jobListener will be executed only once
                      // and system resources are preserved
                      await unsubscribe()

                      // invoke deferred job to consume received message
                      await jobListener(message)
                    } catch (err) {
                      return reject(err)
                    }

                    // done
                    resolve()
                  })

                  // invoke the async task which should effects in the future
                  // by publishing the message to channel via trigger method
                  // so the jobListener will be invoked
                  await jobInitiator(channel, sid)
                } catch (err) {
                  // unsubscribe from channel in case of any error
                  await unsubscribe()
                  reject(err)
                }
              })

              // ensure the whole process will finish in specified timeout
              // throws error if timeout happens
              return prTimeout(promise, timeout)
                .catch(async (err) => {
                  await unsubscribe()
                  throw err
                })
            }
          }
        }
      }
    },

    // trigger the deferred job
    trigger: async (message: Message): Promise<void> => {
      return cache.publish(channel, message)
    }
  }
}
