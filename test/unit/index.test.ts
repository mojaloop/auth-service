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

jest.mock('~/shared/logger')

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
    await server.stop()
    jest.clearAllMocks()
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  it('/health', async (): Promise<void> => {
    interface HealthResponse {
      status: string;
      uptime: number;
      startTime: string;
      versionNumber: string;
    }

    const request = {
      method: 'GET',
      url: '/health'
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(200)
    expect(response.result).toBeDefined()

    const result = response.result as HealthResponse
    expect(result.status).toEqual('OK')
    expect(result.uptime).toBeGreaterThan(1.0)
  })

  it('/metrics', async (): Promise<void> => {
    const request = {
      method: 'GET',
      url: '/metrics'
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(200)
    expect(response.result).toBeDefined()
  })

  describe('Endpoint: /consents', (): void => {
    it('POST /consents/', async (): Promise<void> => {
      const mockPostConsents = jest.spyOn(Handlers, 'PostConsents')
      mockPostConsents.mockImplementationOnce((_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(202)))

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

    it('schema validation - missing fields', async (): Promise<void> => {
      const mockPostConsents = jest.spyOn(Handlers, 'PostConsents')
      mockPostConsents.mockImplementationOnce((_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(202)))

      const payloadMissingId = Object.assign({}, MockConsentData.payload)
      delete payloadMissingId.consentId

      const request = {
        method: 'POST',
        url: '/consents',
        headers: Headers,
        payload: payloadMissingId
      }

      const expected = {
        errorInformation: {
          errorCode: '3102',
          errorDescription: 'Missing mandatory element - .requestBody should have required property \'consentId\''
        }
      }

      const response = await server.inject(request)
      expect(response.statusCode).toBe(400)
      expect(response.result).toStrictEqual(expected)
    })
  })

  describe('Endpoint: /consents/{ID}', (): void => {
    it('PUT /consents/{ID}', async (): Promise<void> => {
      const mockUpdateConsent = jest.spyOn(Handlers, 'UpdateConsent')
      mockUpdateConsent.mockImplementationOnce((_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(202)))

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
      expect(mockUpdateConsent).toHaveBeenCalledTimes(1)
      expect(mockUpdateConsent).toHaveBeenCalledWith(expect.anything(), expectedArgs, expect.anything())
      expect(response.statusCode).toBe(202)
      expect(response.result).toBeDefined()
    })

    it('schema validation - missing fields', async (): Promise<void> => {
      const mockUpdateConsent = jest.spyOn(Handlers, 'UpdateConsent')
      mockUpdateConsent.mockImplementationOnce((_context: Context, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(202)))

      const payloadMissingCredential = Object.assign({}, MockUpdateConsentReq.payload)
      delete payloadMissingCredential.credential

      const request = {
        method: 'PUT',
        url: '/consents/b51ec534-ee48-4575-b6a9-ead2955b8069',
        headers: Headers,
        payload: payloadMissingCredential
      }

      const expected = {
        errorInformation: {
          errorCode: '3102',
          errorDescription: 'Missing mandatory element - .requestBody should have required property \'credential\''
        }
      }

      const response = await server.inject(request)
      expect(response.statusCode).toBe(400)
      expect(response.result).toStrictEqual(expected)
    })
  })

  describe('Endpoint: /thirdpartyRequests/transactions/{ID}/authorizations', (): void => {
    it('POST /thirdpartyRequests/transactions/{ID}/authorizations', async (): Promise<void> => {
      const mockThirdPartyAuthorizations = jest.spyOn(Handlers, 'VerifyThirdPartyAuthorization')
      mockThirdPartyAuthorizations.mockImplementationOnce((_context: Context, _req: Request, h: ResponseToolkit) => h.response().code(202))

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

    it('schema validation - missing fields', async (): Promise<void> => {
      const mockThirdPartyAuthorizations = jest.spyOn(Handlers, 'VerifyThirdPartyAuthorization')
      mockThirdPartyAuthorizations.mockImplementationOnce((_context: Context, _req: Request, h: ResponseToolkit) => h.response().code(202))

      const payloadMissingChallenge = Object.assign({}, MockThirdPartyAuthorizationReq.payload)
      delete payloadMissingChallenge.challenge

      const request = {
        method: 'POST',
        url: '/thirdpartyRequests/transactions/123/authorizations',
        headers: Headers,
        payload: payloadMissingChallenge
      }

      const expected = {
        errorInformation: {
          errorCode: '3102',
          errorDescription: 'Missing mandatory element - .requestBody should have required property \'challenge\''
        }
      }

      const response = await server.inject(request)
      expect(response.result).toStrictEqual(expected)
      expect(response.statusCode).toBe(400)
    })

    it('schema validation - status !== PENDING results in 400', async (): Promise<void> => {
      const mockThirdPartyAuthorizations = jest.spyOn(Handlers, 'VerifyThirdPartyAuthorization')
      mockThirdPartyAuthorizations.mockImplementationOnce((_context: Context, _req: Request, h: ResponseToolkit) => h.response().code(202))

      const payloadWithActiveStatus = Object.assign({}, MockThirdPartyAuthorizationReq.payload)
      payloadWithActiveStatus.status = 'ACTIVE'

      const request = {
        method: 'POST',
        url: '/thirdpartyRequests/transactions/123/authorizations',
        headers: Headers,
        payload: payloadWithActiveStatus
      }

      const expected = {
        errorInformation: {
          errorCode: '3100',
          errorDescription: 'Generic validation error - .requestBody.status should be equal to one of the allowed values'
        }
      }

      const response = await server.inject(request)
      expect(response.result).toStrictEqual(expected)
      expect(response.statusCode).toBe(400)
    })
  })
})
