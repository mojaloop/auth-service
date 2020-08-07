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

/*
 * Tests for MySQL Timestamp field return type to Date object and
 * its value (including time zone) need to be implemented.
 * SQLite doesn't support native timestamp or typecasting and
 * returns ISO strings for timestamp field.
 * Thus, testing environment (SQLite) differs from Production environment.
 */

import Knex from 'knex'
import Config from '../../config/knexfile'
import ConsentDB, { Consent } from '~/model/consent'
import { NotFoundError } from '~/model/errors'

/*
 * Mock Consent Resources
 */
const partialConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123'
}

const completeConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w'
}

const consentWithOnlyUpdateFields: Consent = {
  id: '1234',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w'
}

const conflictingConsent: Consent = {
  id: '1234',
  // Conflicting initiatorId and participantId
  // between completeConsent and this Consent
  initiatorId: 'pisp-0000-1133',
  participantId: 'dfs-1233-5623',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'ACTIVE',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w'
}

/*
 * Consent Resource Model Unit Tests
 */
describe('src/model/consent', (): void => {
  let Db: Knex
  let consentDB: ConsentDB

  beforeAll(async (): Promise<void> => {
    Db = Knex(Config.test)
    await Db.migrate.latest()
    await Db.raw('PRAGMA foreign_keys = ON')

    consentDB = new ConsentDB(Db)
  })

  afterAll(async (): Promise<void> => {
    Db.destroy()
  })

  // Reset table for new test
  beforeEach(async (): Promise<void> => {
    await Db<Consent>('Consent').del()
  })

  describe('insert', (): void => {
    it('adds consent with partial info to the database', async (): Promise<void> => {
      // Action
      const inserted: boolean = await consentDB.insert(partialConsent)

      expect(inserted).toEqual(true)

      // Assertion
      const consents: Consent[] = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: partialConsent.id
        })

      expect(consents[0]).toEqual({
        id: '1234',
        initiatorId: 'pisp-2342-2233',
        participantId: 'dfsp-3333-2123',
        createdAt: expect.any(String),
        credentialId: null,
        credentialType: null,
        credentialStatus: null,
        credentialPayload: null,
        credentialChallenge: null
      })
    })

    it('throws an error on adding a consent with existing consentId', async (): Promise<void> => {
      // Action
      const inserted: boolean = await consentDB.insert(partialConsent)

      expect(inserted).toEqual(true)

      // Assertion
      const consents: Consent[] = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: partialConsent.id
        })

      // Consent has been added
      expect(consents[0]).toEqual({
        id: '1234',
        initiatorId: 'pisp-2342-2233',
        participantId: 'dfsp-3333-2123',
        createdAt: expect.any(String),
        credentialId: null,
        credentialType: null,
        credentialStatus: null,
        credentialPayload: null,
        credentialChallenge: null
      })

      // Fail primary key constraint
      await expect(consentDB.insert(partialConsent))
        .rejects.toThrow()
    })

    it('throws an error on adding consent without an id', async (): Promise<void> => {
      // Action
      await expect(consentDB.insert({
        id: null as unknown as string,
        initiatorId: '494949',
        participantId: '3030303'
      })).rejects.toThrow()
    })
  })

  describe('update', (): void => {
    it('updates existing consent from a consent having only required fields', async (): Promise<void> => {
      // Inserting record to update
      await Db<Consent>('Consent')
        .insert(partialConsent)

      // Action
      const updateCount: number = await consentDB.update(consentWithOnlyUpdateFields)

      expect(updateCount).toEqual(1)

      // Assertion
      const consents: Consent[] = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      expect(consents[0].id).toEqual(partialConsent.id)
      expect(consents[0].createdAt).toEqual(expect.any(String))
      expect(consents[0]).toEqual(expect.objectContaining(consentWithOnlyUpdateFields))
    })

    // Non conflicting fields imply
    // * credentialStatus is not `ACTIVE` or
    // * field is null
    it('updates existing consent with only non-conflicting fields from a consent', async (): Promise<void> => {
      // Inserting record to update
      await Db<Consent>('Consent')
        .insert(partialConsent)

      // Action
      const updateCount: number = await consentDB.update(conflictingConsent)

      expect(updateCount).toEqual(1)

      // Assertion
      const consents: Consent[] = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      expect(consents[0]).toEqual(expect.objectContaining({
        // Conflicting fields (initiatorId and participantId) are still the same
        ...partialConsent,
        // SQLite string date type
        createdAt: expect.any(String),
        // Rest of the fields are updated
        credentialId: conflictingConsent.credentialId,
        credentialStatus: conflictingConsent.credentialStatus,
        credentialType: conflictingConsent.credentialType,
        credentialPayload: conflictingConsent.credentialPayload,
        credentialChallenge: conflictingConsent.credentialChallenge
      }))
    })

    it('updates credentialStatus if it is not null but also not ACTIVE', async (): Promise<void> => {
      // Inserting record to update
      await Db<Consent>('Consent')
        .insert(completeConsent)

      // Action
      const updateCount: number = await consentDB.update(conflictingConsent)

      expect(updateCount).toEqual(1)

      // Assertion
      const consents: Consent[] = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      expect(consents[0]).toEqual(expect.objectContaining({
        // Conflicting fields (initiatorId and participantId) are still the same
        // Even other fields are the same
        ...completeConsent,
        // credentialStatus is updated to 'ACTIVE'
        credentialStatus: 'ACTIVE'
      }))
    })

    it('throws an error for a non-existent consent', async (): Promise<void> => {
      // Action
      await expect(consentDB.update(completeConsent))
        .rejects.toThrowError(NotFoundError)
    })
  })

  describe('retrieve', (): void => {
    it('retrieves an existing consent', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(completeConsent)

      // Action
      const consent: Consent = await consentDB.retrieve(completeConsent.id)

      // Assertion
      expect(consent.createdAt).toEqual(expect.any(String))
      expect(consent).toEqual(expect.objectContaining(completeConsent))
    })

    it('throws an error for a non-existent consent', async (): Promise<void> => {
      // Action
      await expect(consentDB.retrieve(completeConsent.id))
        .rejects.toThrowError(NotFoundError)
    })
  })

  describe('delete', (): void => {
    it('deletes an existing consent', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(completeConsent)

      // Pre action Assertion
      let consents: Consent[] = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      expect(consents.length).toEqual(1)

      // Action
      const deleteCount: number = await consentDB.delete(completeConsent.id)

      expect(deleteCount).toEqual(1)

      // Assertion
      consents = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      expect(consents.length).toEqual(0)
    })

    it('throws an error for a non-existent consent', async (): Promise<void> => {
      // Action
      await expect(consentDB.delete(completeConsent.id))
        .rejects.toThrowError(NotFoundError)
    })

    it('deletes associated scopes on deleting a consent', async (): Promise<void> => {
      // Setup
      await Db<Consent>('Consent')
        .insert(completeConsent)

      // Pre action Assertion
      await Db('Scope')
        .insert({
          consentId: '1234',
          action: 'accounts.transfer',
          accountId: '78901-12345'
        })

      await Db('Scope')
        .insert({
          consentId: '1234',
          action: 'accounts.balance',
          accountId: '38383-22992'
        })

      let scopes = await Db('Scope')
        .select('*')
        .where({ consentId: completeConsent.id })

      expect(scopes.length).toEqual(2)

      // Action
      const deleteCount: number = await consentDB.delete(completeConsent.id)

      expect(deleteCount).toEqual(1)

      scopes = await Db('Scope')
        .select('*')
        .where({ consentId: completeConsent.id })

      const consents = await Db('Consent')
        .select('*')
        .where({ id: completeConsent.id })

      expect(consents.length).toEqual(0)
      expect(scopes.length).toEqual(0)
    })
  })
})
