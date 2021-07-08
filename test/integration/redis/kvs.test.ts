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
import Config from '~/shared/config'
import mockLogger from '../../unit/mockLogger'

describe('KVS', () => {
  const config: RedisConnectionConfig = {
    host: Config.REDIS.HOST,
    port: Config.REDIS.PORT,
    logger: mockLogger(),
    timeout: Config.REDIS.TIMEOUT
  }
  let kvs: KVS

  beforeAll(async (): Promise<void> => {
    kvs = new KVS(config)
    await kvs.connect()
  })

  afterAll(async (): Promise<void> => {
    await kvs.disconnect()
  })

  it('should be connected', async (): Promise<void> => {
    expect(kvs.isConnected).toBeTruthy()
    const result = await kvs.ping()
    expect(result).toEqual(true)
  })

  it('should GET what was SET', async (): Promise<void> => {
    const values = [
      { a: 1, b: true, c: 'C', d: {} },
      true,
      123,
      'the-string'
    ]

    for (const value in values) {
      await kvs.set('key', value)
      expect(await kvs.exists('key')).toBeTruthy()
      const retrieved = await kvs.get('key')
      expect(retrieved).toEqual(value)
    }
  })

  it('GET should give \'unknown\' for not stored value', async (): Promise<void> => {
    const value = await kvs.get('key-for-never-stored-value')
    expect(value).toBeUndefined()
  })

  it('should DEL was SET and next GET after should give unknown', async (): Promise<void> => {
    const values = [
      { a: 1, b: true, c: 'C', d: {} },
      true,
      123,
      'the-string'
    ]

    for (const value in values) {
      await kvs.set('key-del', value)
      const retrieved = await kvs.get('key-del')
      expect(retrieved).toEqual(value)
      expect(await kvs.exists('key-del')).toBeTruthy()
      const result = await kvs.del('key-del')
      expect(result).toBeTruthy()
      expect(await kvs.exists('key-del')).toBeFalsy()
      const deleted = await kvs.get('key-del')
      expect(deleted).toBeUndefined()
      const resultDeleted = await kvs.del('key-del')
      expect(resultDeleted).toBeTruthy()
    }
  })
})
