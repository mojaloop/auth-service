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
 --------------
 ******/

import {
  InvalidHostError,
  InvalidLoggerError,
  InvalidPortError,
  RedisConnection,
  RedisConnectionConfig,
  RedisConnectionError
} from '~/shared/redis-connection'
import { Logger as SDKLogger } from '@mojaloop/sdk-standard-components'
import Redis from 'redis'
import mockLogger from '../mockLogger'
jest.mock('redis')

describe('RedisConnection', () => {
  const defaultTimeout = 100
  const config: RedisConnectionConfig = {
    port: 6789,
    host: 'localhost',
    logger: mockLogger(),
    timeout: defaultTimeout
  }

  beforeEach(() => jest.resetAllMocks())

  it('should be well constructed', () => {
    const redis = new RedisConnection(config)
    expect(redis.port).toBe(config.port)
    expect(redis.host).toEqual(config.host)
    expect(redis.logger).toEqual(config.logger)
    expect(redis.isConnected).toBeFalsy()
    expect(redis.timeout).toBe(defaultTimeout)
  })

  it('should do input validation for port', () => {
    const invalidPort = { ...config }
    invalidPort.port = -1
    expect(() => new RedisConnection(invalidPort)).toThrow(new InvalidPortError())
  })

  it('should do input validation for host', () => {
    const invalidHost = { ...config }
    invalidHost.host = ''
    expect(() => new RedisConnection(invalidHost)).toThrow(new InvalidHostError())
    invalidHost.host = null as unknown as string
    expect(() => new RedisConnection(invalidHost)).toThrow(new InvalidHostError())
  })

  it('should do input validation for logger', () => {
    const invalidLogger = { ...config }
    invalidLogger.logger = null as unknown as SDKLogger.SdkLogger
    expect(() => new RedisConnection(invalidLogger)).toThrow(new InvalidLoggerError())
  })

  it('should connect', async (): Promise<void> => {
    const redis = new RedisConnection(config)
    await redis.connect()
    expect(redis.isConnected).toBeTruthy()
    expect(config.logger.info).toHaveBeenCalledWith(
      `createClient: Connected to REDIS at: ${config.host}:${config.port}`
    )
  })

  it('should connect if already connected', async (): Promise<void> => {
    const redis = new RedisConnection(config)
    await redis.connect()
    expect(redis.isConnected).toBeTruthy()
    await redis.connect()
    expect(redis.isConnected).toBeTruthy()
    expect(config.logger.info).toHaveBeenCalledWith(
      `createClient: Connected to REDIS at: ${config.host}:${config.port}`
    )
  })

  it("should throw if trying to access 'client' property when not connected ", async (): Promise<void> => {
    const redis = new RedisConnection(config)
    expect(redis.isConnected).toBeFalsy()
    expect(() => redis.client).toThrow(new RedisConnectionError(config.port, config.host))
  })

  it('should disconnect when connected', async (): Promise<void> => {
    const redis = new RedisConnection(config)
    await redis.connect()
    expect(redis.isConnected).toBeTruthy()
    await redis.disconnect()
    expect(redis.isConnected).toBeFalsy()
  })

  it('should do nothing at disconnect when not connected', async (): Promise<void> => {
    const redis = new RedisConnection(config)
    expect(redis.isConnected).toBeFalsy()
    await redis.disconnect()
    expect(redis.isConnected).toBeFalsy()
  })

  it('should connect without timeout specified', async (): Promise<void> => {
    const configNoTimeout = { ...config }
    configNoTimeout.timeout = undefined

    const redis = new RedisConnection(configNoTimeout)
    await redis.connect()
    expect(redis.timeout).toEqual(RedisConnection.defaultTimeout)
  })

  it('should PING', async (): Promise<void> => {
    const redis = new RedisConnection(config)
    await redis.connect()
    const pong = await redis.ping()
    expect(pong).toBe(true)
  })

  // The client events are driven by hand so the ready/error ordering and the reconnect timeout are
  // deterministic: the previous real-timer versions raced within 10 ms of each other and, on a slow
  // runner, skipped the reject path (leaving its branches uncovered) while still passing.
  const fakeClient = (): {
    client: Redis.RedisClient
    quit: jest.Mock
    emit: (event: string, err?: Error | null) => void
  } => {
    const handlers: Record<string, (err: Error | null) => void> = {}
    const quit = jest.fn()
    const client = {
      quit,
      on: jest.fn((event: string, cb: (err: Error | null) => void): void => {
        handlers[event] = cb
      })
    } as unknown as Redis.RedisClient
    return { client, quit, emit: (event, err = null) => handlers[event]?.(err) }
  }

  it('should reject when no ready follows the error within the timeout', async (): Promise<void> => {
    jest.useFakeTimers()
    const fake = fakeClient()
    jest.spyOn(Redis, 'createClient').mockImplementationOnce(() => fake.client)
    const redis = new RedisConnection(config)
    const pending = redis.connect()
    const expectation = expect(pending).rejects.toEqual(new Error('emitted'))
    const err = new Error('emitted')
    fake.emit('error', err)
    // a second error while the reconnect timer is running is logged but does not start another timer
    fake.emit('error', new Error('second'))
    jest.advanceTimersByTime(defaultTimeout)
    await expectation
    expect(config.logger.push).toHaveBeenCalledWith({ err })
    expect(config.logger.error).toHaveBeenCalledWith('createClient: Error from REDIS client')
    expect(fake.quit).toHaveBeenCalledTimes(1)
    // a late ready after the rejection is ignored
    fake.emit('ready')
    expect(config.logger.info).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('should not reject if the reconnection succeeds before the timeout', async (): Promise<void> => {
    jest.useFakeTimers()
    const fake = fakeClient()
    jest.spyOn(Redis, 'createClient').mockImplementationOnce(() => fake.client)
    const redis = new RedisConnection(config)
    const pending = redis.connect()
    fake.emit('error', new Error('emitted'))
    jest.advanceTimersByTime(defaultTimeout - 10)
    fake.emit('ready')
    // the reconnect timer still fires, but finds the promise already resolved
    jest.advanceTimersByTime(defaultTimeout)
    await expect(pending).resolves.toBeUndefined()
    expect(config.logger.info).toHaveBeenCalledWith(
      `createClient: Connected to REDIS at: ${config.host}:${config.port}`
    )
    expect(fake.quit).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('should protect against multiple resolution and only log errors arriving after ready', async (): Promise<void> => {
    jest.useFakeTimers()
    const fake = fakeClient()
    jest.spyOn(Redis, 'createClient').mockImplementationOnce(() => fake.client)
    const redis = new RedisConnection(config)
    const pending = redis.connect()
    fake.emit('ready')
    fake.emit('ready')
    const err = new Error('emitted')
    fake.emit('error', err)
    jest.advanceTimersByTime(defaultTimeout * 2)
    await expect(pending).resolves.toBeUndefined()
    expect(config.logger.info).toHaveBeenCalledTimes(1)
    expect(config.logger.push).toHaveBeenCalledWith({ err })
    expect(config.logger.error).toHaveBeenCalledWith('createClient: Error from REDIS client')
    expect(fake.quit).not.toHaveBeenCalled()
    jest.useRealTimers()
  })
})
