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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Lewis Daly <lewis@vesselstech.com>
 * Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import index from '~/index'
import Config from '~/shared/config'
import { Server } from '@hapi/hapi'
import Logger from '@mojaloop/central-services-logger'

// Mocked out functions
import * as PutConsent from '~/server/handlers/consents/{ID}'
import * as GenerateChallenge from '~/server/handlers/consents/{ID}/generateChallenge'
import * as RevokeConsent from '~/server/handlers/consents/{ID}/revoke'
import * as ThirdPartyRequestAuth from '~/server/handlers/thirdpartyRequests/transactions/{ID}/authorizations'
import * as ConsentsDomain from '~/domain/consents'

// Mock data
import MockConsentData from './data/mockConsent.json'
import MockUpdateConsentReq from './data/mockUpdatedConsent.json'
import MockGenerateChallengeReq from './data/mockGenerateChallenge.json'
import MockThirdPartyAuthorizationReq from './data/mockThirdPartyReqAuth.json'
import Headers from './data/headers.json'

const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

describe('index', (): void => {
  it('should have proper layout', (): void => {
    expect(typeof index.server).toBeDefined()
    expect(typeof index.server.run).toEqual('function')
  })
})

describe('api routes', (): void => {
  let server: Server

  beforeAll(async (): Promise<Server> => {
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
    server = await index.server.run(Config)
    return server
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

  it('/hello', async (): Promise<void> => {
    interface HelloResponse {
      hello: string;
    }

    const request = {
      method: 'GET',
      url: '/hello'
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(200)
    expect(response.result).toBeDefined()

    const result = response.result as HelloResponse
    expect(result.hello).toEqual('world')
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

  it('POST /consents/', async (): Promise<void> => {
    const mockPostConsent = jest.spyOn(ConsentsDomain, 'createAndStoreConsent')
    mockPostConsent.mockResolvedValueOnce()

    const request = {
      method: 'POST',
      url: '/consents',
      headers: Headers,
      payload: MockConsentData.payload
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(202)
    expect(response.result).toBeDefined()
  })

  it('PUT /consents/{ID}', async (): Promise<void> => {
    const mockPutConsent = jest.spyOn(PutConsent, 'validateAndUpdateConsent')
    mockPutConsent.mockResolvedValueOnce()

    const request = {
      method: 'PUT',
      url: '/consents/b51ec534-ee48-4575-b6a9-ead2955b8069',
      headers: Headers,
      payload: MockUpdateConsentReq.payload
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(202)
    expect(response.result).toBeDefined()
  })

  it('POST /consents/{ID}/generateChallenge', async (): Promise<void> => {
    const mockGenerateChallenge = jest.spyOn(GenerateChallenge, 'generateChallengeAndPutConsent')
    mockGenerateChallenge.mockResolvedValueOnce()

    const request = {
      method: 'POST',
      url: '/consents/b51ec534-ee48-4575-b6a9-ead2955b8069/generateChallenge',
      headers: Headers,
      payload: MockGenerateChallengeReq.payload
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(202)
    expect(response.result).toBeDefined()
  })

  it('POST /consents/{ID}/revoke', async (): Promise<void> => {
    const mockRevokeConsent = jest.spyOn(RevokeConsent, 'validateRequestAndRevokeConsent')
    mockRevokeConsent.mockResolvedValueOnce()

    const request = {
      method: 'POST',
      url: '/consents/b51ec534-ee48-4575-b6a9-ead2955b8069/revoke',
      headers: Headers
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(202)
    expect(response.result).toBeDefined()
  })

  it('POST /thirdPartyRequests/transactions/{ID}/authorizations', async (): Promise<void> => {
    const mockRevokeConsent = jest.spyOn(ThirdPartyRequestAuth, 'validateAndVerifySignature')
    mockRevokeConsent.mockResolvedValueOnce()

    const request = {
      method: 'POST',
      url: '/thirdPartyRequests/transactions/123/authorizations',
      headers: Headers,
      payload: MockThirdPartyAuthorizationReq.payload
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(202)
    expect(response.result).toBeDefined()
  })
})
