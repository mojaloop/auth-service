/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
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
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

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
import MockUpdateConsentReq from '../data/mockUpdatedConsent.json'
import MockThirdPartyAuthorizationReq from '../data/mockThirdPartyReqAuth.json'
import Headers from '../data/headers.json'
import { mocked } from 'ts-jest/utils'

jest.mock('~/shared/logger')
jest.mock('~/server/handlers', () => ({
  HealthGet: jest.fn(
    (_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(
      h.response({ status: 'OK', uptime: 1.23 }).code(200)
    )
  ),
  MetricsGet: jest.fn(
    (_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(
      h.response().code(200)
    )
  ),
  PostConsents: jest.fn(
    (_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(
      h.response().code(202)
    )
  ),
  PutConsentByID: jest.fn(
    (_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(
      h.response().code(200)
    )
  ),
  VerifyThirdPartyAuthorization: jest.fn(
    (_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(
      h.response().code(200)
    )
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

  afterAll(async (done): Promise<void> => {
    server.events.on('stop', done)
    await server.stop({ timeout: 0 })
  })

  describe('Endpoint: /consents', (): void => {
    it('POST /consents/', async (): Promise<void> => {
      const mockPostConsents = jest.spyOn(Handlers, 'PostConsents').mockImplementationOnce(
        (_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(202))
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

  describe('Endpoint: /consents/{ID}', (): void => {
    it('PUT /consents/{ID}', async (): Promise<void> => {
      const request = {
        method: 'PUT',
        url: '/consents/b51ec534-ee48-4575-b6a9-ead2955b8069',
        headers: Headers,
        payload: MockUpdateConsentReq.payload
      }

      const expectedArgs = expect.objectContaining({
        path: '/consents/b51ec534-ee48-4575-b6a9-ead2955b8069',
        method: 'put',
        payload: MockUpdateConsentReq.payload,
        params: {
          ID: expect.any(String)
        }
      })

      const response = await server.inject(request)
      expect(mocked(Handlers.PutConsentByID)).toHaveBeenCalledTimes(1)
      expect(mocked(Handlers.PutConsentByID)).toHaveBeenCalledWith(expect.anything(), expectedArgs, expect.anything())
      expect(response.statusCode).toBe(200)
      expect(response.result).toBeDefined()
    })
  })

  describe('Endpoint: /thirdpartyRequests/transactions/{ID}/authorizations', (): void => {
    it('POST /thirdpartyRequests/transactions/{ID}/authorizations', async (): Promise<void> => {
      const mockThirdPartyAuthorizations = jest.spyOn(Handlers, 'VerifyThirdPartyAuthorization')
      mockThirdPartyAuthorizations.mockImplementationOnce(
        (_context: Context, _req: Request, h: ResponseToolkit) => h.response().code(202)
      )

      const request = {
        method: 'POST',
        url: '/thirdpartyRequests/transactions/123/authorizations',
        headers: Headers,
        payload: MockThirdPartyAuthorizationReq.payload
      }

      const expectedArgs = expect.objectContaining({
        path: '/thirdpartyRequests/transactions/123/authorizations',
        method: 'post',
        payload: MockThirdPartyAuthorizationReq.payload,
        params: {
          ID: expect.any(String)
        }
      })

      const response = await server.inject(request)
      expect(mockThirdPartyAuthorizations).toHaveBeenCalledTimes(1)
      expect(mockThirdPartyAuthorizations).toHaveBeenCalledWith(expect.anything(), expectedArgs, expect.anything())
      expect(response.statusCode).toBe(202)
      expect(response.result).toBeDefined()
    })
  })
})
