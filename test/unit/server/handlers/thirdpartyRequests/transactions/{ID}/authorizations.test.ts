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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import Logger from '@mojaloop/central-services-logger'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import * as Domain from '../../../../../../../src/server/domain/thirdpartyRequests/transactions/{ID}/authorizations'
import {
  consentDB,
  scopeDB
} from '../../../../.././../../src/lib/db'
import {
  post
} from '../../../../../../../src/server/handlers/thirdpartyRequests/transactions/{ID}/authorizations'
import { Consent } from '../../../../../../../src/model/consent'
import { Scope } from '../../../../../../../src/model/scope'
import * as Challenge from '../../../../../../../src/lib/challenge'
import { Enum } from '@mojaloop/central-services-shared'
import { NotFoundError } from '../../../../../../../src/model/errors'

/*
 * Mock Domain Functions
 */
const mockIsPayloadPending = jest.spyOn(Domain, 'isPayloadPending')
const mockHasActiveCredential = jest.spyOn(Domain, 'hasActiveCredentialForPayload')
const mockHasMatchingScope = jest.spyOn(Domain, 'hasMatchingScopeForPayload')
const mockVerifyChallenge = jest.spyOn(Challenge, 'verifySignature')
// Need to add response function mock

/*
 * Mock Model Functions
 */
const mockRetrieveConsent = jest.spyOn(consentDB, 'retrieve')
const mockRetrieveAllScopes = jest.spyOn(scopeDB, 'retrieveAll')

/*
 * Mock Logger Functions
 */
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

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

// @ts-ignore
const request: Request = {
  params: {
    id: '1234'
  },
  payload: payload
}

// @ts-ignore
const h: ResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (statusCode: number): ResponseObject => {
        return statusCode as unknown as ResponseObject
      }
    } as unknown as ResponseObject
  }
}

const mockConsent: Consent = {
  id: payload.consentId,
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
 * Handler Unit Tests
 */
describe('server/handlers/thirdpartyRequests/transaction/{ID}/authorizations', (): void => {
  beforeEach((): void => {
    mockIsPayloadPending.mockReturnValue(true)
    mockHasActiveCredential.mockReturnValue(true)
    mockHasMatchingScope.mockReturnValue(true)
    mockVerifyChallenge.mockReturnValue(true)

    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)

    mockRetrieveConsent.mockResolvedValue(mockConsent)
    mockRetrieveAllScopes.mockResolvedValue(mockScopes)

    // For setImmediate
    jest.useFakeTimers()
    jest.clearAllTimers()
  })

  it('Should return 202 (Accepted) response code for a correct request', async (): Promise<void> => {
    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
    expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
    expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
    expect(mockHasActiveCredential).toHaveBeenCalledWith(mockConsent)
    expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)

    jest.runAllImmediates()

    expect(setImmediate).toHaveBeenCalled()
    expect(mockVerifyChallenge).toHaveBeenCalledWith(
      payload.challenge,
      payload.value,
      mockConsent.credentialPayload
    )
  })

  it('Should return 400 (Bad Request) response code for a non `PENDING` payload', async (): Promise<void> => {
    // Active Payload
    mockIsPayloadPending.mockReturnValue(false)

    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.BADREQUEST.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
  })

  it('Should return 400 (Bad Request) response code for no `ACTIVE` credentials', async (): Promise<void> => {
    // Inactive credential
    mockHasActiveCredential.mockReturnValue(false)

    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.BADREQUEST.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
    expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
    expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
    expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)
    expect(mockHasActiveCredential).toHaveBeenCalledWith(mockConsent)
  })

  it('Should return 404 (Not Found) response code for no matching consent scope', async (): Promise<void> => {
    // No matching scope for the consent in the DB
    mockHasMatchingScope.mockReturnValue(false)

    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.NOTFOUND.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
    expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
    expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
    expect(mockHasMatchingScope).toHaveBeenCalledWith(mockScopes, payload)
  })

  it('Should return 404 (Not Found) response code for payload consent not existing', async (): Promise<void> => {
    // Requested Consent not in the DB
    mockRetrieveConsent.mockRejectedValue(
      new NotFoundError('Consent', payload.consentId)
    )

    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.NOTFOUND.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
    expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
    expect(mockLoggerPush).toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('Should return 500 (Server Error) response code for error in retrieving consent', async (): Promise<void> => {
    mockRetrieveConsent.mockRejectedValue(
      new Error()
    )

    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.INTERNALSERVERERRROR.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
    expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
    expect(mockLoggerPush).toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('Should return 404 (Not Found) response code for no associated consent scopes', async (): Promise<void> => {
    // Consent does not have any scopes in DB
    mockRetrieveAllScopes.mockRejectedValue(
      new NotFoundError('Consent Scopes', payload.consentId)
    )

    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.NOTFOUND.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
    expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
    expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
    expect(mockLoggerPush).toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('Should return 500 (Server Error) response code for error in retrieving scopes', async (): Promise<void> => {
    mockRetrieveAllScopes.mockRejectedValue(
      new Error()
    )

    const response = await post(request, h)

    // Accepted Acknowledgement
    expect(response).toBe(Enum.Http.ReturnCodes.INTERNALSERVERERRROR.CODE)

    expect(mockIsPayloadPending).toHaveBeenCalledWith(payload)
    expect(mockRetrieveConsent).toHaveBeenCalledWith(payload.consentId)
    expect(mockRetrieveAllScopes).toHaveBeenCalledWith(payload.consentId)
    expect(mockLoggerPush).toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalled()
  })
})
