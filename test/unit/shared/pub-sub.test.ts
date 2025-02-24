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

import { InvalidCallbackIdError, InvalidChannelNameError, InvalidMessageError, Message, PubSub } from '~/shared/pub-sub'
import { RedisConnectionConfig } from '~/shared/redis-connection'
// import Redis from 'redis'
import mockLogger from '../mockLogger'
jest.mock('redis')

describe('PubSub', () => {
  const config: RedisConnectionConfig = {
    port: 6789,
    host: 'localhost',
    logger: mockLogger()
  }

  beforeEach(() => jest.resetAllMocks())

  it('should be well constructed', () => {
    const ps = new PubSub(config)
    expect(ps.port).toBe(config.port)
    expect(ps.host).toEqual(config.host)
    expect(ps.logger).toEqual(config.logger)
    expect(ps.isConnected).toBeFalsy()
  })

  it('should connect', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()
    expect(ps.isConnected).toBeTruthy()
  })

  it('should broadcast message to subscribed notification callbacks', (done): void => {
    const ps = new PubSub(config)
    ps.connect().then(() => {
      const notificationCallback = jest.fn()
      const id = ps.subscribe('first-channel', notificationCallback)
      expect(id).toBe(1)

      // no need to await for this promise
      ps.publish('first-channel', { Iam: 'the-message' })

      setTimeout(() => {
        expect(notificationCallback).toBeCalledWith('first-channel', { Iam: 'the-message' }, id)
        done()
      }, 10)
    })
  })

  it('subscribe should do channel validation', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    expect(() => ps.subscribe('', jest.fn())).toThrowError(new InvalidChannelNameError())
  })

  it('should unsubscribe', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    const id = ps.subscribe('first-channel', jest.fn())
    expect(id).toBe(1)

    const result = ps.unsubscribe('first-channel', id)
    expect(result).toBeTruthy()
  })

  it('unsubscribe should do nothing if wrong channel name', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    const result = ps.unsubscribe('first-channel', 1)
    expect(result).toBeFalsy()
  })

  it('unsubscribe should do nothing if wrong callbackId', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    let id = ps.subscribe('first-channel', jest.fn())
    expect(id).toBe(1)
    // check more than one subscription to the same channel
    id = ps.subscribe('first-channel', jest.fn())
    expect(id).toBe(2)

    const result = ps.unsubscribe('first-channel', id + 1)
    expect(result).toBeFalsy()
  })

  it('unsubscribe should do channel validation', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    expect(() => ps.unsubscribe('', 1)).toThrowError(new InvalidChannelNameError())
  })

  it('unsubscribe should do callbackId validation', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    expect(() => ps.unsubscribe('the-channel', -1)).toThrowError(new InvalidCallbackIdError())
  })

  it('publish should do channel validation', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    expect(ps.publish('', true)).rejects.toEqual(new InvalidChannelNameError())
  })

  it('publish should do Message validation', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    expect(ps.publish('the-channel', null as unknown as Message)).rejects.toEqual(
      new InvalidMessageError('the-channel')
    )
  })

  it('broadcast should do nothing if no listener registered', async (): Promise<void> => {
    const ps = new PubSub(config)
    await ps.connect()

    ps.client.emit('message', 'not-existing')
    await new Promise((resolve) => {
      expect(ps.logger.info).toBeCalledWith("broadcastMessage: no callbacks for 'not-existing' channel")
      setTimeout(resolve, 10, {})
    })
  })
})
