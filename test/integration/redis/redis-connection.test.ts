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

import { RedisConnection, RedisConnectionConfig } from '~/shared/redis-connection'
import mockLogger from '../../unit/mockLogger'
import Config from '~/shared/config'

describe('RedisConnection', () => {
  const config: RedisConnectionConfig = {
    host: Config.REDIS.HOST,
    port: Config.REDIS.PORT,
    logger: mockLogger(),
    timeout: Config.REDIS.TIMEOUT
  }
  let rc: RedisConnection

  beforeAll(async (): Promise<void> => {
    rc = new RedisConnection(config)
    await rc.connect()
  })

  afterAll(async (): Promise<void> => {
    await rc.disconnect()
  })

  it('should be connected', async (): Promise<void> => {
    expect(rc.isConnected).toBeTruthy()
    const result = await rc.ping()
    expect(result).toEqual(true)
  })

  it("should throw error if can't connect", async (): Promise<void> => {
    const invalidPort = { ...config, timeout: 200 }
    invalidPort.port = 8080
    const invalidRC = new RedisConnection(invalidPort)
    expect(invalidRC.isConnected).toBeFalsy()
  })
})
