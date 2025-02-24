/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
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
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 - Paweł Marzec <pawel.marzec@modusbox.com>
 - Lewis Daly <lewis@vesselstech.com>
 - Kevin Leyow <kleyow@gmail.com>
 --------------
 ******/

import { RedisConnection } from './redis-connection'
import { promisify } from 'util'

export class InvalidCallbackIdError extends Error {
  constructor() {
    super('valid callbackId must be positive number')
  }

  // validation logic for callbackId parameter
  static throwIfInvalid(callbackId: number): void {
    if (!(callbackId > 0)) {
      throw new InvalidCallbackIdError()
    }
  }
}

export class InvalidChannelNameError extends Error {
  constructor() {
    super('channel name must be non empty string')
  }

  // validation logic for channel name parameter
  static throwIfInvalid(channel: string): void {
    if (!channel?.length) {
      throw new InvalidChannelNameError()
    }
  }
}

// Message is send via redis publish to NotificationCallbacks
// Message should fully survive the JSON stringify/parse cycle
export type Message = string | number | boolean | Record<string, unknown>

export class InvalidMessageError extends Error {
  public channel: string

  constructor(channel: string) {
    super(`message received on channel: '${channel}' is invalid`)
    this.channel = channel
  }

  static throwIfInvalid(message: Message, channel: string): void {
    if (typeof message === 'undefined' || (typeof message === 'object' && !message)) {
      throw new InvalidMessageError(channel)
    }
  }
}
// NotificationCallback handles the Message
export type NotificationCallback = (channel: string, message: Message, id: number) => void

// PubSub class delivers Message broadcast via Redis PUB/SUB mechanism to registered NotificationHandlers
export class PubSub extends RedisConnection {
  // map where channels with registered notification callbacks are kept
  private callbacks = new Map<string, Map<number, NotificationCallback>>()

  // counter used to generate callback registration id
  private callbackId = 0

  // overload RedisConnection.connect to add listener on messages
  async connect(): Promise<void> {
    await super.connect()
    this.client.on('message', this.broadcastMessage.bind(this))
  }

  // realize message broadcast over the channel to all registered notification callbacks
  protected broadcastMessage(channel: string, stringified: string): void {
    const callbacksForChannel = this.callbacks.get(channel)

    // do nothing if channel doesn't exist
    if (!callbacksForChannel) {
      this.logger.info(`broadcastMessage: no callbacks for '${channel}' channel`)
      return
    }

    // deserialize Message
    // it is 'publish' duty to always send to channel well serialized Messages
    const message: Message = JSON.parse(stringified)

    // do the validation of received Message
    InvalidMessageError.throwIfInvalid(message, channel)

    // broadcast message by calling all callbacks
    callbacksForChannel.forEach((callback: NotificationCallback, id: number): void => callback(channel, message, id))
  }

  // generate next callback id to be used as reference for unregister
  protected get nextCallbackId(): number {
    return ++this.callbackId
  }

  // subscribe notification callback to message channel
  subscribe(channel: string, callback: NotificationCallback): number {
    InvalidChannelNameError.throwIfInvalid(channel)

    // is callbacks map for channel present
    if (!this.callbacks.has(channel)) {
      // initialize the channel callbacks map
      this.callbacks.set(channel, new Map<number, NotificationCallback>())

      // only once time subscribe to Redis channel
      this.client.subscribe(channel)
    }

    const callbacksForChannel = this.callbacks.get(channel)

    // allocate new id for callback
    const id = this.nextCallbackId

    // register callback for given channel
    callbacksForChannel?.set(id, callback)

    // return registration id to be used by unsubscribe method
    return id
  }

  // unsubscribe from channel the notification callback for given callbackId reference
  unsubscribe(channel: string, callbackId: number): boolean {
    // input parameters validation
    InvalidChannelNameError.throwIfInvalid(channel)
    InvalidCallbackIdError.throwIfInvalid(callbackId)

    // do nothing if there is no channel
    const callbacksForChannel = this.callbacks.get(channel)
    if (!callbacksForChannel) {
      return false
    }

    // do nothing if there is no callback for registration id
    if (!callbacksForChannel.has(callbackId)) {
      return false
    }

    // unregister callback
    callbacksForChannel.delete(callbackId)
    return true
  }

  // publish a message to the given channel
  // Message should fully survive the JSON stringify/parse cycle
  async publish(channel: string, message: Message): Promise<void> {
    InvalidChannelNameError.throwIfInvalid(channel)

    // protect against publishing invalid Messages
    InvalidMessageError.throwIfInvalid(message, channel)

    // serialized Messages should be properly deserialized by broadcastMessage
    const stringified = JSON.stringify(message)
    const asyncPublish = promisify(this.client.publish)
    await asyncPublish.call(this.client, channel, stringified)
  }
}
