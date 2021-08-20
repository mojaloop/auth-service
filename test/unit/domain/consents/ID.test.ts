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
import { consentDB, scopeDB } from '~/model/db'
import {
  retrieveValidConsent,
} from '~/domain/consents/ID'
import { Consent } from '~/model/consent'
import { thirdPartyRequest } from '~/domain/requests'
import * as Scopes from '~/domain/scopes'
import {
  ChallengeMismatchError,
  IncorrectConsentStatusError
} from '~/domain/errors'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import moment from 'moment'

const mockConsentDbRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockScopeDbRetrieveAll = jest.spyOn(scopeDB, 'retrieveAll')
const mockPutConsentsOutbound = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockconvertModelScopesToThirdpartyScopes = jest.spyOn(Scopes, 'convertModelScopesToThirdpartyScopes')

/* Mock the retrieved consent value. */
const retrievedConsent: Consent = {
  id: '1234',
  status: 'VERIFIED',
  participantId: 'sfsfdf23',
  credentialType: 'FIDO',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'string_representing_challenge_payload',
  credentialCounter: 4,
  originalCredential: JSON.stringify({ status:'PENDING', payload:{}, credentialType:'test'})
}

const retrievedConsentRevoked: Consent = {
  id: '1234',
  status: 'REVOKED',
  participantId: 'sfsfdf23',
  credentialType: 'FIDO',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'string_representing_challenge_payload',
  revokedAt: moment('2011-10-05T14:48:00.000Z').format('YYYY-MM-DD HH:mm:ss'),
  credentialCounter: 4,
  originalCredential: JSON.stringify({ status:'PENDING', payload:{}, credentialType:'test'})
}

const retrievedConsentWrongChallenge: Consent = {
  id: '1234',
  status: 'VERIFIED',
  participantId: 'sfsfdf23',
  credentialType: 'FIDO',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'wrong_string_representing_challenge_payload',
  revokedAt: moment('2011-10-05T14:48:00.000Z').format('YYYY-MM-DD HH:mm:ss'),
  credentialCounter: 4,
  originalCredential: JSON.stringify({ status:'PENDING', payload:{}, credentialType:'test'})
}

/* Mock the retrieved scope value. */
const retrievedScopes = [{
  id: 123234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'accounts.getBalance'
},
{
  id: 232234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'accounts.transfer'
},
{
  id: 234,
  consentId: '1234',
  accountId: 'as22',
  action: 'accounts.getBalance'
}
]


/* Mock the converted scope value. */
const externalScopes: tpAPI.Schemas.Scope[] = [
  {
    accountId: 'as2342',
    actions: ['accounts.getBalance', 'accounts.transfer']
  },
  {
    accountId: 'as22',
    actions: ['accounts.getBalance']
  }
]


const consentId = retrievedConsent.id
const challenge = 'string_representing_challenge_payload'

describe('server/domain/consents/{ID}', (): void => {
  beforeAll((): void => {
    mockConsentDbRetrieve.mockResolvedValue(retrievedConsent)
    mockScopeDbRetrieveAll.mockResolvedValue(retrievedScopes)
    mockPutConsentsOutbound.mockResolvedValue(undefined)
    mockconvertModelScopesToThirdpartyScopes.mockReturnValue(externalScopes)
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

    it('should throw ChallengeMismatchError if mismatch between retrieved consent challenge and request credential challenge',
      async (): Promise<void> => {
        mockConsentDbRetrieve.mockResolvedValueOnce(retrievedConsentWrongChallenge)
        await expect(retrieveValidConsent(consentId, challenge))
          .rejects
          .toThrow(new ChallengeMismatchError(consentId))

        expect(mockConsentDbRetrieve).toBeCalledWith(consentId)
      })
  })
})
