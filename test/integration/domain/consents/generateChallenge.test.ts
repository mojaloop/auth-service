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
import { updateConsentCredential } from '~/domain/consents/generateChallenge'
import Knex from 'knex'
import Config from '~/shared/config'
import { Consent, ConsentCredential } from '~/model/consent'
import { CredentialStatusEnum } from '~/model/consent/consent'
import { NotFoundError } from '~/model/errors'
import { consents } from '~/../seeds/01_consent'
import { closeKnexConnection } from '~/lib/db'

describe('Tests for src/domain/consents/{ID}/generateChallenge', (): void => {
  afterAll(async (): Promise<void> => {
    await closeKnexConnection()
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

    it('should update credential without error', async (): Promise<void> => {
      const consentMissingCred: Consent = {
        id: consents[0].id,
        initiatorId: consents[0].initiatorId,
        participantId: consents[0].participantId,
        status: consents[0].status,
        credentialId: consents[0].credentialId!!,
        credentialType: consents[0].credentialType!!,
        credentialStatus: consents[0].credentialStatus!!,
        credentialChallenge: consents[0].credentialChallenge!!,
      }

      const credentialUpdate: ConsentCredential = {
        credentialType: 'FIDO',
        credentialStatus: CredentialStatusEnum.PENDING,
        credentialChallenge: 'string_representing_credential_challenge',
        credentialPayload: null
      }

      const updatedConsent: Consent = await updateConsentCredential(consentMissingCred, credentialUpdate)

      const expectedConsent: Consent = Object.assign({}, consentMissingCred)
      expectedConsent.credentialType = credentialUpdate.credentialType
      expectedConsent.credentialStatus = credentialUpdate.credentialStatus
      expectedConsent.credentialChallenge = credentialUpdate.credentialChallenge
      delete expectedConsent.credentialPayload

      expect(updatedConsent).toStrictEqual(expectedConsent)
    })

    it('should propagate consent retrieval error', async (): Promise<void> => {
      const nonexistentConsentId = '200'
      const toBeUpdated: Consent = {
        id: nonexistentConsentId,
        initiatorId: consents[0].initiatorId,
        participantId: consents[0].participantId,
        status: consents[0].status,
        credentialId: consents[0].credentialId!!,
        credentialType: consents[0].credentialType!!,
        credentialStatus: consents[0].credentialStatus!!,
        credentialChallenge: consents[0].credentialChallenge!!,
      }

      const credentialUpdate: ConsentCredential = {
        credentialType: 'FIDO',
        credentialStatus: CredentialStatusEnum.PENDING,
        credentialChallenge: 'string_representing_credential_challenge',
        credentialPayload: null
      }

      await expect(updateConsentCredential(toBeUpdated, credentialUpdate))
        .rejects
        .toThrow(new NotFoundError('Consent', nonexistentConsentId))
    })
  })
})
