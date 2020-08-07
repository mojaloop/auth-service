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
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import * as Handler from '../../../../../../src/server/handlers/consents/{ID}/revoke'
import { thirdPartyRequest } from '../../../../../../src/lib/requests'
import * as Domain from '../../../../../../src/domain/consents/revoke'
import { consentDB } from '../../../../../../src/lib/db'
import { Enum } from '@mojaloop/central-services-shared'
import Logger from '@mojaloop/central-services-logger'
import SDKStandardComponents from '@mojaloop/sdk-standard-components'
import { Consent } from '../../../../../../src/model/consent'

const mockRevokeConsentStatus = jest.spyOn(Domain, 'revokeConsentStatus')
const mockPatchConsents = jest.spyOn(thirdPartyRequest, 'patchConsents')
const mockGeneratePatchConsentRequest = jest.spyOn(Domain, 'generatePatchConsentRequest')
const mockIsConsentRequestValid = jest.spyOn(
  Domain, 'isConsentRequestInitiatedByValidSource')
const mockConsentRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

/*
 * Mock Request Resources
 */
// @ts-ignore
const request: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    id: '1234'
  },
  payload: {
    id: '1234',
    requestId: '475234',
    initiatorId: 'pispa',
    participantId: 'sfsfdf23',
    scopes: [
      {
        accountId: '3423',
        actions: ['acc.getMoney', 'acc.sendMoney']
      },
      {
        accountId: '232345',
        actions: ['acc.accessSaving']
      }
    ],
    credential: null
  }
}

// @ts-ignore
const h: ResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (num: number): ResponseObject => {
        return num as unknown as ResponseObject
      }
    } as unknown as ResponseObject
  }
}

/*
 * Mock Consent Resources
 */
const partialConsentActive: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'ACTIVE'
}

const partialConsentRevoked: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  revokedAt: 'now',
  status: 'REVOKED'
}

const completeConsentRevoked: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'REVOKED',
  revokedAt: 'now',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

// const completeConsentActive: Consent = {
//   id: '1234',
//   initiatorId: 'pisp-2342-2233',
//   participantId: 'dfsp-3333-2123',
//   credentialId: '123',
//   credentialType: 'FIDO',
//   status: 'ACTIVE',
//   credentialStatus: 'PENDING',
//   credentialChallenge: 'xyhdushsoa82w92mzs='
// }

const consentId = '1234'

const requestBody: SDKStandardComponents.PatchConsentsRequest = {
  status: 'REVOKED',
  revokedAt: 'now'

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

  describe('validateRequestAndRevokeConsent', (): void => {
    it('Should finish with no errors',
      async (): Promise<void> => {
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .resolves.toBe(undefined)

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid)
          .toBeCalledWith(partialConsentActive, request)
        expect(mockRevokeConsentStatus).toBeCalledWith(partialConsentActive)
        expect(Domain.generatePatchConsentRequest)
          .toBeCalledWith(partialConsentRevoked)
        expect(mockPatchConsents)
          .toBeCalledWith(consentId,
            requestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      })

    it('Should also finish with no errors',
      async (): Promise<void> => {
        mockConsentRetrieve.mockResolvedValueOnce(completeConsentRevoked)
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .resolves.toBe(undefined)

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid)
          .toBeCalledWith(completeConsentRevoked, request)
        expect(mockRevokeConsentStatus).toBeCalledWith(completeConsentRevoked)
        expect(mockGeneratePatchConsentRequest)
          .toBeCalledWith(completeConsentRevoked)
        expect(mockPatchConsents)
          .toBeCalledWith(consentId,
            requestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      })

    it('Should throw an error due to consent retrieval error',
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

    it('Should throw an error due to invalid request',
      async (): Promise<void> => {
        mockIsConsentRequestValid.mockReturnValueOnce(false)
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .rejects.toThrowError('NotImplementedYetError')

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid).toBeCalledWith(partialConsentActive)
        expect(mockRevokeConsentStatus).not.toBeCalled()
        expect(mockGeneratePatchConsentRequest).not.toBeCalled()
        expect(mockPatchConsents).not.toBeCalled()
      })

    it('Should throw an error as patchConsents() throws an error',
      async (): Promise<void> => {
        mockPatchConsents.mockRejectedValue(new Error('Test Error'))
        await expect(Handler.validateRequestAndRevokeConsent(request))
          .rejects.toThrowError('Test Error')

        expect(mockConsentRetrieve).toBeCalledWith(consentId)
        expect(mockIsConsentRequestValid)
          .toBeCalledWith(completeConsentRevoked, request)
        expect(mockRevokeConsentStatus).not.toBeCalled()
        expect(mockGeneratePatchConsentRequest)
          .toBeCalledWith(completeConsentRevoked)
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
          request as Request,
          h as ResponseToolkit
        )
        expect(response).toBe(202)
      })
  })
})
