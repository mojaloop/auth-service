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
 * Kevin Leyow <kevin.leyow@modusbox.com>
 --------------
 ******/

import index from '~/index'
import Config from '~/shared/config'
import { Server, Request, ResponseToolkit } from '@hapi/hapi'

// Import handlers for mocking
import Handlers from '~/server/handlers'

// Mock data
import MockConsentData from '../data/mockConsent.json'
import MockParticipantsTypeIDResponse from '../data/mockParticipantsTypeIDResponse.json'
import MockParticipantsTypeIDErrorResponse from '../data/mockParticipantsTypeIDErrorResponse.json'
import Headers from '../data/headers.json'
import PutParticipantsHeaders from '../data/putParticipantsHeaders.json'

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
    await server.stop({ timeout: 0 })
  })

  describe('Endpoint: /consents', (): void => {
    it('schema validation - missing fields', async (): Promise<void> => {
      const mockPostConsents = jest.spyOn(Handlers, 'PostConsents')
      mockPostConsents.mockImplementationOnce(
        (_context: unknown, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(202))
      )

      const payloadMissingId = Object.assign({}, MockConsentData.payload)
      delete (payloadMissingId as Record<string, unknown>).consentId

      const request = {
        method: 'POST',
        url: '/consents',
        headers: Headers,
        payload: payloadMissingId
      }

      const expected = {
        errorInformation: {
          errorCode: '3102',
          errorDescription: 'Missing mandatory element - /requestBody must have required property \'consentId\''
        }
      }

      const response = await server.inject(request)
      expect(response.statusCode).toBe(400)
      expect(response.result).toStrictEqual(expected)
    })
  })

  describe.skip('Endpoint: /participants/{Type}/{ID}', (): void => {
    // TODO: /participants/{Type}/{ID} payload doesn't seem to have any required fields
    // double check api definition
    it('schema validation - missing fields', async (): Promise<void> => {
      jest.spyOn(Handlers, 'ParticipantsByTypeAndID3').mockImplementationOnce(
        (_context: unknown, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(200))
      )

      const payloadMissingId = Object.assign({}, MockParticipantsTypeIDResponse.payload)
      delete (payloadMissingId as Record<string, unknown>).fspId
      const request = {
        method: 'PUT',
        url: '/participants/CONSENT/b82348b9-81f6-42ea-b5c4-80667d5740fe',
        headers: PutParticipantsHeaders,
        payload: payloadMissingId
      }

      const expected = {
        errorInformation: {
          errorCode: '3102',
          errorDescription: 'Missing mandatory element - /requestBody must have required property \'fspId\''
        }
      }

      const response = await server.inject(request)
      expect(response.statusCode).toBe(400)
      expect(response.result).toStrictEqual(expected)
    })
  })

  describe('Endpoint: /participants/{Type}/{ID}/error', (): void => {
    it('schema validation - missing fields', async (): Promise<void> => {
      jest.spyOn(Handlers, 'ParticipantsErrorByTypeAndID').mockImplementationOnce(
        (_context: unknown, _req: Request, h: ResponseToolkit) => Promise.resolve(h.response().code(200))
      )

      const payloadMissingInfo = Object.assign({}, MockParticipantsTypeIDErrorResponse.payload)
      delete (payloadMissingInfo as Record<string, unknown>).errorInformation

      const request = {
        method: 'PUT',
        url: '/participants/CONSENT/b82348b9-81f6-42ea-b5c4-80667d5740fe/error',
        headers: PutParticipantsHeaders,
        payload: payloadMissingInfo
      }

      const expected = {
        errorInformation: {
          errorCode: '3102',
          errorDescription: 'Missing mandatory element - /requestBody must have required property \'errorInformation\''
        }
      }

      const response = await server.inject(request)
      expect(response.statusCode).toBe(400)
      expect(response.result).toStrictEqual(expected)
    })
  })
})
