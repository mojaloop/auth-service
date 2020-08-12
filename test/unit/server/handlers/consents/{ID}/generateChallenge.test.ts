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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>

 --------------
 ******/
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi'
import { consentDB, scopeDB } from '~/lib/db'
import { Consent, ConsentCredential } from '~/model/consent'
import * as Handler from '~/server/handlers/consents/{ID}/generateChallenge'
import * as Challenge from '~/lib/challenge'
import * as Domain from '~/domain/consents/generateChallenge'
import * as ScopeFunctions from '~/lib/scopes'
import Logger from '@mojaloop/central-services-logger'
import { Enum } from '@mojaloop/central-services-shared'
import { Scope } from '~/model/scope'
import { thirdPartyRequest } from '~/lib/requests'
import SDKStandardComponents, {
  GenericRequestResponse
} from '@mojaloop/sdk-standard-components'

// Declaring Mocks
const mockPutConsents = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockGeneratePutConsentsRequest = jest.spyOn(Domain, 'generatePutConsentsRequest')
const mockUpdateConsentCredential = jest.spyOn(Domain, 'updateConsentCredential')
const mockGenerate = jest.spyOn(Challenge, 'generate')
const mockIsConsentRequestValid = jest.spyOn(Domain, 'isConsentRequestInitiatedByValidSource')
const mockConsentDbRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockScopeDbRetrieve = jest.spyOn(scopeDB, 'retrieveAll')
const mockConvertScopesToExternal = jest.spyOn(ScopeFunctions, 'convertScopesToExternal')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

/*
 * Mock Request + Response Resources
 */
// @ts-ignore
const request: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    id: '1234'
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
const partialConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123'
}

const completeConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  // credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

const completeConsentActiveCredential: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'ACTIVE',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

const credential: ConsentCredential = {
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs=',
  credentialPayload: null
}

const challenge = 'xyhdushsoa82w92mzs='

const scopes: Scope[] = [{
  id: 123234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'account.getAccess'
},
{
  id: 232234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'account.transferMoney'
},
{
  id: 234,
  consentId: '1234',
  accountId: 'as22',
  action: 'account.getAccess'
}
]

const externalScopes = [{
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

const putConsentRequestBody: SDKStandardComponents.PutConsentsRequest = {
  requestId: '1234',
  initiatorId: completeConsent.initiatorId as string,
  participantId: completeConsent.participantId as string,
  scopes: externalScopes,
  credential: {
    id: null,
    credentialType: 'FIDO',
    status: 'PENDING',
    challenge: {
      payload: completeConsent.credentialChallenge as string,
      signature: null
    },
    payload: null
  }
}

describe('server/handlers/consents/{ID}/generateChallenge', (): void => {
  beforeAll((): void => {
    mockUpdateConsentCredential.mockResolvedValue(completeConsent)
    mockGenerate.mockResolvedValue(challenge)
    mockIsConsentRequestValid.mockReturnValue(true)
    mockConsentDbRetrieve.mockResolvedValue(partialConsent)
    mockPutConsents.mockResolvedValue(1 as unknown as GenericRequestResponse)
    mockGeneratePutConsentsRequest.mockResolvedValue(putConsentRequestBody)
    mockConvertScopesToExternal.mockReturnValue(externalScopes)
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
    mockScopeDbRetrieve.mockResolvedValue(scopes)

    // jest.useFakeTimers()
  })

  beforeEach((): void => {
    // jest.clearAllTimers()
    jest.clearAllMocks()
  })

  describe('generateChallengeAndPutConsent', (): void => {
    it('Should finish without any errors, generating challenge, updating credentials and making outgoing call',
      async (): Promise<void> => {
        await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id)).resolves.toBeUndefined()

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
        expect(mockGenerate).toHaveBeenCalledWith()
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsent, credential)
        expect(mockScopeDbRetrieve).toHaveBeenCalled()
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsent, externalScopes)
        expect(mockPutConsents)
          .toHaveBeenCalledWith(
            completeConsent.id,
            putConsentRequestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      })

    it('Should finish without any errors, NOT generating challenge or updating credentials, and making outgoing call',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(completeConsent)
        await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id)).resolves.toBeUndefined()

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, completeConsent)
        expect(mockScopeDbRetrieve).toHaveBeenCalled()
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsent, externalScopes)
        expect(mockPutConsents)
          .toHaveBeenCalledWith(
            completeConsent.id,
            putConsentRequestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )

        expect(mockGenerate).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      })

    it('Should throw an error due to error retrieving consent from database', async (): Promise<void> => {
      mockConsentDbRetrieve.mockRejectedValueOnce(new Error('Error retrieving consent'))

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id))
        .rejects.toThrowError('NotImplementedYetError')

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
      expect(mockIsConsentRequestValid).not.toHaveBeenCalled()
      expect(mockLoggerError).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/1234')
      expect(mockLoggerPush).toHaveBeenCalledWith(Error('Error retrieving consent'))

      expect(mockGenerate).not.toHaveBeenCalled()
      expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should throw an error due to invalid request from database', async (): Promise<void> => {
      mockIsConsentRequestValid.mockReturnValueOnce(false)

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id))
        .rejects.toThrowError('NotImplementedYetError')

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
      expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
      expect(mockLoggerError).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/1234')
      expect(mockLoggerPush).toHaveBeenCalledWith(Error('NotImplementedYetError'))

      expect(mockGenerate).not.toHaveBeenCalled()
      expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should throw an error due to error updating credentials in database', async (): Promise<void> => {
      mockUpdateConsentCredential.mockRejectedValueOnce(new Error('Error updating db'))

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id))
        .rejects.toThrowError('Error updating db')

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
      expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
      expect(mockGenerate).toHaveBeenCalledWith()
      expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsent, credential)
      expect(mockLoggerError).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/1234')
      expect(mockLoggerPush).toHaveBeenCalledWith(Error('Error updating db'))

      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should throw an error due to error in challenge generation', async (): Promise<void> => {
      mockGenerate.mockRejectedValueOnce(new Error('Error generating challenge'))

      await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id))
        .rejects.toThrowError('Error generating challenge')

      expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
      expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
      expect(mockGenerate).toHaveBeenCalledWith()
      expect(mockLoggerPush).toHaveBeenCalledWith(Error('Error generating challenge'))
      expect(mockLoggerError).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/1234')

      expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
      expect(mockScopeDbRetrieve).not.toHaveBeenCalled()
      expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
      expect(mockGeneratePutConsentsRequest).not.toHaveBeenCalled()
      expect(mockPutConsents).not.toHaveBeenCalled()
    })

    it('Should throw an error due to error in PUT consents/{id}',
      async (): Promise<void> => {
        mockPutConsents.mockRejectedValueOnce(new Error('Could not establish connection'))

        await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id))
          .rejects.toThrowError('Could not establish connection')

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
        expect(mockGenerate).toHaveBeenCalledWith()
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsent, credential)
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsent, externalScopes)
        expect(mockLoggerPush).toHaveBeenCalledWith(Error('Could not establish connection'))
        expect(mockLoggerError).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/1234')
        expect(mockPutConsents)
          .toHaveBeenCalledWith(
            completeConsent.id,
            putConsentRequestBody,
            request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
          )
      })

    it('Should throw an error due to error in generating PUT request body',
      async (): Promise<void> => {
        mockGeneratePutConsentsRequest.mockRejectedValueOnce(new Error('Test'))

        await expect(Handler.generateChallengeAndPutConsent(request, partialConsent.id))
          .rejects.toThrowError('Test')

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
        expect(mockGenerate).toHaveBeenCalledWith()
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsent, credential)
        expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
        expect(mockGeneratePutConsentsRequest).toHaveBeenCalledWith(completeConsent, externalScopes)
        expect(mockLoggerPush).toHaveBeenCalledWith(Error('Test'))
        expect(mockLoggerError).toHaveBeenCalledWith('Outgoing call NOT made to PUT consent/1234')

        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('Should log an error due to ACTIVE credential in consent',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(completeConsentActiveCredential)
        await expect(Handler.generateChallengeAndPutConsent(
          request, partialConsent.id))
          .rejects.toThrowError()

        expect(mockConsentDbRetrieve).toHaveBeenCalledWith(partialConsent.id)
        expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, completeConsentActiveCredential)
        expect(mockLoggerError).toHaveBeenCalledWith('ACTIVE credential consent has requested challenge')

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
        request as Request,
        h as ResponseToolkit
      )
      expect(response).toBe(h.response().code(202))
    })
  })
})
