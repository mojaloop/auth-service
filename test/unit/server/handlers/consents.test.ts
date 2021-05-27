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
import { Server } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
// import * as Domain from '~/domain/consents'
import { requestWithPayloadScopes } from 'test/data/data'
// import { mocked } from 'ts-jest/utils'
import index from '~/index'
import config from '~/shared/config'

// jest.mock('~/shared/logger')
// jest.mock('@mojaloop/sdk-standard-components')
// jest.mock('~/domain/consents', () => ({
//   createAndStoreConsent: jest.fn(() => Promise.resolve(undefined))
// }))

describe('server/handlers/consents', (): void => {
  let server: Server

  beforeAll(async () => {
    server = await index.server.run(config)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  it('Should return 202 success code',
    async (done): Promise<void> => {
      const req = {
        payload: requestWithPayloadScopes.payload,
        headers: requestWithPayloadScopes.headers,
        url: '/consents',
        method: 'POST'
      }
      // const mockStoreConsent = jest.spyOn(
      //   Domain, 'createAndStoreConsent'
      // ).mockImplementation(() => Promise.resolve())
      const response = await server.inject(req)
      expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
      console.log('HEREB')
      setImmediate(() => {
        console.log('HERE1')
        // expect(mocked(mockStoreConsent)).toHaveBeenCalledWith({})
        // expect(mockStoreConsent).toHaveBeenCalledWith(requestWithPayloadScopes)
        console.log('HERE2')
        done()
      })
    })

  // it.skip('Should throw an error due to error in creating/storing consent & scopes',
  //   async (done): Promise<void> => {
  //     const thirdpartyRequestsMock: ThirdpartyRequests = {
  //       putConsent: jest.fn().mockResolvedValue(1),
  //       putConsentsError: jest.fn().mockResolvedValue(1)
  //     } as unknown as ThirdpartyRequests
  //     mocked(mockStoreConsent).mockRejectedValueOnce(
  //       new Error('Error Registering Consent'))
  //     mocked(h.getThirdpartyRequests).mockImplementationOnce(() => thirdpartyRequestsMock)
  //     const req = requestWithPayloadScopes as Request
  //     const response = await post(
  //       {
  //         method: req.method,
  //         path: req.path,
  //         body: req.payload,
  //         query: req.query,
  //         headers: req.headers
  //       },
  //       req,
  //       h)
  //     expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
  //     setImmediate(() => {
  //       expect(mocked(mockStoreConsent)).toHaveBeenLastCalledWith(requestWithPayloadScopes)
  //       expect(mocked(thirdpartyRequestsMock.putConsentsError)).toHaveBeenCalled()
  //       done()
  //     })
  //   })
})
