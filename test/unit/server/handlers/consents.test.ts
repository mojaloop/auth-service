/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop
 files are distributed onan 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 ANY KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import { Request, ResponseToolkit } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import { post } from '~/server/handlers/consents'
import * as Domain from '~/domain/consents'
import { requestWithPayloadScopes, h } from 'test/data/data'

const mockStoreConsent = jest.spyOn(Domain, 'createAndStoreConsent')

jest.mock('~/shared/logger')

describe('server/handlers/consents', (): void => {
  beforeAll((): void => {
    mockStoreConsent.mockResolvedValue()
    jest.useFakeTimers()
  })

  beforeEach((): void => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  it('Should return 202 success code',
    async (): Promise<void> => {
      const req = requestWithPayloadScopes as Request
      const response = await post(
        {
          method: req.method,
          path: req.path,
          body: req.payload,
          query: req.query,
          headers: req.headers
        },
        req,
        h as ResponseToolkit
      )
      expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
      jest.runAllImmediates()
      expect(mockStoreConsent).toHaveBeenCalledWith(requestWithPayloadScopes)
      expect(setImmediate).toHaveBeenCalled()
    })

  it('Should throw an error due to error in creating/storing consent & scopes',
    async (): Promise<void> => {
      mockStoreConsent.mockRejectedValueOnce(
        new Error('Error Registering Consent'))
      const req = requestWithPayloadScopes as Request
      const response = await post(
        {
          method: req.method,
          path: req.path,
          body: req.payload,
          query: req.query,
          headers: req.headers
        },
        req,
        h as ResponseToolkit)
      expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
      jest.runAllImmediates()

      expect(setImmediate).toHaveBeenCalled()
      expect(mockStoreConsent).toHaveBeenLastCalledWith(requestWithPayloadScopes)
      expect(mockStoreConsent).not.toHaveLastReturnedWith('')
    })
})
