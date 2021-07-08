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

import { Message, PubSub } from '~/shared/pub-sub'
import { RedisConnectionConfig } from '~/shared/redis-connection'
import { logger } from '~/shared/logger'
import Config from '~/shared/config'

describe('PubSub', () => {
  const config: RedisConnectionConfig = {
    host: Config.REDIS.HOST,
    port: Config.REDIS.PORT,
    logger: logger,
    timeout: Config.REDIS.TIMEOUT
  }
  let listener: PubSub
  let publisher: PubSub
  beforeAll(async (): Promise<void> => {
    listener = new PubSub(config)
    await listener.connect()
    publisher = new PubSub(config)
    await publisher.connect()
  })

  afterAll(async (): Promise<void> => {
    await listener.disconnect()
    await publisher.disconnect()
  })

  it('should be connected', async (): Promise<void> => {
    expect(listener.isConnected).toBeTruthy()
    const result = await listener.ping()
    expect(result).toEqual(true)
  })

  it('notification callback should received published message', (done): void => {
    const msg: Message = {
      a: 1,
      b: 'B',
      c: true,
      d: { nested: true }
    }
    const messageHandler = (channel: string, message: Message, id: number) => {
      expect(channel).toEqual('the-channel')
      expect(id).toBe(cbId)
      expect(message).toEqual(msg)
      done()
    }

    const cbId = listener.subscribe('the-channel', messageHandler)
    publisher.publish('the-channel', msg)
  })
})
