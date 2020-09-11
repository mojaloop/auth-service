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
import { Server, ResponseObject } from '@hapi/hapi'
import PostConsent from '~/server/handlers/consents';
import PutConsent from '~/server/handlers/consents/{ID}'
import MockConsent from './data/mockConsent.json';

// mock handlers
const mockPostConsent = jest.spyOn(PostConsent, 'post');
mockPostConsent.mockResolvedValue({} as ResponseObject);
const mockPutConsent = jest.spyOn(PutConsent, 'put');
mockPutConsent.mockResolvedValue({} as ResponseObject);

describe('index', (): void => {
  it('should have proper layout', (): void => {
    expect(typeof index.server).toBeDefined()
    expect(typeof index.server.run).toEqual('function')
  })
})

describe('api routes', (): void => {
  let server: Server

  beforeAll(async (): Promise<Server> => {
    server = await index.server.run(Config)
    return server
  })

  afterAll(async (done): Promise<void> => {
    server.events.on('stop', done)
    await server.stop()
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
      url: '/hello',
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
  })


  it('POST /consents/', async (): Promise<void> => {
    const request = {
      method: 'POST',
      url: '/consents',
      headers: MockConsent.headers,
      payload: MockConsent.payload,
    }

    const response = await server.inject(request);
    expect(response.statusCode).toBe(202);
    expect(response.result).toBeDefined()
  })

  it('PUT /consents/{ID}', async (): Promise<void> => {
    const request = {
      method: 'PUT',
      url: '/consents/b51ec534-ee48-4575-b6a9-ead2955b8069',
      headers: MockConsent.headers,
      payload: MockConsent.payload,
    }

    const response = await server.inject(request);
    expect(response.statusCode).toBe(202);
    expect(response.result).toBeDefined();
  })
})
