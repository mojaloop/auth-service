/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop
 files are distributed onan 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 ANY KIND, either express or implied. See the License for the specific language
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
import Knex from 'knex'
import { consents } from '~/../seeds/01_consent'
import Config from '~/shared/config'
import { NotFoundError } from '~/model/errors'
import { revokeConsentStatus } from '~/domain/consents/revoke'
import { Consent } from '~/model/consent'
import { closeKnexConnection } from '~/lib/db'

describe('server/domain/consents/revoke', (): void => {
  afterAll(async (): Promise<void> => {
    closeKnexConnection()
  })
  
  describe('revokeConsentStatus', (): void => {
    let db: Knex<unknown[]>
    beforeAll(async (): Promise<void> => {
      // Seed the database before we can test for retrieval functions
      db = Knex(Config.DATABASE as object);
      await db.seed.run()
    })

    afterAll(async (): Promise<void> => {
      await db.destroy()
    })
    it('Should return a revoked consent if given active partial consent',
      async (): Promise<void> => {
        const toBeRevoked: Consent = {
          id: consents[0].id,
          initiatorId: consents[0].initiatorId,
          participantId: consents[0].participantId,
          status: consents[0].status,
          credentialId: consents[0].credentialId!!,
          credentialType: consents[0].credentialType!!,
          credentialStatus: consents[0].credentialStatus!!,
          credentialChallenge: consents[0].credentialChallenge!!,
        }
        const revokedConsent = await revokeConsentStatus(toBeRevoked)
        expect(revokedConsent.status).toBe('REVOKED')
        expect(revokedConsent.revokedAt).toBeDefined()
      })

    it('Should return a revoked consent if given complete (with credentials) consent',
      async (): Promise<void> => {
        const toBeRevoked: Consent = {
          id: consents[2].id,
          initiatorId: consents[2].initiatorId,
          participantId: consents[2].participantId,
          status: consents[2].status,
          credentialId: consents[2].credentialId!!,
          credentialType: consents[2].credentialType!!,
          credentialStatus: consents[2].credentialStatus!!,
          credentialChallenge: consents[2].credentialChallenge!!,
        }
        const revokedConsent = await revokeConsentStatus(toBeRevoked)
        expect(revokedConsent.status).toBe('REVOKED')
        expect(revokedConsent.revokedAt).toBeDefined()
      })

    it('Should propagate error in updating consent',
      async (): Promise<void> => {
        const nonexistentConsentId = '200'
        const nonexistentConsent: Consent = {
          id: nonexistentConsentId,
          initiatorId: consents[2].initiatorId,
          participantId: consents[2].participantId,
          status: consents[2].status,
          credentialId: consents[2].credentialId!!,
          credentialType: consents[2].credentialType!!,
          credentialStatus: consents[2].credentialStatus!!,
          credentialChallenge: consents[2].credentialChallenge!!,
        }

        await expect(revokeConsentStatus(nonexistentConsent))
          .rejects
          .toThrowError(new NotFoundError('Consent', nonexistentConsentId))
      })
  })
})
