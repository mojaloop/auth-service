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
import { Request } from '@hapi/hapi'
import { consentDB, scopeDB } from '~/lib/db'
import Logger from '@mojaloop/central-services-logger'
import { retrieveValidConsent, checkCredentialStatus, putConsents } from '~/domain/consents/{ID}'
import { Consent } from '~/model/consent'
import { thirdPartyRequest } from '~/lib/requests'
import * as Scopes from '~/lib/scopes'
import { PutConsentsRequest } from '@mojaloop/sdk-standard-components'
import { Enum } from '@mojaloop/central-services-shared'
import { IncorrectChallengeError, IncorrectStatusError } from '~/domain/errors'

const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const mockConsentDbRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockScopeDbRetrieveAll = jest.spyOn(scopeDB, 'retrieveAll')
const mockPutConsentsOutbound = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockConvertScopesToExternal = jest.spyOn(Scopes, 'convertScopesToExternal')

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
  status: 'REVOKED',
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

/* TODO, fill out later. */
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

describe('server/domain/consents/{ID}', (): void => {
  let id: string, signature: string, publicKey: string, challenge: string, credentialStatus: string

  beforeAll((): void => {
    mockLoggerError.mockReturnValue(null)
    mockLoggerPush.mockReturnValue(null)

    mockConsentDbRetrieve.mockResolvedValue(retrievedConsent)
    mockScopeDbRetrieveAll.mockResolvedValue(retrievedScopes)
    mockPutConsentsOutbound.mockResolvedValue(undefined)
    mockConvertScopesToExternal.mockReturnValue(externalScopes)

    /* Setting the attributes according to the incoming request */
    // @ts-ignore
    const requestPayloadCredential = request.payload.credential
    id = request.params.id
    signature = requestPayloadCredential.challenge.signature
    publicKey = requestPayloadCredential.payload
    challenge = requestPayloadCredential.challenge.payload
    credentialStatus = requestPayloadCredential.status

    // @ts-ignore
    request[Enum.Http.Headers.FSPIOP.SOURCE] = 'pisp-2342-2233'
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  describe('retrieveValidConsent', (): void => {
    it('should retrieve a valid consent without any errors', async (): Promise<void> => {
      const returnedConsent: Consent = await retrieveValidConsent(id, challenge)

      expect(returnedConsent).toStrictEqual(retrievedConsent)
      expect(mockConsentDbRetrieve).toBeCalledWith(id)
    })

    it('should propagate error in consent retrieval', async (): Promise<void> => {
      mockConsentDbRetrieve.mockRejectedValueOnce(new Error('ConsentDB Error'))
      await expect(retrieveValidConsent(id, challenge)).rejects.toThrowError('ConsentDB Error')

      expect(mockConsentDbRetrieve).toBeCalledWith(id)
    })

    it('should throw IncorrectStatusError if retrieved consent has REVOKED status',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(retrievedConsentRevoked)
        await expect(retrieveValidConsent(id, challenge)).rejects.toThrow(new IncorrectStatusError(id))

        expect(mockConsentDbRetrieve).toBeCalledWith(id)
      })

    it('should throw IncorrectChallengeError if mismatch between retrieved consent challenge and request credential challenge',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(retrievedConsentWrongChallenge)
        await expect(retrieveValidConsent(id, challenge)).rejects.toThrow(new IncorrectChallengeError(id))

        expect(mockConsentDbRetrieve).toBeCalledWith(id)
      })
  })

  describe('checkCredentialStatus', (): void => {

  })

  describe('updateConsentCredential', (): void => {

  })

  describe('buildConsentRequestBody', (): void => {

  })

  describe('putConsents', (): void => {

  })

  it('should validate the credential status without any errors', async (): Promise<void> => {
    const returnedCheckedStatus = checkCredentialStatus(credentialStatus, id)
    expect(returnedCheckedStatus).toBe(undefined)
  })

  it('should make the outbound call to PUT /consents/{ID} successfuly.', async (): Promise<void> => {
    const returnedValue = await putConsents(retrievedConsent, signature, publicKey, request)
    expect(returnedValue).toBe(undefined)

    expect(mockScopeDbRetrieveAll).toBeCalledWith(id)
    expect(mockConvertScopesToExternal).toBeCalledWith(retrievedScopes)

    /* Mock the outgoing consentBody */
    const consentBody: PutConsentsRequest = {
      requestId: retrievedConsent.id,
      initiatorId: retrievedConsent.initiatorId as string,
      participantId: retrievedConsent.participantId as string,
      scopes: externalScopes,
      credential: {
        id: retrievedConsent.credentialId as string,
        credentialType: 'FIDO',
        status: 'ACTIVE',
        challenge: {
          payload: retrievedConsent.credentialChallenge as string,
          signature: signature as string
        },
        payload: publicKey as string
      }
    }
    /* Mock the outgoing destination participant id */
    const destParticipantId = request.headers['fspiop-source']
    expect(mockPutConsentsOutbound).toBeCalledWith(id, consentBody, destParticipantId)
  })

  /* We define all the negative test cases. */
  it('should throw an Incorrect Challenge error when credentialChallenge != requestChallenge', async (): Promise<void> => {
    const err: IncorrectChallengeError = new IncorrectChallengeError(id)

    expect(async (): Promise<Consent> => {
      return await retrieveValidConsent(id, 'different_challenge_string')
    }).rejects.toThrow(err)

    expect(mockConsentDbRetrieve).toBeCalledWith(id)
  })

  it('should throw an Incorrect Status error when credentialStatus != PENDING', async (): Promise<void> => {
    const err: IncorrectStatusError = new IncorrectStatusError(id)

    expect(async (): Promise<void> => {
      return checkCredentialStatus('ACTIVE', id)
    }).rejects.toThrow(err)
  })
})
