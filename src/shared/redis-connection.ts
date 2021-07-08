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

import { RedisClient, createClient } from 'redis'
import { promisify } from 'util'
import { Logger as SDKLogger } from '@mojaloop/sdk-standard-components'

export class RedisConnectionError extends Error {
  public readonly host: string
  public readonly port: number

  constructor (port: number, host: string) {
    super(`can not connect to ${host}:${port}`)
    this.host = host
    this.port = port
  }
}

export class InvalidPortError extends Error {
  constructor () {
    super('port should be non negative number')
  }

  static throwIfInvalid (port: number): void {
    if (!(port > 0)) {
      throw new InvalidPortError()
    }
  }
}

export class InvalidLoggerError extends Error {
  constructor () {
    super('logger should be valid')
  }

  static throwIfInvalid (logger: SDKLogger.Logger): void {
    if (!(logger)) {
      throw new InvalidLoggerError()
    }
  }
}

export class InvalidHostError extends Error {
  constructor () {
    super('host should be non empty string')
  }

  static throwIfInvalid (host: string): void {
    if (!(host?.length > 0)) {
      throw new InvalidHostError()
    }
  }
}

export interface RedisConnectionConfig {
  host: string;
  port: number;
  logger: SDKLogger.Logger;
  timeout?: number
}

export class RedisConnection {
  protected readonly config: RedisConnectionConfig

  private redisClient: RedisClient = null as unknown as RedisClient

  static readonly defaultTimeout = 3000

  constructor (config: RedisConnectionConfig) {
    // input validation
    InvalidHostError.throwIfInvalid(config.host)
    InvalidPortError.throwIfInvalid(config.port)
    InvalidLoggerError.throwIfInvalid(config.logger)

    // keep a flat copy of config with default timeout
    this.config = { timeout: RedisConnection.defaultTimeout, ...config }
  }

  get client (): RedisClient {
    // protect against any attempt to work with not connected redis client
    if (!this.isConnected) {
      throw new RedisConnectionError(this.port, this.host)
    }
    return this.redisClient
  }

  get host (): string {
    return this.config.host
  }

  get port (): number {
    return this.config.port
  }

  get logger (): SDKLogger.Logger {
    return this.config.logger
  }

  get timeout (): number {
    return this.config.timeout || RedisConnection.defaultTimeout
  }

  get isConnected (): boolean {
    return this.redisClient && this.redisClient.connected
  }

  async connect (): Promise<void> {
    // do nothing if already connected
    if (this.isConnected) {
      return
    }

    // connect to redis
    this.redisClient = await this.createClient()
  }

  async disconnect (): Promise<void> {
    // do nothing if already disconnected
    if (!(this.isConnected)) {
      return
    }

    // disconnect from redis
    const asyncQuit = promisify(this.client.quit)
    await asyncQuit.call(this.client)

    // cleanup
    this.redisClient = null as unknown as RedisClient
  }

  async ping (): Promise<boolean> {
    const asyncPing = promisify(this.client.ping)
    const response: string = await asyncPing.call(this.client) as string
    return response === 'PONG'
  }

  private async createClient (): Promise<RedisClient> {
    return new Promise((resolve, reject) => {
      // the newly created redis client
      const client = createClient(this.port, this.host)

      // flags to protect against multiple reject/resolve
      let rejectCalled = false
      let resolveCalled = false
      let timeoutStarted = false

      // let listen on ready message and resolve promise only one time
      client.on('ready', (): void => {
        // do nothing if promise already resolved or rejected
        if (rejectCalled || resolveCalled) {
          return
        }

        this.logger.info(`createClient: Connected to REDIS at: ${this.host}:${this.port}`)

        // remember we resolve the promise
        resolveCalled = true

        // do resolve
        resolve(client)
      })

      // let listen on all redis errors and log them
      client.on('error', (err): void => {
        this.logger.push({ err })
        this.logger.error('createClient: Error from REDIS client')

        // do nothing if promise is already resolved or rejected
        if (resolveCalled || timeoutStarted || rejectCalled) {
          return
        }

        timeoutStarted = true
        // give a chance to reconnect in `this.timeout` milliseconds
        setTimeout(() => {
          // reconnection was success
          if (resolveCalled || rejectCalled) {
            return
          }

          // if we can't connect let quit - reconnection was a failure
          client.quit(() => null)

          // remember that we reject the promise
          rejectCalled = true
          reject(err)
        }, this.timeout)
      })
    })
  }
}
