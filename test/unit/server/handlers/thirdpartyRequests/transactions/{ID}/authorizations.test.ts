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

 - Raman Mangla <ramanmangla@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

// import { logger } from '~/shared/logger'
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi'
import { Consent } from '~/model/consent'
import { Scope } from '~/model/scope'
import { Enum } from '@mojaloop/central-services-shared'
import { NotFoundError } from '~/model/errors'
import { thirdPartyRequest } from '~/lib/requests'
import {
  consentDB,
  scopeDB
} from '~/lib/db'
import * as Challenge from '~/lib/challenge'
import * as Domain from '~/domain/authorizations'
import * as DomainError from '~/domain/errors'
import * as Handler from '~/server/handlers/thirdpartyRequests/transactions/{ID}/authorizations'
// import { mocked } from 'ts-jest/utils'

// jest.mock('~/shared/logger')

/*
 * Mock Handler Functions
 */
const mockIsPayloadPending = jest.spyOn(Domain, 'isPayloadPending')
const mockHasMatchingScope = jest.spyOn(Domain, 'hasMatchingScopeForPayload')
const mockPutErrorRequest = jest.spyOn(DomainError, 'putAuthorizationErrorRequest')
const mockHasActiveCredential = jest.spyOn(
  Domain,
  'hasActiveCredentialForPayload'
)

const mockVerifySignature = jest.spyOn(Challenge, 'verifySignature')

const mockRetrieveConsent = jest.spyOn(consentDB, 'retrieve')
const mockRetrieveAllScopes = jest.spyOn(scopeDB, 'retrieveAll')

const mockPutThirdpartyTransactionsAuth = jest.spyOn(
  thirdPartyRequest,
  'putThirdpartyRequestsTransactionsAuthorizations'
)
const mockValidateAndVerifySignature = jest.spyOn(
  Handler,
  'validateAndVerifySignature'
)
/*
 * Mock Request and Response Resources
 */
const payload: Domain.AuthPayload = {
  consentId: '1234',
  sourceAccountId: 'pisp-2343-f223',
  status: 'PENDING',
  challenge: 'QuoteResponse Object JSON string',
  value: 'YjYyODNkOWUwZjUxNzOThmMjllYjE2Yg=='
}

const request: Request = {
  headers: {
    'fspiop-source': 'switch'
  },
  params: {
    ID: '1234'
  },
  payload: payload
} as unknown as Request

const h: ResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (num: number): ResponseObject => {
        return {
          statusCode: num
        } as unknown as ResponseObject
      }
    } as unknown as ResponseObject
  }
} as unknown as ResponseToolkit

/*
 * Mock consent and scopes
 */
const mockConsent: Consent = {
  id: payload.consentId,
  status: 'ACTIVE',
  credentialStatus: 'ACTIVE',
  credentialPayload: 'Mock public key payload'
}

const mockScopes: Scope[] = [
  {
    consentId: payload.consentId,
    action: 'account.transfer',
    accountId: payload.sourceAccountId
  },
  {
    consentId: payload.consentId,
    action: 'account.balance',
    accountId: 'dfsp-2321-ahsh'
  }
]

/*
 * Incoming POST `/thirdpartyRequests/transaction/{ID}/authorizations'
 * Async Handler Helper Unit Tests
 */
describe('validateAndVerifySignature', (): void => {
  beforeEach((): void => {
    // Positive flow values for a successful 202 return
    mockIsPayloadPending.mockReturnValue(true)
    mockHasActiveCredential.mockReturnValue(true)
    mockHasMatchingScope.mockReturnValue(true)
    mockVerifySignature.mockReturnValue(true)
    mockPutErrorRequest.mockResolvedValue(undefined)
    mockRetrieveConsent.mockResolvedValue(mockConsent)
    mockRetrieveAllScopes.mockResolvedValue(mockScopes)

    mockPutThirdpartyTransactionsAuth.mockResolvedValue({
      statusCode: 200,
      headers: null,
      data: Buffer.from('Response Data')
    })
  })

  it('Should make PUT outgoing request for successful verification',
    async (): Promise<void> => {
      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
      expect(mockHasActiveCredential).toHaveBeenCalledWith(mockConsent)
      expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)

      expect(mockVerifySignature).toHaveBeenCalledWith(
        payload.challenge,
        payload.value,
        mockConsent.credentialPayload
      )

      expect(mockPutThirdpartyTransactionsAuth).toHaveBeenCalledWith(
        payload,
        request.params.ID,
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should throw a PayloadNotPendingError for payload not PENDING',
    async (): Promise<void> => {
      // Active Payload
      mockIsPayloadPending.mockReturnValue(false)

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockIsPayloadPending).toReturnWith(false)
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.PayloadNotPendingError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should throw a InactiveOrMissingCredentialError for inactive credential',
    async (): Promise<void> => {
    // Inactive credential
      mockHasActiveCredential.mockReturnValue(false)

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
      expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)
      expect(mockHasActiveCredential).toHaveBeenCalledWith(mockConsent)
      expect(mockHasActiveCredential).toReturnWith(false)
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.InactiveOrMissingCredentialError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a MissingScopeError for no matching consent scope',
    async (): Promise<void> => {
      // No matching scope for the consent in the DB
      mockHasMatchingScope.mockReturnValue(false)

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
      expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)
      expect(mockHasMatchingScope).toReturnWith(false)
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.MissingScopeError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for non-existent payload consent',
    async (): Promise<void> => {
      // Requested Consent not in the DB
      mockRetrieveConsent.mockRejectedValue(
        new NotFoundError('Consent', payload.consentId)
      )

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for error in retrieving consent',
    async (): Promise<void> => {
      mockRetrieveConsent.mockRejectedValue(
        new Error()
      )

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for no associated consent scopes',
    async (): Promise<void> => {
      // Consent does not have any scopes in DB
      mockRetrieveAllScopes.mockRejectedValue(
        new NotFoundError('Consent Scopes', payload.consentId)
      )

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for error in retrieving scopes',
    async (): Promise<void> => {
      mockRetrieveAllScopes.mockRejectedValue(
        new Error()
      )

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a InvalidSignatureError for wrong signature',
    async (): Promise<void> => {
      // Invalid signature
      mockVerifySignature.mockReturnValue(false)

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
      expect(mockHasActiveCredential).toHaveBeenCalledWith(mockConsent)
      expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)
      expect(mockVerifySignature).toReturnWith(false)
      expect(mockVerifySignature).toHaveBeenCalledWith(
        payload.challenge,
        payload.value,
        mockConsent.credentialPayload
      )
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.InvalidSignatureError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a SignatureVerificationError for error in signature verification',
    async (): Promise<void> => {
      mockVerifySignature.mockImplementationOnce((): boolean => {
        throw new Error()
      })

      await Handler.validateAndVerifySignature(request)

      expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
      expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
      expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
      expect(mockHasActiveCredential).toHaveBeenCalledWith(mockConsent)
      expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)
      expect(mockVerifySignature).toHaveBeenCalledWith(
        payload.challenge,
        payload.value,
        mockConsent.credentialPayload
      )
      // Error
      expect(mockPutErrorRequest).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.SignatureVerificationError((request.payload as Domain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )
})

/*
 * Incoming POST `/thirdpartyRequests/transaction/{ID}/authorizations'
 * Handler Unit Tests
 */
describe('handlers/thirdpartyRequests/transactions/{ID}/authorizations.test.ts',
  (): void => {
    beforeEach((): void => {
      // TODO: this mock is not working... why?
      mockValidateAndVerifySignature.mockResolvedValue(undefined)
    })
    it('Should return 202 (Accepted) and call async handler', (): void => {
      const response = Handler.post(
        {
          method: request.method,
          path: request.path,
          body: request.payload,
          query: request.query,
          headers: request.headers
        },
        request,
        h)

      // TODO: mock is not working!
      // expect(mockValidateAndVerifySignature).toHaveBeenCalledWith(request)
      expect(response.statusCode).toEqual(Enum.Http.ReturnCodes.ACCEPTED.CODE)
    })
  }
)
