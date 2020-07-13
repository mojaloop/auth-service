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

/*
 * Mock Consent Resource
 */
const partialConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123'
}

/*
 * Mock Scope Resources
 */
const tempScope: Scope = {
  consentId: '1234',
  action: 'transfer',
  accountId: 'sjdn-3333-2123'
}

const tempScope2: Scope = {
  consentId: '1234',
  action: 'balance',
  accountId: 'sjdn-q333-2123'
}

/*
 * Scope Resource Model Unit Tests
 */
describe('src/model/scope', (): void => {
  let Db: Knex
  let scopeDB: ScopeDB

  beforeAll(async (): Promise<void> => {
    Db = Knex(Config.test)
    await Db.migrate.latest()
    // Enable Sqlite foreign key support
    await Db.raw('PRAGMA foreign_keys = ON')

    scopeDB = new ScopeDB(Db)
  })

  afterAll(async (): Promise<void> => {
    Db.destroy()
  })

  // Reset table for new test
  beforeEach(async (): Promise<void> => {
    await Db<Consent>('Consent').del()
    await Db<Scope>('Scope').del()
  })

  describe('register', (): void => {
    it('adds scope for an existing consent to the database', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(partialConsent)

      await scopeDB.register(tempScope)

      // Assertion
      const scopes: Scope[] = await Db<Scope>('Scope')
        .select('*')
        .where({
          consentId: partialConsent.id
        })

      expect(scopes[0].id).toEqual(expect.any(Number))

      expect(scopes[0]).toEqual(expect.objectContaining(tempScope))
    })

    it('adds multiple scopes for an existing consent to the database', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(partialConsent)

      await scopeDB.register([tempScope, tempScope2])

      // Assertion
      const scopes: Scope[] = await Db<Scope>('Scope')
        .select('*')
        .where({
          consentId: partialConsent.id
        })

      expect(scopes.length).toEqual(2)
      expect(scopes[0].consentId === scopes[1].consentId).toEqual(true)
      expect(scopes[0].action !== scopes[1].action).toEqual(true)
    })

    it('returns an error on adding a scope for a non-existent consent', async (): Promise<void> => {
      await expect(scopeDB.register(tempScope)).rejects.toThrowError()
    })
  })

  describe('retrieveAll', (): void => {
    it('retrieves only existing scopes from the database', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(partialConsent)
      await Db<Scope>('Scope')
        .insert(tempScope)

      // Action
      const scopes: Scope[] = await scopeDB.retrieveAll(tempScope.consentId)

      // Assertion
      expect(scopes[0].id).toEqual(expect.any(Number))

      expect(scopes[0]).toEqual(expect.objectContaining(tempScope))
    })

    it('throws an error on retrieving of non-existent scopes', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(partialConsent)

      // Action
      await expect(scopeDB.retrieveAll(partialConsent.id))
        .rejects.toThrowError('NotFoundError: Scope for ConsentId 1234')
    })
  })

  describe('deleteAll', (): void => {
    it('deletes only existing scopes from the database', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(partialConsent)
      await Db<Scope>('Scope')
        .insert(tempScope)
      await Db<Scope>('Scope')
        .insert(tempScope2)

      let scopes: Scope[] = await Db<Scope>('Scope')
        .select('*')
        .where({
          consentId: tempScope.consentId
        })

      expect(scopes.length).toEqual(2)

      // Action
      await scopeDB.deleteAll(tempScope.consentId)

      // Assertion
      scopes = await Db<Scope>('Scope')
        .select('*')
        .where({
          consentId: tempScope.consentId
        })

      expect(scopes.length).toEqual(0)
    })

    it('throws an error on deleting non-existent scopes', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(partialConsent)

      // Action
      await expect(scopeDB.deleteAll(partialConsent.id))
        .rejects.toThrowError('NotFoundError: Scope for ConsentId 1234')
    })
  })
})
