/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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

 - Ahan Gupta <ahangupta.96@gmail.com>

 --------------
 ******/
import { Request } from '@hapi/hapi'
import { consentDB, scopeDB } from '../../../../../src/lib/db'
import Logger from '@mojaloop/central-services-logger'
import { retrieveValidConsent, checkCredentialStatus, putConsents } from '../../../../../src/domain/consents/{ID}'
import { Consent } from '../../../../../src/model/consent'
import { thirdPartyRequest } from '../../../../../src/lib/requests'
import * as Scopes from '../../../../../src/lib/scopes'
import { PutConsentsRequest } from '@mojaloop/sdk-standard-components'
import { Enum } from '@mojaloop/central-services-shared'
import { IncorrectChallengeError, IncorrectStatusError } from '../../../../../src/domain/errors'

const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const mockConsentDbRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockScopeDbRetrieveAll = jest.spyOn(scopeDB, 'retrieveAll')
const mockPutConsentsOutbound = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockConvertScopesToExternal = jest.spyOn(Scopes, 'convertScopesToExternal')
const mockEnum = jest.spyOn(Enum, 'Http')

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
  initiatorId: 'pispa',
  participantId: 'sfsfdf23',
  credentialId: '9876',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'string_representing_challenge_payload'
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
  let id
  /* The incoming signature from the PISP. */
  let signature
  /* The incoming public key from the PISP. */
  let publicKey
  /* The incoming challenge from the PISP. */
  let challenge
  /* The incoming credential id from the PISP. */
  let requestCredentialId
  /* The incoming credential status from the PISP. */
  let credentialStatus

  beforeAll((): void => {
    mockLoggerError.mockReturnValue(null)
    mockLoggerPush.mockReturnValue(null)

    mockConsentDbRetrieve.mockResolvedValue(retrievedConsent)
    mockScopeDbRetrieveAll.mockResolvedValue(retrievedScopes)
    mockPutConsentsOutbound.mockReturnValue(undefined)
    mockConvertScopesToExternal.mockReturnValue(externalScopes)
    mockEnum.mockReturnValue({ Headers: { FSPIOP: { Source: 'pisp-2342-2233' } } })

    /* Setting the attributes according to incoming request attributes. */
    id = request.params.id
    // @ts-ignore
    signature = request.payload.credential.challenge.signature
    // @ts-ignore
    publicKey = request.payload.credential.payload
    // @ts-ignore
    challenge = request.payload.credential.challenge.payload
    // @ts-ignore
    requestCredentialId = request.payload.credential.id
    // @ts-ignore
    credentialStatus = request.payload.credential.status
  })

  beforeEach((): void => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  /* We define all the postive test cases */
  it('should retrive a valid consent without any errors', async (): Promise<void> => {
    expect(async (): Promise<Consent> => {
      return await retrieveValidConsent(id, challenge)
    }).toBe(retrievedConsent)

    expect(mockConsentDbRetrieve).toBeCalledWith(id)
  })

  it('should validate the credential status without any errors', async (): Promise<void> => {
    expect(async (): Promise<void> => {
      return await checkCredentialStatus(credentialStatus, id)
    }).toBe(undefined)
  })

  it('should make the outbound call to PUT /consents/{ID} successfuly.', async (): Promise<void> => {
    expect(async (): Promise<void> => {
      return await putConsents(retrievedConsent, signature, publicKey, request as Request)
    }).toBe(undefined)

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
        credentialType: retrievedConsent.credentialType as 'FIDO',
        status: retrievedConsent.credentialStatus as 'ACTIVE',
        challenge: {
          payload: retrievedConsent.credentialChallenge as string,
          signature: signature as string
        },
        payload: publicKey as string
      }
    }
    /* Mock the outgoing destination participant id */
    const destParticipantId = request.headers.fspiopsource
    expect(mockPutConsentsOutbound).toBeCalledWith(id, consentBody, destParticipantId)
  })

  /* We define all the negative test cases. */
  it('should throw an Incorrect Challenge error when credentialChallenge != requestChallenge', async (): Promise<void> => {
    const err: IncorrectChallengeError = new IncorrectChallengeError(id)

    expect(async (): Promise<Consent> => {
      return await retrieveValidConsent(id, 'different_challenge_string')
    }).toThrow(err)

    expect(mockConsentDbRetrieve).toBeCalledWith(id)
  })

  it('should throw an Incorrect Status error when credentialStatus != PENDING', async (): Promise<void> => {
    const err: IncorrectStatusError = new IncorrectStatusError(id)

    expect(async (): Promise<void> => {
      return await checkCredentialStatus('ACTIVE', id)
    }).toThrow(err)
  })
})
