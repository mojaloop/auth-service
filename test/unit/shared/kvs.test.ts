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

import { Callback } from 'redis'
import { InvalidKeyError, KVS } from '~/shared/kvs'
import { RedisConnectionConfig } from '~/shared/redis-connection'
import mockLogger from '../mockLogger'
import shouldNotBeExecuted from '../shouldNotBeExecuted'

jest.mock('redis')

describe('KVS: Key Value Storage', () => {
  const config: RedisConnectionConfig = {
    port: 6789,
    host: 'localhost',
    logger: mockLogger()
  }

  it('should be well constructed', () => {
    const kvs = new KVS(config)
    expect(kvs.port).toBe(config.port)
    expect(kvs.host).toEqual(config.host)
    expect(kvs.logger).toEqual(config.logger)
    expect(kvs.isConnected).toBeFalsy()
  })

  it('should GET value', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()

    const getSpy = jest.spyOn(kvs.client, 'get').mockImplementationOnce(
      (_key: string, cb?: Callback<string>): boolean => {
        if (cb) {
          cb(null, JSON.stringify({ am: 'the-value' }))
        }
        return true
      }
    )
    const result: Record<string, string> | undefined = await kvs.get('the-key')
    expect(result).toEqual({ am: 'the-value' })
    expect(getSpy).toBeCalledTimes(1)
    expect(getSpy.mock.calls[0][0]).toEqual('the-key')
  })

  it('should validate empty key for GET', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()
    try {
      await kvs.get('')
    } catch (error) {
      expect(error).toEqual(new InvalidKeyError())
    }
  })

  it('should validate invalid key for GET', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()
    try {
      await kvs.get(null as unknown as string)
    } catch (error) {
      expect(error).toEqual(new InvalidKeyError())
    }
  })

  it('should return undefined if there is no value for key', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()

    // simulate returning null from kvs.client.get
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    kvs.client.get = jest.fn((key, cb) => cb(null, null))
    const result = await kvs.get('not-existing-key')
    expect(result).toBeUndefined()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(kvs.client.get.mock.calls[0][0]).toEqual('not-existing-key')
  })

  it('should SET value', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()

    const setSpy = jest.spyOn(kvs.client, 'set').mockImplementationOnce((
      _key: string,
      _value: string,
      flag: string,
      _mode: string,
      _duration: number,
      _cb?: Callback<'OK' | undefined>
    ): boolean => {
      if (flag) {
        const ccb = flag as unknown as Callback<'OK' | undefined>
        ccb(null, 'OK')
      }
      return true
    })
    const result = await kvs.set('the-key', { am: 'the-value' })
    expect(result).toEqual('OK')
    expect(setSpy).toBeCalledTimes(1)
    expect(setSpy.mock.calls[0][0]).toEqual('the-key')
    expect(setSpy.mock.calls[0][1]).toEqual(JSON.stringify({ am: 'the-value' }))
  })

  it('should validate empty key empty for SET', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()
    try {
      await kvs.set('', true)
    } catch (error) {
      expect(error).toEqual(new InvalidKeyError())
    }
  })

  it('should validate invalid key for SET', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()
    try {
      await kvs.set(null as unknown as string, true)
    } catch (error) {
      expect(error).toEqual(new InvalidKeyError())
    }
  })

  it('should DEL key', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()
    const key = 'the-key'

    const delSpy = jest.spyOn(kvs.client, 'del').mockImplementationOnce((
      ...args: (string | Callback<number>)[]
    ): boolean => {
      const argKey: string = args[0] as unknown as string
      expect(argKey).toEqual(key)
      return true
    })

    const result = await kvs.del(key)
    expect(result).toBeTruthy()
    expect(delSpy).toBeCalledTimes(1)
    expect(delSpy).toBeCalledWith(key)
  })

  it('should validate invalid key for DEL', async (): Promise<void> => {
    const kvs = new KVS(config)
    await kvs.connect()
    try {
      await kvs.del(null as unknown as string)
    } catch (error) {
      expect(error).toEqual(new InvalidKeyError())
    }
  })

  it('should check does key EXISTS', async () => {
    const key = 'non-existing-key'
    const kvs = new KVS(config)
    await kvs.connect()

    const spyExists = jest.spyOn(kvs.client, 'exists')
    const result = await kvs.exists(key)
    expect(result).toBeFalsy()
    expect(spyExists).toBeCalledWith(key, expect.anything())
  })

  it('should reject and propagate error from EXISTS', async () => {
    const key = 'non-existing-key'
    const kvs = new KVS(config)
    await kvs.connect()

    const spyExists = jest.spyOn(kvs.client, 'exists').mockImplementationOnce((...args: (string | Callback<number>)[]
    ): boolean => {
      const cb = args[1] as Callback<number>
      cb(new Error('mocked-error'), 0)
      return false
    })
    try {
      await kvs.exists(key)
      shouldNotBeExecuted()
    } catch (err) {
      expect(err).toEqual(new Error('mocked-error'))
    }
    expect(spyExists).toBeCalledWith(key, expect.anything())
  })
})
