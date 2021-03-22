/* eslint-disable max-len */
/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
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
import { consentDB, scopeDB } from '~/lib/db'
import * as Handler from '~/server/handlers/consents/{ID}/generateChallenge'
import * as Challenge from '~/lib/challenge'
import * as Domain from '~/domain/consents/generateChallenge'
import * as ScopeFunctions from '~/lib/scopes'
import * as validators from '~/domain/validators'
import { logger } from '~/shared/logger'
import { Enum } from '@mojaloop/central-services-shared'
import { thirdPartyRequest } from '~/lib/requests'
import {
  GenericRequestResponse,
  PutConsentsRequest
} from '@mojaloop/sdk-standard-components'
import {
  externalScopes, challenge, credentialPending,
  completeConsentRevoked, completeConsentActiveCredential, h,
  completeConsentActive, partialConsentActive, scopes, request
} from 'test/data/data'
import { mocked } from 'ts-jest/utils'
import * as DomainError from '~/domain/errors'

jest.mock('~/shared/logger')

// Declaring Mocks
const mockPutConsents = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockGeneratePutConsentsRequest = jest.spyOn(Domain, 'generatePutConsentsRequest')
const mockUpdateConsentCredential = jest.spyOn(Domain, 'updateConsentCredential')
const mockGenerate = jest.spyOn(Challenge, 'generate')
const mockIsConsentRequestValid = jest.spyOn(validators, 'isConsentRequestInitiatedByValidSource')
const mockConsentDbRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockScopeDbRetrieve = jest.spyOn(scopeDB, 'retrieveAll')
const mockConvertScopesToExternal = jest.spyOn(ScopeFunctions, 'convertScopesToExternal')
const mockPutConsentError = jest.spyOn(DomainError, 'putConsentError')

const putConsentRequestBody: PutConsentsRequest = {
  requestId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  initiatorId: completeConsentActive.initiatorId as string,
  participantId: completeConsentActive.participantId as string,
  scopes: externalScopes,
  credential: {
    id: null,
    credentialType: 'FIDO',
    status: 'PENDING',
    challenge: {
      payload: completeConsentActive.credentialChallenge as string,
      signature: null
    },
    payload: null
  }
}

describe('server/handlers/consents/{ID}/generateChallenge', (): void => {
  beforeAll((): void => {
    mockUpdateConsentCredential.mockResolvedValue(completeConsentActive)
    mockGenerate.mockResolvedValue(challenge)
    mockIsConsentRequestValid.mockReturnValue(true)
    mockConsentDbRetrieve.mockResolvedValue(partialConsentActive)
    mockPutConsents.mockResolvedValue(1 as unknown as GenericRequestResponse)
    mockGeneratePutConsentsRequest.mockResolvedValue(putConsentRequestBody)
    mockConvertScopesToExternal.mockReturnValue(externalScopes)
    mockScopeDbRetrieve.mockResolvedValue(scopes)
    mockPutConsentError.mockResolvedValue()

    // jest.useFakeTimers()
  })

  beforeEach((): void => {
    // jest.clearAllTimers()
    jest.clearAllMocks()
  })

  describe('generateChallengeAndPutConsent', (): void => {
    it('Should finish without any errors, generating challenge, updating credentials and making outgoing call',
      async (): Promise<void> => {
        await expect(Handler.generateChallengeAndPutConsent(request, partialConsentActive.id)).resolves.toBeUndefined()

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsentActive.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(partialConsentActive, request)
        expect(mockGenerate).toHaveBeenCalledWith()
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsentActive, credentialPending)
        expect(mockScopeDbRetrieve).toHaveBeenCalled()
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsentActive, externalScopes)
        expect(mockPutConsents)
          .toHaveBeenCalledWith(
            completeConsentActive.id,
            putConsentRequestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      })

    it('Should resolve successfully, not generating challenge, not updating credentials, and making outgoing call',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(completeConsentActive)
        await expect(Handler.generateChallengeAndPutConsent(request, completeConsentActive.id)).resolves.toBeUndefined()

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(completeConsentActive.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(completeConsentActive, request)
        expect(mockScopeDbRetrieve).toHaveBeenCalled()
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsentActive, externalScopes)
        expect(mockPutConsents)
          .toHaveBeenCalledWith(
            completeConsentActive.id,
            putConsentRequestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )

        expect(mockGenerate).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      })

    it('Should throw an error due to revoked consent', async (): Promise<void> => {
      mockConsentDbRetrieve.mockResolvedValueOnce(completeConsentRevoked)

      // Function gracefully finishes but calls outgoing call to put error
      await expect(Handler.generateChallengeAndPutConsent(request, completeConsentRevoked.id))
        .resolves
        .toBeUndefined()

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(completeConsentRevoked.id)
      expect(mockIsConsentRequestValid).toHaveBeenCalledWith(completeConsentRevoked, request)
      expect(mockPutConsentError).toHaveBeenCalledWith(
        completeConsentRevoked.id,
        new DomainError.RevokedConsentStatusError(completeConsentRevoked.id),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
      expect(mocked(logger.error)).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/b51ec534-ee48-4575-b6a9-ead2955b8069')
      expect(mocked(logger.push)).toHaveBeenCalledWith({ error: new DomainError.RevokedConsentStatusError(completeConsentRevoked.id) })

      expect(mockGenerate).not.toHaveBeenCalled()
      expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should propagate and convert error in retrieving consent from database', async (): Promise<void> => {
      mockConsentDbRetrieve.mockRejectedValueOnce(new Error('Error retrieving consent'))

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsentActive.id))
        .resolves
        .toBeUndefined()

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsentActive.id)
      expect(mockIsConsentRequestValid).not.toHaveBeenCalled()
      expect(mocked(logger.error)).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/b51ec534-ee48-4575-b6a9-ead2955b8069')
      expect(mocked(logger.push)).toHaveBeenCalledWith({ error: new Error('Error retrieving consent') })
      expect(mockPutConsentError).toHaveBeenCalledWith(
        partialConsentActive.id,
        new DomainError.DatabaseError(partialConsentActive.id),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )

      expect(mockGenerate).not.toHaveBeenCalled()
      expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should throw an error due to invalid request', async (): Promise<void> => {
      mockIsConsentRequestValid.mockReturnValueOnce(false)

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsentActive.id))
        .resolves
        .toBeUndefined()

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsentActive.id)
      expect(mockIsConsentRequestValid).toHaveBeenCalledWith(partialConsentActive, request)
      expect(mocked(logger.push)).toHaveBeenCalledWith({ error: new DomainError.InvalidInitiatorSourceError('b51ec534-ee48-4575-b6a9-ead2955b8069') })
      expect(mocked(logger.error)).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/b51ec534-ee48-4575-b6a9-ead2955b8069')
      expect(mockPutConsentError).toHaveBeenCalledWith(
        partialConsentActive.id,
        new DomainError.InvalidInitiatorSourceError(partialConsentActive.id),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )

      expect(mockGenerate).not.toHaveBeenCalled()
      expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should propagate and convert error in updating credentials in database', async (): Promise<void> => {
      mockUpdateConsentCredential.mockRejectedValueOnce(new DomainError.DatabaseError(partialConsentActive.id))

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsentActive.id))
        .resolves
        .toBeUndefined()

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsentActive.id)
      expect(mockIsConsentRequestValid).toHaveBeenCalledWith(partialConsentActive, request)
      expect(mockGenerate).toHaveBeenCalledWith()
      expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsentActive, credentialPending)
      expect(mocked(logger.error)).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/b51ec534-ee48-4575-b6a9-ead2955b8069')
      expect(mocked(logger.push)).toHaveBeenCalledWith({ error: new DomainError.DatabaseError(partialConsentActive.id) })
      expect(mockPutConsentError).toHaveBeenCalledWith(
        partialConsentActive.id,
        new DomainError.DatabaseError(partialConsentActive.id),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )

      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should propagate error in challenge generation', async (): Promise<void> => {
      mockGenerate.mockRejectedValueOnce(new Error('Error generating challenge'))

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsentActive.id))
        .resolves
        .toBeUndefined()

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsentActive.id)
      expect(mockIsConsentRequestValid).toHaveBeenCalledWith(partialConsentActive, request)
      expect(mockGenerate).toHaveBeenCalledWith()
      expect(mocked(logger.push)).toHaveBeenCalledWith({ error: new DomainError.ChallengeGenerationError('b51ec534-ee48-4575-b6a9-ead2955b8069') })
      expect(mocked(logger.error)).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/b51ec534-ee48-4575-b6a9-ead2955b8069')
      expect(mockPutConsentError).toHaveBeenCalledWith(
        partialConsentActive.id,
        new DomainError.ChallengeGenerationError(partialConsentActive.id),
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )

      expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should propagate error in making outgoing PUT consents/{id}',
      async (): Promise<void> => {
        mockPutConsents.mockRejectedValueOnce(new Error('Could not establish connection'))

        await expect(Handler.generateChallengeAndPutConsent(request, partialConsentActive.id))
          .resolves
          .toBeUndefined()

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsentActive.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(partialConsentActive, request)
        expect(mockGenerate).toHaveBeenCalledWith()
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsentActive, credentialPending)
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsentActive, externalScopes)
        expect(mocked(logger.push)).toHaveBeenCalledWith({ error: new Error('Could not establish connection') })
        expect(mocked(logger.error)).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/b51ec534-ee48-4575-b6a9-ead2955b8069')
        expect(mockPutConsents)
          .toHaveBeenCalledWith(
            completeConsentActive.id,
            putConsentRequestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
        expect(mockPutConsentError).not.toHaveBeenCalled()
      })

    it('Should propagate error in generating PUT request body',
      async (): Promise<void> => {
        mockGeneratePutConsentsRequest.mockRejectedValueOnce(new Error('Test'))

        await expect(Handler.generateChallengeAndPutConsent(request, partialConsentActive.id))
          .resolves
          .toBeUndefined()

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsentActive.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(partialConsentActive, request)
        expect(mockGenerate).toHaveBeenCalledWith()
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsentActive, credentialPending)
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsentActive, externalScopes)
        expect(mocked(logger.push)).toHaveBeenCalledWith({ consent: expect.objectContaining(partialConsentActive) })
        expect(mocked(logger.error)).toHaveBeenCalledWith('Failed to create put consent request')
        expect(mocked(logger.push)).toHaveBeenCalledWith({ error: new DomainError.PutRequestCreationError(partialConsentActive.id) })
        expect(mocked(logger.error)).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/b51ec534-ee48-4575-b6a9-ead2955b8069')
        expect(mockPutConsentError).toHaveBeenCalledWith(
          partialConsentActive.id,
          new DomainError.PutRequestCreationError(partialConsentActive.id),
          request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
        )

        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('Should throw an error due to ACTIVE credential in consent',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(completeConsentActiveCredential)
        await expect(Handler.generateChallengeAndPutConsent(
          request, completeConsentActiveCredential.id))
          .resolves
          .toBe(undefined)

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(completeConsentActiveCredential.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(completeConsentActiveCredential, request)
        expect(mockPutConsentError).toHaveBeenCalledWith(
          completeConsentRevoked.id,
          new DomainError.ActiveConsentChallengeRequestError(completeConsentRevoked.id),
          request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
        )
        expect(mocked(logger.error)).toHaveBeenCalledWith('ACTIVE credential consent has requested challenge')

        expect(mockGenerate).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
        expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })
  })

  describe('Post', (): void => {
    const mockGenChallengeAndPutConsentId = jest.spyOn(Handler, 'generateChallengeAndPutConsent')
    beforeAll((): void => {
      mockGenChallengeAndPutConsentId.mockResolvedValue(undefined)
    })
    it('Should return 202 success code', async (): Promise<void> => {
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
