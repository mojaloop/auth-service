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
 - Ahan Gupta <ahangupta@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import { Request } from '@hapi/hapi'
import { consentDB, scopeDB } from '~/lib/db'
import {
  retrieveValidConsent,
  updateConsentCredential,
  buildConsentRequestBody
} from '~/domain/consents/{ID}'
import { Consent } from '~/model/consent'
import { thirdPartyRequest } from '~/lib/requests'
import * as Scopes from '~/lib/scopes'
import { PutConsentsRequest } from '@mojaloop/sdk-standard-components'
import {
  IncorrectChallengeError,
  IncorrectConsentStatusError,
  EmptyCredentialPayloadError
} from '~/domain/errors'
import { CredentialStatusEnum, ConsentCredential } from '~/model/consent/consent'
import { UpdateCredentialRequest } from '~/server/handlers/consents/{ID}'
import { Scope } from '~/model/scope'

const mockConsentDbRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockConsentDbUpdate = jest.spyOn(consentDB, 'update')
const mockScopeDbRetrieveAll = jest.spyOn(scopeDB, 'retrieveAll')
const mockPutConsentsOutbound = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockConvertScopesToExternal = jest.spyOn(Scopes, 'convertScopesToExternal')

/*
 * Mock Request Resources
 */
const request: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    ID: '1234'
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
} as unknown as Request

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

const retrievedConsentRevoked: Consent = {
  id: '1234',
  status: 'REVOKED',
  initiatorId: 'pispa',
  participantId: 'sfsfdf23',
  credentialId: '9876',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'string_representing_challenge_payload',
  revokedAt: (new Date()).toISOString()
}

const retrievedConsentWrongChallenge: Consent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pispa',
  participantId: 'sfsfdf23',
  credentialId: '9876',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'wrong_string_representing_challenge_payload',
  revokedAt: (new Date()).toISOString()
}

/* Mock the retrieved scope value. */
const retrievedScopes = [{
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

const {
  credential: {
    challenge: {
      signature,
      payload: challenge
    },
    payload: publicKey,
    id: requestCredentialId
  }
} = request.payload as UpdateCredentialRequest

/* Mock the converted scope value. */
const externalScopes: Scopes.ExternalScope[] = [
  {
    accountId: 'as2342',
    actions: ['account.getAccess', 'account.transferMoney']
  },
  {
    accountId: 'as22',
    actions: ['account.getAccess']
  }
]

/* Mock the ConsentCredential Value. */
const credentialVerified: ConsentCredential = {
  credentialType: 'FIDO',
  credentialId: requestCredentialId,
  credentialStatus: CredentialStatusEnum.VERIFIED,
  credentialPayload: publicKey,
  credentialChallenge: challenge
}

const consentId = retrievedConsent.id

/* Mock the retrieved consent value. */
const updatedConsent: Consent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pispa',
  participantId: 'sfsfdf23',
  credentialId: '9876',
  credentialType: 'FIDO',
  credentialStatus: CredentialStatusEnum.VERIFIED,
  credentialPayload: publicKey,
  credentialChallenge: 'string_representing_challenge_payload'
}

// Mock Outgoing Request Body
const requestBody: PutConsentsRequest = {
  requestId: consentId,
  scopes: externalScopes,
  initiatorId: retrievedConsent.initiatorId as string,
  participantId: retrievedConsent.participantId as string,
  credential: {
    id: requestCredentialId,
    credentialType: 'FIDO',
    status: CredentialStatusEnum.VERIFIED,
    challenge: {
      payload: retrievedConsent.credentialChallenge as string,
      signature
    },
    payload: publicKey
  }
}

describe('server/domain/consents/{ID}', (): void => {
  beforeAll((): void => {
    mockConsentDbRetrieve.mockResolvedValue(retrievedConsent)
    mockScopeDbRetrieveAll.mockResolvedValue(retrievedScopes)
    mockPutConsentsOutbound.mockResolvedValue(undefined)
    mockConvertScopesToExternal.mockReturnValue(externalScopes)
    mockConsentDbUpdate.mockResolvedValue(2)
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  describe('retrieveValidConsent', (): void => {
    it('should retrieve a valid consent without any errors', async (): Promise<void> => {
      const returnedConsent: Consent = await retrieveValidConsent(consentId, challenge)

      expect(returnedConsent).toStrictEqual(retrievedConsent)
      expect(mockConsentDbRetrieve).toBeCalledWith(consentId)
    })

    it('should propagate error in consent retrieval', async (): Promise<void> => {
      mockConsentDbRetrieve.mockRejectedValueOnce(new Error('ConsentDB Error'))
      await expect(retrieveValidConsent(consentId, challenge)).rejects.toThrowError('ConsentDB Error')

      expect(mockConsentDbRetrieve).toBeCalledWith(consentId)
    })

    it('should throw IncorrectStatusError if retrieved consent has REVOKED status',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(retrievedConsentRevoked)
        await expect(retrieveValidConsent(consentId, challenge))
          .rejects
          .toThrow(new IncorrectConsentStatusError(consentId))

        expect(mockConsentDbRetrieve).toBeCalledWith(consentId)
      })

    it('should throw IncorrectChallengeError if mismatch between retrieved consent challenge and request credential challenge',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(retrievedConsentWrongChallenge)
        await expect(retrieveValidConsent(consentId, challenge))
          .rejects
          .toThrow(new IncorrectChallengeError(consentId))

        expect(mockConsentDbRetrieve).toBeCalledWith(consentId)
      })
  })

  describe('updateConsentCredential', (): void => {
    afterEach((): void => {
      // Reset Consent Object
      retrievedConsent.credentialId = '9876'
      retrievedConsent.credentialStatus = 'PENDING'
      retrievedConsent.credentialPayload = 'string_representing_credential_payload'
    })

    it('should update a consent with valid credentials without any errors',
      async (): Promise<void> => {
        const update = await updateConsentCredential(retrievedConsent, credentialVerified)

        expect(mockConsentDbUpdate).toBeCalledWith(updatedConsent)
        expect(update).toBe(2)
      })

    it('should propagate error in consentDB update',
      async (): Promise<void> => {
        mockConsentDbUpdate.mockRejectedValueOnce(new Error('ConsentDB Error'))
        await expect(updateConsentCredential(retrievedConsent, credentialVerified))
          .rejects
          .toThrowError('ConsentDB Error')

        expect(mockConsentDbUpdate).toBeCalledWith(updatedConsent)
      })

    it('should throw error if credential payload null',
      async (): Promise<void> => {
        // Make Credential Payload null
        credentialVerified.credentialPayload = null

        await expect(updateConsentCredential(retrievedConsent, credentialVerified))
          .rejects
          .toThrow(new EmptyCredentialPayloadError(consentId))

        expect(mockConsentDbUpdate).not.toBeCalled()

        // Reset payload
        credentialVerified.credentialPayload = 'string_representing_credential_payload'
      })

    it('should throw error if credential payload empty string',
      async (): Promise<void> => {
        // Make Credential Payload empty string
        credentialVerified.credentialPayload = ''

        await expect(updateConsentCredential(retrievedConsent, credentialVerified))
          .rejects
          .toThrow(new EmptyCredentialPayloadError(consentId))

        expect(mockConsentDbUpdate).not.toBeCalled()

        // Reset payload
        retrievedConsent.credentialPayload = 'string_representing_credential_payload'
      })
  })

  describe('buildConsentRequestBody', (): void => {
    it('should build and return request body successfuly.',
      async (): Promise<void> => {
        const returnedBody = await buildConsentRequestBody(retrievedConsent, signature, publicKey)
        expect(returnedBody).toStrictEqual(requestBody)

        expect(mockScopeDbRetrieveAll).toBeCalledWith(consentId)
        expect(mockConvertScopesToExternal).toBeCalledWith(retrievedScopes)
      })

    it('should promulgate scope retrieval error.',
      async (): Promise<void> => {
        mockScopeDbRetrieveAll.mockRejectedValueOnce(new Error('Test'))
        await expect(buildConsentRequestBody(retrievedConsent, signature, publicKey))
          .rejects
          .toThrowError('Test')

        expect(mockScopeDbRetrieveAll).toBeCalledWith(consentId)
        expect(mockConvertScopesToExternal).not.toBeCalled()
      })

    it('should promulgate scope conversion error.',
      async (): Promise<void> => {
        mockConvertScopesToExternal.mockImplementationOnce(
          (_scopes: Scope[]): Scopes.ExternalScope[] => {
            throw new Error('Test')
          })
        await expect(buildConsentRequestBody(retrievedConsent, signature, publicKey))
          .rejects
          .toThrowError('Test')

        expect(mockScopeDbRetrieveAll).toBeCalledWith(consentId)
        expect(mockConvertScopesToExternal).toBeCalledWith(retrievedScopes)
      })
  })
})
