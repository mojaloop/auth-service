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
import Config from '~/shared/config'
import { ConsentDB, Consent } from '~/model/consent'
import { NotFoundError, RevokedConsentModificationError } from '~/model/errors'

/*
 * Mock Consent Resources
 */
const partialConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  status: 'ACTIVE',
  participantId: 'dfsp-3333-2123'
}

const completeConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'ACTIVE',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w',
  attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIgHq9' +
    'JKpi/bFnnu0uVV+k6JjHfBcFwWRRCXJWlejgzJLUCIQD2iOONGXebOCxq37UqvumxC/d' +
    'Jz1a3U9F1DaxVMFnzf2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0' +
    'BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDY' +
    'zMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0U' +
    'xEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3R' +
    'hdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwY' +
    'HKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZd' +
    'RvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAo' +
    'CBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwY' +
    'BBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb' +
    '3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TO' +
    'iPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5' +
    'T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7' +
    'E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+E' +
    'IJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9' +
    'bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO' +
    '6gx2XY0EAAAAEFJogIY72QTOWuIH41bfx9QBAX8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3' +
    'ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3aUBAgMmIAEhWCB' +
    '0Zo9xAj7V50Tu7Hj8F5Wo0A3AloIpsVDSY2icW9eSwiJYIH79t0O2hnPDguuloYn2eSd' +
  'R7caaZd/Ffnmk4vyOATab',
  clientDataJSON: '{"type":"webauthn.create","challenge":"MgA3ADgANQBjADIAZ' +
    'AA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiA' +
    'DUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZ' +
    'gA2ADcAOAAzADQAMAA","origin":"http://localhost:5000","crossOrigin":false}'
}

const completeConsentRevoked: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'REVOKED',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w',
  revokedAt: (new Date()).toISOString(),
  attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIgHq9' +
    'JKpi/bFnnu0uVV+k6JjHfBcFwWRRCXJWlejgzJLUCIQD2iOONGXebOCxq37UqvumxC/d' +
    'Jz1a3U9F1DaxVMFnzf2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0' +
    'BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDY' +
    'zMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0U' +
    'xEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3R' +
    'hdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwY' +
    'HKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZd' +
    'RvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAo' +
    'CBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwY' +
    'BBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb' +
    '3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TO' +
    'iPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5' +
    'T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7' +
    'E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+E' +
    'IJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9' +
    'bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO' +
    '6gx2XY0EAAAAEFJogIY72QTOWuIH41bfx9QBAX8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3' +
    'ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3aUBAgMmIAEhWCB' +
    '0Zo9xAj7V50Tu7Hj8F5Wo0A3AloIpsVDSY2icW9eSwiJYIH79t0O2hnPDguuloYn2eSd' +
    'R7caaZd/Ffnmk4vyOATab',
  clientDataJSON: '{"type":"webauthn.create","challenge":"MgA3ADgANQBjADIAZ' +
    'AA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiA' +
    'DUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZ' +
    'gA2ADcAOAAzADQAMAA","origin":"http://localhost:5000","crossOrigin":false}'
}

const consentWithOnlyUpdateFields: Consent = {
  id: '1234',
  credentialId: '123',
  status: 'ACTIVE',
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
  status: 'ACTIVE',
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
    Db = Knex(Config.DATABASE)
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
    it('adds consent with partial info to the database',
      async (): Promise<void> => {
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
          status: 'ACTIVE',
          createdAt: expect.any(String),
          credentialId: null,
          credentialType: null,
          credentialStatus: null,
          credentialPayload: null,
          credentialChallenge: null,
          revokedAt: null,
          attestationObject: null,
          clientDataJSON: null
        })
      })

    it('throws an error on adding a consent with existing consentId',
      async (): Promise<void> => {
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
          status: 'ACTIVE',
          createdAt: expect.any(String),
          credentialId: null,
          credentialType: null,
          credentialStatus: null,
          credentialPayload: null,
          credentialChallenge: null,
          revokedAt: null,
          attestationObject: null,
          clientDataJSON: null
        })

        // Fail primary key constraint
        await expect(consentDB.insert(partialConsent))
          .rejects.toThrow()
      })

    it('throws an error on adding consent without an id',
      async (): Promise<void> => {
      // Action
        await expect(consentDB.insert({
          id: null as unknown as string,
          status: 'ACTIVE',
          initiatorId: '494949',
          participantId: '3030303'
        })).rejects.toThrow()
      })
  })

  describe('update', (): void => {
    it('updates existing consent from a consent having only required fields',
      async (): Promise<void> => {
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
        expect(consents[0])
          .toEqual(expect.objectContaining(consentWithOnlyUpdateFields))
      })

    // Non conflicting fields imply
    // * credentialStatus is not `ACTIVE` or
    // * field is null
    it('updates existing consent with only non-conflicting fields from a consent',
      async (): Promise<void> => {
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

    it('updates credentialStatus if it is not null but also not ACTIVE',
      async (): Promise<void> => {
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

    it('throws an error for a non-existent consent',
      async (): Promise<void> => {
      // Action
        await expect(consentDB.update(completeConsent))
          .rejects.toThrowError(NotFoundError)
      })

    it('inserts consent, updates it to REVOKE status and then fails to update a REVOKED consent',
      async (): Promise<void> => {
        // Action
        await Db<Consent>('Consent').del()
        const inserted = await consentDB.insert(completeConsent)
        const updated = await consentDB.update(completeConsentRevoked)

        const consents: Consent[] = await Db<Consent>('Consent')
          .select('*')
          .where({
            id: completeConsent.id
          })
        // Assert
        expect(inserted).toBe(true)
        expect(updated).toBe(1)
        expect(consents[0]).toEqual(expect.objectContaining({
          ...completeConsentRevoked,
          createdAt: expect.any(String)
        }))

        // Action/Assert
        await expect(consentDB.update({
          id: '1234',
          status: 'ACTIVE',
          credentialId: '123',
          credentialType: 'FIDO',
          credentialStatus: 'ACTIVE',
          credentialChallenge: 'xyhdushsoa82w92mzs',
          credentialPayload: 'dwuduwd&e2idjoj0w'
        })).rejects.toThrowError(new RevokedConsentModificationError('Consent', '1234'))
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

    it('throws an error for a non-existent consent',
      async (): Promise<void> => {
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

    it('throws an error for a non-existent consent',
      async (): Promise<void> => {
      // Action
        await expect(consentDB.delete(completeConsent.id))
          .rejects.toThrowError(NotFoundError)
      })

    it('deletes associated scopes on deleting a consent',
      async (): Promise<void> => {
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
