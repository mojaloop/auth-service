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
import { thirdPartyRequest } from '~/domain/requests'
import {
  consentDB,
  scopeDB
} from '~/model/db'
import * as Challenge from '~/domain/challenge'
import * as AuthorizationsDomain from '~/domain/authorizations'
import * as AuthPayloadDomain from '~/domain/auth-payload'
import * as DomainError from '~/domain/errors'
import * as Handler from '~/server/handlers/thirdpartyRequests/transactions/{ID}/authorizations'
import { mocked } from 'ts-jest/utils'
import { AuthPayload } from '~/domain/auth-payload'

// jest.mock('~/shared/logger')
jest.mock('~/domain/challenge')
jest.mock('~/domain/errors')
jest.mock('~/domain/auth-payload')
jest.mock('~/domain/requests')
jest.mock('~/model/db')

/*
 * Mock Request and Response Resources
 */
const payload: AuthPayloadDomain.AuthPayload = {
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
const mockConsentPending: Consent = {
  id: payload.consentId,
  status: 'PENDING',
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
    mocked(AuthPayloadDomain.isPayloadPending).mockReturnValue(true)
    mocked(AuthPayloadDomain.hasActiveCredentialForPayload).mockReturnValue(true)
    mocked(AuthPayloadDomain.hasMatchingScopeForPayload).mockReturnValue(true)
    mocked(Challenge.verifySignature).mockReturnValue(true)
    mocked(DomainError.putAuthorizationErrorRequest).mockResolvedValue(undefined)
    mocked(consentDB.retrieve).mockResolvedValue(mockConsentPending)
    mocked(scopeDB.retrieveAll).mockResolvedValue(mockScopes)
    mocked(thirdPartyRequest.putThirdpartyRequestsTransactionsAuthorizations).mockResolvedValue({
      statusCode: 200,
      headers: null,
      data: Buffer.from('Response Data')
    })
  })

  it('Should make PUT outgoing request for successful verification',
    async (): Promise<void> => {
      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(scopeDB.retrieveAll)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(AuthPayloadDomain.hasActiveCredentialForPayload)).toHaveBeenCalledWith(mockConsentPending)
      // expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)

      expect(mocked(Challenge.verifySignature)).toHaveBeenCalledWith(
        payload.challenge,
        payload.value,
        mockConsentPending.credentialPayload
      )

      expect(mocked(thirdPartyRequest.putThirdpartyRequestsTransactionsAuthorizations)).toHaveBeenCalledWith(
        payload,
        request.params.ID,
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should throw a PayloadNotPendingError for payload not PENDING',
    async (): Promise<void> => {
      // Active Payload
      mocked(AuthPayloadDomain.isPayloadPending).mockReturnValue(false)

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(AuthPayloadDomain.isPayloadPending)).toReturnWith(false)

      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.PayloadNotPendingError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should throw a InactiveOrMissingCredentialError for inactive credential',
    async (): Promise<void> => {
      // Inactive credential
      mocked(AuthPayloadDomain.hasActiveCredentialForPayload).mockReturnValue(false)

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(scopeDB.retrieveAll)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(AuthPayloadDomain.hasMatchingScopeForPayload)).toHaveBeenCalledWith(mockScopes, payload)
      expect(mocked(AuthPayloadDomain.hasActiveCredentialForPayload)).toHaveBeenCalledWith(mockConsentPending)
      expect(mocked(AuthPayloadDomain.hasActiveCredentialForPayload)).toReturnWith(false)

      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.InactiveOrMissingCredentialError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a MissingScopeError for no matching consent scope',
    async (): Promise<void> => {
      // No matching scope for the consent in the DB
      mocked(AuthPayloadDomain.hasMatchingScopeForPayload).mockReturnValue(false)

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(scopeDB.retrieveAll)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(AuthPayloadDomain.hasMatchingScopeForPayload)).toHaveBeenCalledWith(mockScopes, payload)
      expect(mocked(AuthPayloadDomain.hasMatchingScopeForPayload))
      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.MissingScopeError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for non-existent payload consent',
    async (): Promise<void> => {
      // Requested Consent not in the DB
      mocked(consentDB.retrieve).mockRejectedValue(
        new NotFoundError('Consent', payload.consentId)
      )

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for error in retrieving consent',
    async (): Promise<void> => {
      mocked(consentDB.retrieve).mockRejectedValue(
        new Error()
      )

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for no associated consent scopes',
    async (): Promise<void> => {
      // Consent does not have any scopes in DB
      mocked(scopeDB.retrieveAll).mockRejectedValue(
        new NotFoundError('Consent Scopes', payload.consentId)
      )

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(scopeDB.retrieveAll)).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a DatabaseError for error in retrieving scopes',
    async (): Promise<void> => {
      mocked(scopeDB.retrieveAll).mockRejectedValue(
        new Error()
      )

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(scopeDB.retrieveAll)).toHaveBeenCalledWith(payload.consentId)
      // expect(mocked(logger.push)).toHaveBeenCalled()
      // expect(mocked(logger.error)).toHaveBeenCalled()
      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.DatabaseError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a InvalidSignatureError for wrong signature',
    async (): Promise<void> => {
      // Invalid signature
      mocked(Challenge.verifySignature).mockReturnValue(false)

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(scopeDB.retrieveAll)).toHaveBeenCalledWith(payload.consentId)
      // expect(mockHasActiveCredential).toHaveBeenCalledWith(mockConsent)
      // expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)
      expect(mocked(Challenge.verifySignature)).toReturnWith(false)
      expect(mocked(Challenge.verifySignature)).toHaveBeenCalledWith(
        payload.challenge,
        payload.value,
        mockConsentPending.credentialPayload
      )
      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.InvalidSignatureError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
    }
  )

  it('Should return a SignatureVerificationError for error in signature verification',
    async (): Promise<void> => {
      mocked(Challenge.verifySignature).mockImplementationOnce(() => {
        throw new Error()
      })

      await AuthorizationsDomain.validateAndVerifySignature(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )

      expect(mocked(AuthPayloadDomain.isPayloadPending)).toHaveBeenCalledWith(payload)
      expect(mocked(consentDB.retrieve)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(scopeDB.retrieveAll)).toHaveBeenCalledWith(payload.consentId)
      expect(mocked(AuthPayloadDomain.hasActiveCredentialForPayload)).toHaveBeenCalledWith(mockConsentPending)
      expect(mocked(AuthPayloadDomain.hasMatchingScopeForPayload)).toHaveBeenCalledWith(mockScopes, payload)

      expect(mocked(Challenge.verifySignature)).toHaveBeenCalledWith(
        payload.challenge,
        payload.value,
        mockConsentPending.credentialPayload
      )
      // Error
      expect(mocked(DomainError.putAuthorizationErrorRequest)).toHaveBeenCalledWith(
        request.params.ID,
        new DomainError.SignatureVerificationError((request.payload as AuthPayloadDomain.AuthPayload).consentId),
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
    it('Should return 202 (Accepted) and call async handler', (): void => {
      const mockValidateAndVerifySignature = jest.spyOn(AuthorizationsDomain, 'validateAndVerifySignature')
      mockValidateAndVerifySignature.mockResolvedValue(undefined)
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
      expect(mockValidateAndVerifySignature).toHaveBeenCalledWith(
        request.payload as AuthPayload,
        request.params.ID,
        request.headers['fspiop-source']
      )
      expect(response.statusCode).toEqual(Enum.Http.ReturnCodes.ACCEPTED.CODE)
    })
  }
)
