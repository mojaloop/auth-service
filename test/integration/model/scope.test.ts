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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import Knex from 'knex'
import Config from '../../../config/knexfile'
import ScopeDB, { Scope } from '../../../src/model/scope'
import { Consent } from '../../../src/model/consent'
import { NotFoundError } from '../../../src/model/errors'

/*
 * Mock Consent Resources
 */
const partialConsents: Consent[] = [
  {
    id: '1234',
    initiatorId: 'pisp-2342-2233',
    participantId: 'dfsp-3333-2123'
  },
  {
    id: '948',
    initiatorId: 'pisp-2342-2013',
    participantId: 'dfsp-3333-2773'
  }
]

/*
 * Mock Scope Resources
 */
const tempScopes: Scope[] = [
  {
    consentId: partialConsents[0].id,
    action: 'transfer',
    accountId: 'sjdn-3333-2123'
  },
  {
    consentId: partialConsents[0].id,
    action: 'balance',
    accountId: 'sjdn-q333-2123'
  },
  {
    consentId: partialConsents[0].id,
    action: 'saving',
    accountId: 'sjdn-q333-2123'
  }
]

/*
 * Scope Resource Model Integration Tests
 */
describe('src/model/scope', (): void => {
  let Db: Knex
  let scopeDB: ScopeDB

  beforeAll(async (): Promise<void> => {
    Db = Knex(Config.development as object)
    await Db.migrate.latest()

    scopeDB = new ScopeDB(Db)
  })

  afterAll(async (): Promise<void> => {
    Db.destroy()
  })

  // Reset table for new test
  beforeEach(async (): Promise<void> => {
    await Db<Consent>('Consent').del()
    await Db<Scope>('Scope').del()
    await Db<Consent>('Consent').insert(partialConsents)
  })

  describe('insert', (): void => {
    it('adds scope for an existing consent to the database',
      async (): Promise<void> => {
        const inserted: boolean = await scopeDB.insert(tempScopes[0])

        // Return type check
        expect(inserted).toEqual(true)

        const scopes: Scope[] = await Db<Scope>('Scope')
          .select('*')
          .where({
            consentId: partialConsents[0].id
          })

        expect(scopes.length).toEqual(1)
        expect(scopes[0].id).toEqual(expect.any(Number))
        expect(scopes[0]).toEqual(expect.objectContaining(tempScopes[0]))
      }
    )

    it('adds multiple scopes for an existing consent to the database',
      async (): Promise<void> => {
        const inserted: boolean = await scopeDB.insert(tempScopes)

        // Return type check
        expect(inserted).toEqual(true)

        const scopes: Scope[] = await Db<Scope>('Scope')
          .select('*')
          .where({
            consentId: partialConsents[0].id
          })

        expect(scopes.length).toEqual(3)
        // Ensure scopes belong to the same consent
        expect(scopes[0].consentId === scopes[1].consentId).toEqual(true)
        expect(scopes[1].consentId === scopes[2].consentId).toEqual(true)
        // Ensure scopes are different
        expect(scopes[0].action !== scopes[1].action).toEqual(true)
        expect(scopes[1].action !== scopes[2].action).toEqual(true)
      }
    )

    it('throws an error on adding a scope for non-existent consent',
      async (): Promise<void> => {
        await Db<Consent>('Consent').del()
        await expect(scopeDB.insert(tempScopes[0])).rejects.toThrow()
      }
    )

    it('returns without affecting the DB on inserting empty scopes array',
      async (): Promise<void> => {
        const scopesInitial: Scope[] = await Db<Scope>('Scope').select('*')

        const inserted: boolean = await scopeDB.insert([])

        const scopesAfter: Scope[] = await Db<Scope>('Scope').select('*')

        expect(inserted).toEqual(true)
        // No effect on the DB
        expect(scopesInitial.length === scopesAfter.length)
      }
    )
  })

  describe('retrieveAll', (): void => {
    it('retrieves only existing scopes from the database',
      async (): Promise<void> => {
        await Db<Scope>('Scope').insert(tempScopes)

        const scopes: Scope[] = await scopeDB.retrieveAll(
          tempScopes[0].consentId
        )

        expect(scopes.length).toEqual(3)
        // id is autogenerated in the DB
        expect(scopes[0].id).toEqual(expect.any(Number))
        expect(scopes[1].id).toEqual(expect.any(Number))
        expect(scopes[2].id).toEqual(expect.any(Number))
        // Ensure scopes belong to the same consent
        expect(scopes[0].consentId === scopes[1].consentId).toEqual(true)
        expect(scopes[1].consentId === scopes[2].consentId).toEqual(true)
        // Ensure scopes are different
        expect(scopes[0].action !== scopes[1].action).toEqual(true)
        expect(scopes[1].action !== scopes[2].action).toEqual(true)
      }
    )

    it('throws an error on retrieving non-existent scopes for existing consent',
      async (): Promise<void> => {
        await expect(scopeDB.retrieveAll(partialConsents[0].id))
          .rejects.toThrowError(NotFoundError)
      }
    )

    it('throws an error on retrieving non-existent scopes for non-existent consent',
      async (): Promise<void> => {
        await Db<Consent>('Consent').del()
        await expect(scopeDB.retrieveAll(partialConsents[0].id))
          .rejects.toThrowError(NotFoundError)
      }
    )
  })
})
