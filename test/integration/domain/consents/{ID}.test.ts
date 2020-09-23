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

 - Kenneth Zeng <kkzeng@google.com>

 --------------
 ******/
import {
  retrieveValidConsent,
  updateConsentCredential,
  buildConsentRequestBody
} from '~/domain/consents/{ID}'
import { Consent, ConsentCredential } from '~/model/consent'
import { CredentialStatusEnum } from '~/model/consent/consent'
import Knex from 'knex'
import Config from '~/shared/config'
import * as Scopes from '~/lib/scopes'
import { NotFoundError } from '~/model/errors'
import {
  IncorrectChallengeError,
  IncorrectConsentStatusError
} from '~/domain/errors'
import SDKStandardComponents from '@mojaloop/sdk-standard-components'
import { consents } from '~/../seeds/01_consent'

describe('server/domain/consents/{ID}', (): void => {
  describe('retrieveValidConsent', (): void => {
    let db: Knex<unknown[]>
    beforeAll(async (): Promise<void> => {
      // Seed the database before we can test for retrieval functions
      db = Knex(Config.DATABASE as object);
      await db.seed.run()
    })

    afterAll(async (): Promise<void> => {
      await db.destroy()
    })

    it('should retrieve a valid consent without any errors', async (): Promise<void> => {
      const consentChallenge = consents[2].credentialChallenge!! // Non-null guaranteed by contents of seed file
      const returnedConsent: Consent = await retrieveValidConsent(consents[2].id, consentChallenge)
      expect(returnedConsent.id).toStrictEqual(consents[2].id)
    })

    it('should propagate error in consent retrieval from DB', async (): Promise<void> => {
      await expect(retrieveValidConsent('1', 'challenge_str'))
        .rejects
        .toThrowError(new NotFoundError('Consent', '1'))
    })

    it('should throw IncorrectStatusError if retrieved consent has REVOKED status',
      async (): Promise<void> => {
        await expect(retrieveValidConsent(consents[3].id, 'string_representing_challenge_b'))
          .rejects
          .toThrow(new IncorrectConsentStatusError(consents[3].id))
      })

    it('should throw IncorrectChallengeError if mismatch between retrieved consent challenge and request credential challenge',
      async (): Promise<void> => {
        await expect(retrieveValidConsent(consents[2].id, 'blah'))
          .rejects
          .toThrow(new IncorrectChallengeError(consents[2].id))
      })
  })

  describe('updateConsentCredential', (): void => {
    let db: Knex<unknown[]>

    beforeAll(async (): Promise<void> => {
      // Seed the database before we can test for retrieval functions
      db = Knex(Config.DATABASE as object);
      await db.seed.run()
    })

    afterAll(async (): Promise<void> => {
      await db.destroy()
    })

    it('should update a consent with valid credentials without any errors',
      async (): Promise<void> => {
        const consentWithPendingCred = consents[1];
        const toBeUpdated: Consent = {
          id: consentWithPendingCred.id,
          initiatorId: consentWithPendingCred.initiatorId,
          participantId: consentWithPendingCred.participantId,
          status: consentWithPendingCred.status,
          credentialId: consentWithPendingCred.credentialId!!,
          credentialType: consentWithPendingCred.credentialType!!,
          credentialStatus: consentWithPendingCred.credentialStatus!!,
          credentialChallenge: consentWithPendingCred.credentialChallenge!!,
        }

        const credentialVerified: ConsentCredential = {
          credentialType: 'FIDO',
          credentialId: consentWithPendingCred.credentialId!!,
          credentialStatus: CredentialStatusEnum.VERIFIED,
          credentialPayload: 'string_representing_credential_payload',
          credentialChallenge: consentWithPendingCred.credentialChallenge!!
        }

        const numUpdatedRows = await updateConsentCredential(toBeUpdated, credentialVerified)
        expect(numUpdatedRows).toStrictEqual(1)
      })

    it('should propagate NotFoundError in consentDB update',
      async (): Promise<void> => {
        const nonexistentId = '200'
        const consentWithPendingCred = consents[1];
        const toBeUpdated: Consent = {
          id: nonexistentId,
          initiatorId: consentWithPendingCred.initiatorId,
          participantId: consentWithPendingCred.participantId,
          status: consentWithPendingCred.status,
          credentialId: consentWithPendingCred.credentialId!!,
          credentialType: consentWithPendingCred.credentialType!!,
          credentialStatus: consentWithPendingCred.credentialStatus!!,
          credentialChallenge: consentWithPendingCred.credentialChallenge!!,
        }

        // This credential doesn't matter since we're expecting an error
        const credentialVerified: ConsentCredential = {
          credentialType: 'FIDO',
          credentialId: consentWithPendingCred.credentialId!!,
          credentialStatus: CredentialStatusEnum.VERIFIED,
          credentialPayload: 'string_representing_credential_payload',
          credentialChallenge: consentWithPendingCred.credentialChallenge!!
        }

        await expect(updateConsentCredential(toBeUpdated, credentialVerified))
          .rejects
          .toThrowError(new NotFoundError('Consent', nonexistentId))
      })

    it('should propagate revoked consent error in consentDB update',
      async (): Promise<void> => {
        const revokedConsent = consents[3];
        const toBeUpdated: Consent = {
          id: revokedConsent.id,
          initiatorId: revokedConsent.initiatorId,
          participantId: revokedConsent.participantId,
          status: revokedConsent.status,
          credentialId: revokedConsent.credentialId!!,
          credentialType: revokedConsent.credentialType!!,
          credentialStatus: revokedConsent.credentialStatus!!,
          credentialChallenge: revokedConsent.credentialChallenge!!,
        }

        // This credential doesn't matter since we're expecting an error
        const credentialVerified: ConsentCredential = {
          credentialType: 'FIDO',
          credentialId: revokedConsent.credentialId!!,
          credentialStatus: CredentialStatusEnum.VERIFIED,
          credentialPayload: 'string_representing_credential_payload',
          credentialChallenge: revokedConsent.credentialChallenge!!
        }

        await expect(updateConsentCredential(toBeUpdated, credentialVerified))
          .rejects
          .toThrowError('Cannot modify Revoked Consent')
      })
  })

  describe('buildConsentRequestBody', (): void => {
    it('should build and return request body successfuly.',
      async (): Promise<void> => {
        const consent: Consent = {
          id: consents[1].id,
          initiatorId: consents[1].initiatorId,
          participantId: consents[1].participantId,
          status: consents[1].status,
          credentialId: consents[1].credentialId!!,
          credentialType: consents[1].credentialType!!,
          credentialStatus: consents[1].credentialStatus!!,
          credentialChallenge: consents[1].credentialChallenge!!,
        }

        const mockConvertScopesToExternal = jest.spyOn(Scopes, 'convertScopesToExternal')
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
        mockConvertScopesToExternal.mockReturnValueOnce(externalScopes)

        const signature = 'string_representing_signature'
        const publicKey = 'string_representing_publicKey'

        // Outgoing consent request body used for validation
        const requestBody: SDKStandardComponents.PutConsentsRequest = {
          requestId: consent.id,
          scopes: externalScopes,
          initiatorId: consent.initiatorId as string,
          participantId: consent.participantId as string,
          credential: {
            id: consents[1].credentialId,
            credentialType: 'FIDO',
            status: CredentialStatusEnum.VERIFIED,
            challenge: {
              payload: consent.credentialChallenge as string,
              signature: signature
            },
            payload: publicKey
          }
        }

        const req = await buildConsentRequestBody(consent, signature, publicKey);
        expect(req).toStrictEqual(requestBody)
      })

    it('should propagate scope retrieval error.',
      async (): Promise<void> => {
        const nonexistentConsentId = '200';
        const consent: Consent = {
          id: nonexistentConsentId,
          initiatorId: consents[2].initiatorId,
          participantId: consents[2].participantId,
          status: consents[2].status,
          credentialId: consents[2].credentialId!!,
          credentialType: consents[2].credentialType!!,
          credentialStatus: consents[2].credentialStatus!!,
          credentialChallenge: consents[2].credentialChallenge!!,
        }
        await expect(buildConsentRequestBody(consent, 'string_representing_signature', 'string_representing_publicKey'))
          .rejects
          .toThrowError(new NotFoundError('Consent Scopes', nonexistentConsentId))
      })
  })
})
