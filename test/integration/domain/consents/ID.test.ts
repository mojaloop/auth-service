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
} from '~/domain/consents/ID'
import { Consent } from '~/model/consent'
import Knex from 'knex'
import { closeKnexConnection } from '~/model/db'
import Config from '~/shared/config'
import {
  NotFoundError,
} from '~/model/errors'
import {
  ChallengeMismatchError,
  IncorrectConsentStatusError
} from '~/domain/errors'
import { consents } from '~/../seeds/01_consent'

describe('server/domain/consents/{ID}', (): void => {
  afterAll(async (): Promise<void> => {
    await closeKnexConnection()
  })

  describe('retrieveValidConsent', (): void => {
    let db: Knex<unknown[]>
    beforeAll(async (): Promise<void> => {
      // Seed the database before we can test for retrieval functions
      db = Knex(Config.DATABASE)
      await db.seed.run()
    })

    afterAll(async (): Promise<void> => {
      await db.destroy()
    })

    it('should retrieve a valid consent without any errors', async (): Promise<void> => {
      const consentChallenge = consents[0].credentialChallenge! // Non-null guaranteed by contents of seed file
      const returnedConsent: Consent = await retrieveValidConsent(consents[0].id, consentChallenge)
      expect(returnedConsent.id).toStrictEqual(consents[0].id)
    })

    it('should propagate error in consent retrieval from DB', async (): Promise<void> => {
      await expect(retrieveValidConsent('1', 'challenge_str'))
        .rejects
        .toThrowError(new NotFoundError('Consent', '1'))
    })

    it('should throw IncorrectStatusError if retrieved consent has REVOKED status',
      async (): Promise<void> => {
        await expect(retrieveValidConsent(consents[1].id, 'string_representing_challenge_b'))
          .rejects
          .toThrow(new IncorrectConsentStatusError(consents[1].id))
      })

    it('should throw ChallengeMismatchError if mismatch between retrieved consent challenge and request credential challenge',
      async (): Promise<void> => {
        await expect(retrieveValidConsent(consents[0].id, 'blah'))
          .rejects
          .toThrow(new ChallengeMismatchError(consents[0].id))
      })
  })
})
