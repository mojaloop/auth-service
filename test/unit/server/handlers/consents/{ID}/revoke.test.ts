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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 --------------
 ******/
import { Request, ResponseToolkit } from '@hapi/hapi'
import * as Handler from '~/server/handlers/consents/{ID}/revoke'
import { thirdPartyRequest } from '~/lib/requests'
import * as Domain from '~/domain/consents/revoke'
import * as validators from '~/domain/validators'
import { consentDB } from '~/lib/db'
import { Enum } from '@mojaloop/central-services-shared'
import Logger from '@mojaloop/central-services-logger'
import SDKStandardComponents from '@mojaloop/sdk-standard-components'
import {
  request, h, partialConsentRevoked,
  partialConsentActive, completeConsentRevoked
} from 'test/data/data'

const mockRevokeConsentStatus = jest.spyOn(Domain, 'revokeConsentStatus')
const mockPatchConsents = jest.spyOn(thirdPartyRequest, 'patchConsents')
const mockGeneratePatchConsentRequest = jest.spyOn(
  Domain, 'generatePatchRevokedConsentRequest')
const mockIsConsentRequestValid = jest.spyOn(
  validators, 'isConsentRequestInitiatedByValidSource')
const mockConsentRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

const consentId = partialConsentActive.id

const requestBody: SDKStandardComponents.PatchConsentsRequest = {
  status: 'REVOKED',
  revokedAt: '2020-08-19T05:44:18.843Z'

}

describe('server/handlers/consents', (): void => {
  beforeAll((): void => {
    mockIsConsentRequestValid.mockReturnValue(true)
    mockRevokeConsentStatus.mockResolvedValue(partialConsentRevoked)
    mockGeneratePatchConsentRequest.mockReturnValue(requestBody)
    mockPatchConsents
      .mockResolvedValue(1 as unknown as SDKStandardComponents.GenericRequestResponse)
    mockLoggerError.mockReturnValue(null)
    mockLoggerPush.mockReturnValue(null)
    mockConsentRetrieve.mockResolvedValue(partialConsentActive)
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  afterAll((): void => {
    jest.clearAllMocks
  })

  describe('validateRequestAndRevokeConsent', (): void => {
    it('Should resolve successfully with no errors',
      async (): Promise<void> => {
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .resolves.toBe(undefined)

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid)
          .toBeCalledWith(partialConsentActive, request)
        expect(mockRevokeConsentStatus).toBeCalledWith(partialConsentActive)
        expect(Domain.generatePatchRevokedConsentRequest)
          .toBeCalledWith(partialConsentRevoked)
        expect(mockPatchConsents)
          .toBeCalledWith(consentId,
            requestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      })

    it('Should also resolve successfully even if consent retrieved is already revoked',
      async (): Promise<void> => {
        mockConsentRetrieve.mockResolvedValueOnce(completeConsentRevoked)
        mockRevokeConsentStatus.mockResolvedValueOnce(completeConsentRevoked)

        await expect(Handler.validateRequestAndRevokeConsent(request))
          .resolves.toBe(undefined)

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid)
          .toBeCalledWith(completeConsentRevoked, request)
        expect(mockRevokeConsentStatus).toBeCalledWith(completeConsentRevoked)
        expect(mockGeneratePatchConsentRequest)
          .toBeCalledWith(completeConsentRevoked)
        expect(mockPatchConsents)
          .toBeCalledWith(
            consentId,
            requestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      })

    it('Should propagate consent retrieval error from consentDB.retrieve()',
      async (): Promise<void> => {
        mockConsentRetrieve.mockRejectedValueOnce(new Error('Test'))
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .rejects.toThrowError('NotImplementedYetError')

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid).not.toBeCalled()
        expect(mockRevokeConsentStatus).not.toBeCalled()
        expect(mockGeneratePatchConsentRequest).not.toBeCalled()
        expect(mockPatchConsents).not.toBeCalled()
      })

    it('Should throw an error if request is invalid',
      async (): Promise<void> => {
        mockIsConsentRequestValid.mockReturnValueOnce(false)
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .rejects.toThrowError('NotImplementedYetError')

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid).toBeCalledWith(partialConsentActive, request)
        expect(mockRevokeConsentStatus).not.toBeCalled()
        expect(mockGeneratePatchConsentRequest).not.toBeCalled()
        expect(mockPatchConsents).not.toBeCalled()
      })

    it('Should propagate errors from patchConsents()',
      async (): Promise<void> => {
        mockPatchConsents.mockRejectedValueOnce(new Error('Test Error'))
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .rejects.toThrowError('Test Error')

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid)
          .toBeCalledWith(partialConsentActive, request)
        expect(mockRevokeConsentStatus).toBeCalledWith(partialConsentActive)
        expect(mockGeneratePatchConsentRequest)
          .toBeCalledWith(partialConsentRevoked)
        expect(mockPatchConsents)
          .toBeCalledWith(consentId,
            requestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      }
    )
  })

  describe('Post', (): void => {
    const mockValidateRequestAndRevokeConsent = jest.spyOn(
      Handler, 'validateRequestAndRevokeConsent')

    beforeAll((): void => {
      mockValidateRequestAndRevokeConsent.mockResolvedValue()
    })

    it('Should return 202 success code',
      async (): Promise<void> => {
        const response = await Handler.post(
          {
            method: request.method,
            path: request.path,
            body: request.payload,
            query: request.query,
            headers: request.headers
          },
          request as Request,
          h as ResponseToolkit
        )
        expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
      })
  })
})
