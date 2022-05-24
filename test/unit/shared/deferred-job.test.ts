/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License')
 and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed
 on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
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

import deferredJob, { JobInitiator, JobListener, PositiveTimeoutRequired, TimeoutError } from '~/shared/deferred-job'
import mockLogger from '../mockLogger'
import { Message, NotificationCallback, PubSub } from '~/shared/pub-sub'
import { RedisConnectionConfig } from '~/shared/redis-connection'
import { v4 as uuidv4 } from 'uuid'
jest.mock('redis')

describe('deferredJob', () => {
  test('module layout', () => {
    expect(typeof deferredJob).toEqual('function')
  })

  describe('workflow: deferredJob -> init -> job -> wait', () => {
    const pubSubConfig: RedisConnectionConfig = {
      port: 6789,
      host: 'localhost',
      logger: mockLogger()
    }
    let pubSub: PubSub
    let spySubscribe: jest.SpyInstance
    let spyUnsubscribe: jest.SpyInstance
    let spyPublish: jest.SpyInstance
    const channel = uuidv4()
    const publishTimeoutInMs = 50
    beforeEach(async () => {
      pubSub = new PubSub(pubSubConfig)
      await pubSub.connect()
      let notifyCb: NotificationCallback
      spySubscribe = jest
        .spyOn(pubSub, 'subscribe')
        .mockImplementation((_channel: string, cb: NotificationCallback) => {
          // store callback to be used in `publish`
          notifyCb = cb
          return 1 // hardcoded sid
        })
      spyUnsubscribe = jest.spyOn(pubSub, 'unsubscribe').mockImplementation(() => true) // true returned when unsubscribe done
      spyPublish = jest.spyOn(pubSub, 'publish').mockImplementationOnce((channel: string, message: Message) => {
        // invoke stored callback to simulate
        setTimeout(() => notifyCb(channel, message, 1), publishTimeoutInMs)
        return Promise.resolve()
      })
    })

    afterEach(async () => {
      await pubSub.disconnect()
    })

    test('happy flow', (done) => {
      const jobInitiator = jest.fn(() => Promise.resolve())
      const jobListener = jest.fn(() => Promise.resolve())
      const initOrTrigger = deferredJob(pubSub, channel)

      // check workflow layout
      expect(typeof initOrTrigger.init).toEqual('function')
      expect(typeof initOrTrigger.trigger).toEqual('function')

      const dj = initOrTrigger.init(jobInitiator)
      expect(typeof dj.job).toEqual('function')

      const dw = dj.job(jobListener)
      expect(typeof dw.wait).toEqual('function')

      // wait phase - execution
      dw.wait(publishTimeoutInMs + 10).then(() => {
        expect(spyPublish).toHaveBeenCalledWith(channel, { the: 'message' })
        expect(spyUnsubscribe).toHaveBeenCalledWith(channel, 1)
        done()
      })
      expect(spySubscribe).toHaveBeenCalledWith(channel, expect.any(Function))
      initOrTrigger.trigger({ the: 'message' })
    })

    test('timeout', (done) => {
      const jobInitiator = jest.fn(() => Promise.resolve())
      const jobListener = jest.fn(() => Promise.resolve())

      const dw = deferredJob(pubSub, channel).init(jobInitiator).job(jobListener)

      // wait phase - set timeout before publish will happen
      dw.wait(publishTimeoutInMs - 10).catch((err) => {
        expect(err).toBeInstanceOf(TimeoutError)
        expect(spyPublish).toHaveBeenCalledWith(channel, { the: 'message' })
        expect(spyUnsubscribe).toHaveBeenCalledWith(channel, 1)
        done()
      })
      expect(spySubscribe).toHaveBeenCalledWith(channel, expect.any(Function))
      deferredJob(pubSub, channel).trigger({ the: 'message' })
    })

    test('exception from jobInitiator', (done) => {
      const jobInitiator = jest.fn(() => {
        throw new Error('job-initiator throws')
      })
      const jobListener = jest.fn(() => Promise.resolve())

      const dw = deferredJob(pubSub, channel).init(jobInitiator).job(jobListener)

      // wait phase - set timeout before publish will happen
      dw.wait(publishTimeoutInMs + 10).catch((err) => {
        expect(err.message).toEqual('job-initiator throws')
        expect(spyPublish).not.toHaveBeenCalled()
        expect(spyUnsubscribe).toHaveBeenCalledWith(channel, 1)
        done()
      })
      expect(spySubscribe).toHaveBeenCalledWith(channel, expect.any(Function))
    })

    test('exception from jobListener', (done) => {
      const jobInitiator = jest.fn(() => Promise.resolve())
      const jobListener = jest.fn(() => {
        throw new Error('job-listener throws')
      })

      const dw = deferredJob(pubSub, channel).init(jobInitiator).job(jobListener)

      // wait phase - set timeout before publish will happen
      // testing default argument for wait
      dw.wait(undefined as unknown as number).catch((err) => {
        expect(err.message).toEqual('job-listener throws')
        expect(spySubscribe).toHaveBeenCalledWith(channel, expect.any(Function))
        expect(spyUnsubscribe).toHaveBeenCalledWith(channel, 1)
        done()
      })
      expect(spySubscribe).toHaveBeenCalledWith(channel, expect.any(Function))
      deferredJob(pubSub, channel).trigger({ the: 'message' })
    })

    test('input validation', () => {
      const jobInitiator = jest.fn(() => Promise.resolve())
      const jobListener = jest.fn(() => Promise.resolve())

      expect(() => deferredJob(pubSub, channel).init(null as unknown as JobInitiator)).toThrowError()

      expect(() =>
        deferredJob(pubSub, channel)
          .init(jobInitiator)
          .job(null as unknown as JobListener)
      ).toThrowError()

      expect(deferredJob(pubSub, channel).init(jobInitiator).job(jobListener).wait(-1)).rejects.toBeInstanceOf(
        PositiveTimeoutRequired
      )
    })
  })
})
