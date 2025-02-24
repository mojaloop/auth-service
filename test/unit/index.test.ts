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

 * Lewis Daly <lewis@vesselstech.com>
 * Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import index from '~/index'
import Config from '~/shared/config'
import { Server, Request, ResponseToolkit } from '@hapi/hapi'
import { Context } from '~/server/plugins'

// Import handlers for mocking
import Handlers from '~/server/handlers'

// Mock data
import MockConsentData from '../data/mockConsent.json'
import MockParticipantsTypeIDResponse from '../data/mockParticipantsTypeIDResponse.json'
import MockParticipantsTypeIDErrorResponse from '../data/mockParticipantsTypeIDErrorResponse.json'
import Headers from '../data/headers.json'
import PutParticipantsHeaders from '../data/putParticipantsHeaders.json'

jest.mock('~/shared/logger')
jest.mock('~/server/handlers', () => ({
  HealthGet: jest.fn((_context: Context, _req: Request, h: ResponseToolkit) =>
    Promise.resolve(h.response({ status: 'OK', uptime: 1.23 }).code(200))
  ),
  MetricsGet: jest.fn((_context: Context, _req: Request, h: ResponseToolkit) =>
    Promise.resolve(h.response().code(200))
  ),
  PostConsents: jest.fn((_context: Context, _req: Request, h: ResponseToolkit) =>
    Promise.resolve(h.response().code(202))
  ),
  ParticipantsByTypeAndID3: jest.fn((_context: Context, _req: Request, h: ResponseToolkit) =>
    Promise.resolve(h.response().code(200))
  ),
  ParticipantsErrorByTypeAndID: jest.fn((_context: Context, _req: Request, h: ResponseToolkit) =>
    Promise.resolve(h.response().code(200))
  )
}))

describe('index', (): void => {
  it('should have proper layout', (): void => {
    expect(typeof index.server).toBeDefined()
    expect(typeof index.server.run).toEqual('function')
  })
})

describe('api routes', (): void => {
  let server: Server

  beforeAll(async (): Promise<void> => {
    server = await index.server.run(Config)
  })

  afterAll((done): void => {
    server.events.on('stop', done)
    server.stop({ timeout: 0 })
  })

  describe('Endpoint: /consents', (): void => {
    it('POST /consents/', async (): Promise<void> => {
      const mockPostConsents = jest
        .spyOn(Handlers, 'PostConsents')
        .mockImplementationOnce((_context: unknown, _req: Request, h: ResponseToolkit) =>
          Promise.resolve(h.response().code(202))
        )

      const request = {
        method: 'POST',
        url: '/consents',
        headers: Headers,
        payload: MockConsentData.payload
      }

      const expectedArgs = expect.objectContaining({
        path: '/consents',
        method: 'post',
        payload: MockConsentData.payload
      })

      const response = await server.inject(request)
      expect(mockPostConsents).toHaveBeenCalledTimes(1)
      expect(mockPostConsents).toHaveBeenCalledWith(expect.anything(), expectedArgs, expect.anything())
      expect(response.statusCode).toBe(202)
      expect(response.result).toBeDefined()
    })
  })

  describe('Endpoint: /participants/{Type}/{ID}', (): void => {
    it('PUT /participants/{Type}/{ID}', async (): Promise<void> => {
      const mockParticipantsByTypeAndID = jest
        .spyOn(Handlers, 'ParticipantsByTypeAndID3')
        .mockImplementationOnce((_context: unknown, _req: Request, h: ResponseToolkit) =>
          Promise.resolve(h.response().code(200))
        )

      const request = {
        method: 'PUT',
        url: '/participants/CONSENT/b82348b9-81f6-42ea-b5c4-80667d5740fe',
        headers: PutParticipantsHeaders,
        payload: MockParticipantsTypeIDResponse.payload
      }

      const expectedArgs = expect.objectContaining({
        path: '/participants/CONSENT/b82348b9-81f6-42ea-b5c4-80667d5740fe',
        method: 'put',
        payload: MockParticipantsTypeIDResponse.payload
      })

      const response = await server.inject(request)
      expect(mockParticipantsByTypeAndID).toHaveBeenCalledTimes(1)
      expect(mockParticipantsByTypeAndID).toHaveBeenCalledWith(expect.anything(), expectedArgs, expect.anything())
      expect(response.statusCode).toBe(200)
      expect(response.result).toBeDefined()
    })
  })

  describe('Endpoint: /participants/{Type}/{ID}/error', (): void => {
    it('PUT /participants/{Type}/{ID}/error', async (): Promise<void> => {
      const mockParticipantsErrorByTypeAndID = jest
        .spyOn(Handlers, 'ParticipantsErrorByTypeAndID')
        .mockImplementationOnce((_context: unknown, _req: Request, h: ResponseToolkit) =>
          Promise.resolve(h.response().code(200))
        )

      const request = {
        method: 'PUT',
        url: '/participants/CONSENT/b82348b9-81f6-42ea-b5c4-80667d5740fe/error',
        headers: PutParticipantsHeaders,
        payload: MockParticipantsTypeIDErrorResponse.payload
      }

      const expectedArgs = expect.objectContaining({
        path: '/participants/CONSENT/b82348b9-81f6-42ea-b5c4-80667d5740fe/error',
        method: 'put',
        payload: MockParticipantsTypeIDErrorResponse.payload
      })

      const response = await server.inject(request)
      expect(mockParticipantsErrorByTypeAndID).toHaveBeenCalledTimes(1)
      expect(mockParticipantsErrorByTypeAndID).toHaveBeenCalledWith(expect.anything(), expectedArgs, expect.anything())
      expect(response.statusCode).toBe(200)
      expect(response.result).toBeDefined()
    })
  })
})
