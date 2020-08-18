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

 - Ahan Gupta <ahangupta@google.com>
 --------------
 ******/
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import * as Handler from '~/server/handlers/consents/{ID}'
import * as Domain from '~/domain/consents/{ID}'
import { IncorrectChallengeError, IncorrectStatusError } from '~/domain/errors'
import { NotFoundError } from '~/model/errors'
import * as Signature from '~/lib/challenge'
import Logger from '@mojaloop/central-services-logger'
import { Consent } from '~/model/consent'

const mockRetrieveValidConsent = jest.spyOn(Domain, 'retrieveValidConsent')
const mockCheckCredentialStatus = jest.spyOn(Domain, 'checkCredentialStatus')
const mockUpdateConsentCredential = jest.spyOn(Domain, 'updateConsentCredential')
const mockPutConsents = jest.spyOn(Domain, 'putConsents')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const mockVerifySignature = jest.spyOn(Signature, 'verifySignature')

/*
 * Mock Request Resources
 */
// @ts-ignore
const request: Request = {
  headers: {
    fspiopsource: 'pisp-2342-2233',
    fspiopdestination: 'dfsp-3333-2123'
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
    credential: {
      id: '9876',
      credentialType: 'FIDO',
      status: 'PENDING',
      challenge: {
        payload: 'string_representing_challenge_payload',
        signature: 'string_representing_challenge_signature'
      },
      payload: 'string_representing_credential_payload'
    }
  }
}

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

// @ts-ignore
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
}

describe('server/handler/consents/{ID}', (): void => {
  let id: string, signature: string, publicKey: string, challenge: string, requestCredentialId: string, credentialStatus: string
  beforeAll((): void => {
    mockRetrieveValidConsent.mockResolvedValue(retrievedConsent)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mockCheckCredentialStatus.mockReturnValue()
    mockUpdateConsentCredential.mockResolvedValue(0)
    mockPutConsents.mockResolvedValue()
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
    mockVerifySignature.mockReturnValue(true)

    /* Setting the attributes according to the incoming request */
    // @ts-ignore
    const requestPayloadCredential = request.payload.credential
    id = request.params.id
    signature = requestPayloadCredential.challenge.signature
    publicKey = requestPayloadCredential.payload
    challenge = requestPayloadCredential.challenge.payload
    requestCredentialId = requestPayloadCredential.id
    credentialStatus = requestPayloadCredential.status
  })

  beforeEach((): void => {
    jest.clearAllMocks()
    // jest.clearAllTimers()
  })

  describe('retrieveUpdateAndPutConsent', (): void => {
    it('should resolve successfully with no errors',
      async (): Promise<void> => {
        await expect(Handler.retrieveUpdateAndPutConsent())
          .resolves
          .toBeUndefined()

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
        expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

        /* Mock the Domain.ConsentCredential Value. */
        const credential: Domain.ConsentCredential = {
          credentialId: requestCredentialId,
          credentialStatus: 'ACTIVE',
          credentialPayload: publicKey
        }
        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, credential)
        expect(mockPutConsents).toHaveBeenCalledWith(retrievedConsent, signature, publicKey, request as Request)
      })

    it('should propagate retrieveValidConsent IncorrectChallenge error',
      async (): Promise<void> => {
        mockRetrieveValidConsent.mockRejectedValueOnce(new IncorrectChallengeError(id))

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
        expect(mockCheckCredentialStatus).not.toHaveBeenCalled()

        expect(mockVerifySignature).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should propagate retrieveValidConsent IncorrectStatus error',
      async (): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mockCheckCredentialStatus.mockImplementationOnce(
          (credentialStatus: string, consentId: string): void => {
            throw new IncorrectStatusError(consentId)
          })

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
        expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

        expect(mockVerifySignature).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should throw an error when trying to retrieve consent resource that does not exist',
      async (): Promise<void> => {
        mockRetrieveValidConsent.mockRejectedValueOnce(new NotFoundError('Consent', id))

        await expect(Handler.retrieveUpdateAndPutConsent())
          .rejects
          .toThrow(new NotFoundError('Consent', id))

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
        expect(mockCheckCredentialStatus).not.toHaveBeenCalled()

        expect(mockVerifySignature).not.toHaveBeenCalled()
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should fail to verify the signature',
      async (): Promise<void> => {
        mockVerifySignature.mockReturnValueOnce(false)

        await expect(Handler.retrieveUpdateAndPutConsent()).rejects.toThrow()

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
        expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should fail to update the consent credential attributes and throw an error',
      async (): Promise<void> => {
        const err: NotFoundError = new NotFoundError('Consent', id)
        mockUpdateConsentCredential.mockRejectedValueOnce(err)

        await expect(Handler.retrieveUpdateAndPutConsent())
          .rejects
          .toThrow(err)

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
        expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

        /* Mock the Domain.ConsentCredential Value. */
        const credential: Domain.ConsentCredential = {
          credentialId: requestCredentialId,
          credentialStatus: 'ACTIVE',
          credentialPayload: publicKey
        }
        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, credential)
        expect(mockPutConsents).not.toHaveBeenCalled()
      })

    it('should fail to make the outgoing call to PUT /consents/{ID} and throw an error',
      async (): Promise<void> => {
        const err: Error = new Error('error thrown')
        mockPutConsents.mockRejectedValueOnce(err)

        await expect(Handler.retrieveUpdateAndPutConsent())
          .rejects
          .toThrow(err)

        expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
        expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

        /* Mock the Domain.ConsentCredential Value. */
        const credential: Domain.ConsentCredential = {
          credentialId: requestCredentialId,
          credentialStatus: 'ACTIVE',
          credentialPayload: publicKey
        }
        expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
        expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, credential)
        expect(mockPutConsents).toHaveBeenCalledWith(retrievedConsent, signature, publicKey, request as Request)
      })
  })

  describe('PUT Handler', (): void => {
    const mockRetrieveUpdateAndPutConsent = jest.spyOn(Handler, 'retrieveUpdateAndPutConsent')
    beforeAll((): void => {
      mockRetrieveUpdateAndPutConsent.mockResolvedValue()
    })

    it('should return a 202 success code.', async (): Promise<void> => {
      const response = await Handler.put(request as Request, h)
      expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)

      expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
      expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

      const credential: Domain.ConsentCredential = {
        credentialId: requestCredentialId,
        credentialStatus: 'ACTIVE',
        credentialPayload: publicKey
      }

      expect(mockRetrieveUpdateAndPutConsent).toHaveBeenCalledWith(id, challenge,
        credentialStatus, signature,
        publicKey, requestCredentialId,
        request)
      expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
      expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, credential)
      expect(mockPutConsents).toHaveBeenCalledWith(retrievedConsent, signature, publicKey, request)
    })
  })
})
