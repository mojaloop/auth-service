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
    expect(() => new RedisConnection(invalidPort)).toThrowError(new InvalidPortError())
  })

  it('should do input validation for host', () => {
    const invalidHost = { ...config }
    invalidHost.host = ''
    expect(() => new RedisConnection(invalidHost)).toThrowError(new InvalidHostError())
    invalidHost.host = null as unknown as string
    expect(() => new RedisConnection(invalidHost)).toThrowError(new InvalidHostError())
  })

  it('should do input validation for logger', () => {
    const invalidLogger = { ...config }
    invalidLogger.logger = null as unknown as SDKLogger.Logger
    expect(() => new RedisConnection(invalidLogger)).toThrowError(new InvalidLoggerError())
  })

  it('should connect', async (): Promise<void> => {
    const redis = new RedisConnection(config)
    await redis.connect()
    expect(redis.isConnected).toBeTruthy()
    expect(config.logger.info).toBeCalledWith(`createClient: Connected to REDIS at: ${config.host}:${config.port}`)
  })

  it('should connect if already connected', async (): Promise<void> => {
    const redis = new RedisConnection(config)
    await redis.connect()
    expect(redis.isConnected).toBeTruthy()
    await redis.connect()
    expect(redis.isConnected).toBeTruthy()
    expect(config.logger.info).toBeCalledWith(`createClient: Connected to REDIS at: ${config.host}:${config.port}`)
  })

  it("should throw if trying to access 'client' property when not connected ", async (): Promise<void> => {
    const redis = new RedisConnection(config)
    expect(redis.isConnected).toBeFalsy()
    expect(() => redis.client).toThrowError(new RedisConnectionError(config.port, config.host))
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

  it('should handle redis errors', async (): Promise<void> => {
    const createClientSpy = jest.spyOn(Redis, 'createClient')
    const mockQuit = jest.fn()
    createClientSpy.mockImplementationOnce(
      () =>
        ({
          quit: mockQuit,
          // simulate sending notification on error
          on: jest.fn((msg: string, cb: (err: Error | null) => void): void => {
            // do nothing on ready because we want to enforce error to reject promise
            if (msg === 'ready') {
              setTimeout(() => {
                cb(null)
              }, defaultTimeout + 10)
            }
            if (msg === 'error') {
              setImmediate(() => cb(new Error('emitted')))
            }
          })
        }) as unknown as Redis.RedisClient
    )

    const redis = new RedisConnection(config)
    try {
      await redis.connect()
    } catch (error) {
      expect(error).toEqual(new Error('emitted'))
      expect(config.logger.push).toHaveBeenCalledWith({ err: new Error('emitted') })
      expect(config.logger.error).toHaveBeenCalledWith('createClient: Error from REDIS client')
      expect(mockQuit).toBeCalledTimes(1)
    }
  })

  it('should not reject if reconnection successful', async (): Promise<void> => {
    const createClientSpy = jest.spyOn(Redis, 'createClient')
    const mockQuit = jest.fn()
    createClientSpy.mockImplementationOnce(
      () =>
        ({
          quit: mockQuit,
          // simulate sending notification on error
          on: jest.fn((msg: string, cb: (err: Error | null) => void): void => {
            // do nothing on ready because we want to enforce error to reject promise
            if (msg === 'ready') {
              setTimeout(() => {
                cb(null)
              }, defaultTimeout - 10)
            }
            if (msg === 'error') {
              setImmediate(() => cb(new Error('emitted')))
            }
          })
        }) as unknown as Redis.RedisClient
    )
    const redis = new RedisConnection(config)
    try {
      await redis.connect()
    } catch (error) {
      expect(error).toEqual(new Error('emitted'))
      expect(config.logger.push).toHaveBeenCalledWith({ err: new Error('emitted') })
      expect(config.logger.error).toHaveBeenCalledWith('createClient: Error from REDIS client')
      expect(mockQuit).toBeCalledTimes(1)
    }
  })

  it('should protected against multiple rejection when ready but log errors', (done): void => {
    const createClientSpy = jest.spyOn(Redis, 'createClient')
    const mockQuit = jest.fn()
    createClientSpy.mockImplementationOnce(
      () =>
        ({
          quit: mockQuit,
          // simulate sending notification on error
          on: jest.fn((msg: string, cb: (err: Error | null) => void): void => {
            // invoke ready so promise resolve
            if (msg === 'ready') {
              setImmediate(() => {
                expect(config.logger.info).toHaveBeenCalledTimes(0)
                cb(null)
                expect(config.logger.info).toHaveBeenCalledWith(
                  `createClient: Connected to REDIS at: ${config.host}:${config.port}`
                )
              })
            }
            // after invoke ready trigger error to check the promise wasn't rejected
            if (msg === 'error') {
              setTimeout(() => {
                cb(new Error('emitted'))
                expect(config.logger.push).toHaveBeenCalledWith({ err: new Error('emitted') })
                expect(config.logger.error).toHaveBeenCalledWith('createClient: Error from REDIS client')
                // if promise wasn't reject the quit shouldn't be called
                expect(mockQuit).not.toBeCalled()
                done()
              }, 10)
            }
          })
        }) as unknown as Redis.RedisClient
    )
    const redis = new RedisConnection(config)
    redis.connect().catch(() => {
      // fail test if this line is reached
      // so proof that multiple rejection doesn't happen
      expect(true).toBe(false)
    })
  })
})
