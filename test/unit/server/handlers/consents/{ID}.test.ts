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
 - Ahan Gupta <ahangupta@google.com>
 --------------
 ******/
import { Request } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import * as Handler from '~/server/handlers/consents/{ID}'
import * as Domain from '~/domain/consents/{ID}'
import {
  IncorrectChallengeError,
  IncorrectConsentStatusError,
  InvalidSignatureError
} from '~/domain/errors'
import { NotFoundError } from '~/model/errors'
import * as Signature from '~/lib/challenge'
import Logger from '@mojaloop/central-services-logger'
import { Consent } from '~/model/consent'
import SDKStandardComponents from '@mojaloop/sdk-standard-components'
import { CredentialStatusEnum, ConsentCredential } from '~/model/consent/consent'
import { ExternalScope } from '~/lib/scopes'
import { thirdPartyRequest } from '~/lib/requests'
import { requestWithPayloadCredentialAndScope, h } from 'test/unit/data/data'

const mockRetrieveValidConsent = jest.spyOn(Domain, 'retrieveValidConsent')
const mockPutConsents = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockUpdateConsentCredential = jest.spyOn(Domain, 'updateConsentCredential')
const mockBuildConsentRequestBody = jest.spyOn(Domain, 'buildConsentRequestBody')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const mockVerifySignature = jest.spyOn(Signature, 'verifySignature')

/* Mock the retrieved consent value. */
const retrievedConsent: Consent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pispa',
  participantId: 'sfsfdf23',
  credentialId: '9876',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'string_representing_challenge_payload'
}

// Mock Variables from Request Payload
const consentId = requestWithPayloadCredentialAndScope.params.ID
const destinationParticipantId = requestWithPayloadCredentialAndScope.headers[Enum.Http.Headers.FSPIOP.SOURCE]
const credentialRequest = requestWithPayloadCredentialAndScope.payload as Handler.UpdateCredentialRequest

const {
  credential: {
    challenge: {
      signature,
      payload: challenge
    },
    payload: publicKey,
    id: requestCredentialId
  }
} = requestWithPayloadCredentialAndScope.payload as Handler.UpdateCredentialRequest

/* Mock the ConsentCredential Value. */
const verifiedCredential: ConsentCredential = {
  credentialType: 'FIDO',
  credentialId: requestCredentialId,
  credentialStatus: CredentialStatusEnum.VERIFIED,
  credentialPayload: publicKey,
  credentialChallenge: challenge
}

const externalScopes: ExternalScope[] = [
  {
    accountId: 'as2342',
    actions: ['account.getAccess', 'account.transferMoney']
  },
  {
    accountId: 'as22',
    actions: ['account.getAccess']
  }
]

// Mock Outgoing Request Body
const requestBody: SDKStandardComponents.PutConsentsRequest = {
  requestId: consentId,
  scopes: externalScopes,
  initiatorId: retrievedConsent.initiatorId as string,
  participantId: retrievedConsent.participantId as string,
  credential: {
    id: requestCredentialId,
    credentialType: 'FIDO',
    status: CredentialStatusEnum.PENDING,
    challenge: {
      payload: retrievedConsent.credentialChallenge as string,
      signature
    },
    payload: publicKey
  }
}

describe('server/handler/consents/{ID}', (): void => {
  beforeAll((): void => {
    mockRetrieveValidConsent.mockResolvedValue(retrievedConsent)
    mockPutConsents.mockResolvedValue(1 as unknown as SDKStandardComponents.GenericRequestResponse)
    mockUpdateConsentCredential.mockResolvedValue(0)
    mockBuildConsentRequestBody.mockResolvedValue(requestBody)
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
    mockVerifySignature.mockReturnValue(true)
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  describe('validateAndUpdateConsent', (): void => {
    it('should resolve successfully with no errors',
      async (): Promise<void> => {
        await expect(Handler.validateAndUpdateConsent(consentId, credentialRequest, destinationParticipantId))
          .resolves
          .toBeUndefined()

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(consentId, challenge)

        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, verifiedCredential)
        expect(mockBuildConsentRequestBody).toHaveBeenCalledWith(retrievedConsent, signature, publicKey)
        expect(mockPutConsents).toHaveBeenCalledWith(
          consentId, requestBody, requestWithPayloadCredentialAndScope.headers[Enum.Http.Headers.FSPIOP.SOURCE])

        expect(mockLoggerError).not.toHaveBeenCalled()
        expect(mockLoggerPush).not.toHaveBeenCalled()
      })

    it('should propagate retrieveValidConsent IncorrectChallenge error',
      async (): Promise<void> => {
        mockRetrieveValidConsent.mockRejectedValueOnce(new IncorrectChallengeError(consentId))

        await expect(Handler.validateAndUpdateConsent(consentId, credentialRequest, destinationParticipantId)).resolves.toBeUndefined()

        expect(mockLoggerPush).toBeCalledWith(new IncorrectChallengeError(consentId))
        expect(mockLoggerError).toBeCalledWith('Error: Outgoing PUT consents/{ID} call not made')

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(consentId, challenge)

        expect(mockVerifySignature).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockBuildConsentRequestBody).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should propagate retrieveValidConsent IncorrectConsentStatus error',
      async (): Promise<void> => {
        mockRetrieveValidConsent.mockRejectedValueOnce(new IncorrectConsentStatusError(consentId))

        await expect(Handler.validateAndUpdateConsent(consentId, credentialRequest, destinationParticipantId)).resolves.toBeUndefined()

        expect(mockLoggerPush).toBeCalledWith(new IncorrectConsentStatusError(consentId))
        expect(mockLoggerError).toBeCalledWith('Error: Outgoing PUT consents/{ID} call not made')

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(consentId, challenge)

        expect(mockVerifySignature).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockBuildConsentRequestBody).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should log the error when trying to retrieve consent resource that does not exist',
      async (): Promise<void> => {
        mockRetrieveValidConsent.mockRejectedValueOnce(new NotFoundError('Consent', consentId))

        await expect(Handler.validateAndUpdateConsent(consentId, credentialRequest, destinationParticipantId)).resolves.toBeUndefined()

        expect(mockLoggerPush).toBeCalledWith(new NotFoundError('Consent', consentId))
        expect(mockLoggerError).toBeCalledWith('Error: Outgoing PUT consents/{ID} call not made')

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(consentId, challenge)

        expect(mockVerifySignature).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockBuildConsentRequestBody).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should fail to verify the signature and log error',
      async (): Promise<void> => {
        mockVerifySignature.mockReturnValueOnce(false)

        await expect(Handler.validateAndUpdateConsent(consentId, credentialRequest, destinationParticipantId)).resolves.toBeUndefined()

        expect(mockLoggerPush).toBeCalledWith(new InvalidSignatureError(consentId))
        expect(mockLoggerError).toBeCalledWith('Error: Outgoing PUT consents/{ID} call not made')

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(consentId, challenge)

        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should fail to update the consent credential attributes and log an error',
      async (): Promise<void> => {
        const err: NotFoundError = new NotFoundError('Consent', consentId)
        mockUpdateConsentCredential.mockRejectedValueOnce(err)

        await expect(Handler.validateAndUpdateConsent(consentId, credentialRequest, destinationParticipantId)).resolves.toBeUndefined()

        expect(mockLoggerPush).toBeCalledWith(err)
        expect(mockLoggerError).toBeCalledWith('Error: Outgoing PUT consents/{ID} call not made')

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(consentId, challenge)

        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, verifiedCredential)
        expect(mockBuildConsentRequestBody).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should fail to make the outgoing call to PUT /consents/{ID} and throw an error',
      async (): Promise<void> => {
        const err: Error = new Error('error thrown')
        mockPutConsents.mockRejectedValueOnce(err)

        await expect(Handler.validateAndUpdateConsent(consentId, credentialRequest, destinationParticipantId)).resolves.toBeUndefined()

        expect(mockLoggerPush).toBeCalledWith(err)
        expect(mockLoggerError).toBeCalledWith('Error: Outgoing PUT consents/{ID} call not made')

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(consentId, challenge)

        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, verifiedCredential)
        expect(mockBuildConsentRequestBody).toHaveBeenCalledWith(retrievedConsent, signature, publicKey)
        expect(mockPutConsents).toHaveBeenCalledWith(
          consentId, requestBody, requestWithPayloadCredentialAndScope.headers[Enum.Http.Headers.FSPIOP.SOURCE])
      })
  })

  describe('PUT Handler', (): void => {
    const mockvalidateAndUpdateConsent = jest.spyOn(Handler, 'validateAndUpdateConsent')
    beforeAll((): void => {
      mockvalidateAndUpdateConsent.mockResolvedValue()
    })

    it('should return a 202 success code.', async (): Promise<void> => {
      const req = requestWithPayloadCredentialAndScope as Request
      const response = await Handler.put(
        {
          method: req.method,
          path: req.path,
          body: req.payload,
          query: req.query,
          headers: req.headers
        },
        req,
        h)
      expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
    })
  })
})
