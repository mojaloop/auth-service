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
import Config from '~/shared/config'
import { ConsentDB, Consent } from '../../../src/model/consent'
import { ModelScope } from '../../../src/model/scope'
import { NotFoundError } from '../../../src/model/errors'

/*
 * Mock Consent Resources
 */
const partialConsent: Consent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123'
}

const completeConsent: Consent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
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

// Intentional lack of initiatorId and participantId
const consentWithOnlyUpdateFields: Consent = {
  id: '1234',
  status: 'ACTIVE',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w'
}

const conflictingConsent: Consent = {
  id: '1234',
  status: 'ACTIVE',
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

const expectedPartialConsent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  createdAt: expect.any(Date),
  credentialId: null,
  credentialType: null,
  credentialStatus: null,
  credentialPayload: null,
  credentialChallenge: null,
  revokedAt: null,
  clientDataJSON: null,
  attestationObject: null
}

/*
 * Consent Resource Model Integration Tests
 */
describe('src/model/consent', (): void => {
  let Db: Knex
  let consentDB: ConsentDB

  beforeAll(async (): Promise<void> => {
    Db = Knex(Config.DATABASE)
    consentDB = new ConsentDB(Db)
    await Db.seed.run()
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
        const inserted: boolean = await consentDB.insert(partialConsent)

        expect(inserted).toEqual(true)

        const consents: Consent[] = await Db<Consent>('Consent')
          .select('*')
          .where({
            id: partialConsent.id
          })

        expect(consents.length).toEqual(1)
        expect(consents[0]).toEqual(expectedPartialConsent)
      }
    )

    it('throws an error on adding a consent with existing consentId',
      async (): Promise<void> => {
        const inserted: boolean = await consentDB.insert(partialConsent)

        expect(inserted).toEqual(true)

        const consents: Consent[] = await Db<Consent>('Consent')
          .select('*')
          .where({
            id: partialConsent.id
          })

        // Consent has been added
        expect(consents[0]).toEqual(expectedPartialConsent)

        // Fail primary key constraint
        await expect(consentDB.insert(partialConsent)).rejects.toThrow()
      }
    )

    it('throws an error on adding consent without an id',
      async (): Promise<void> => {
        const consentWithoutId: Consent = {
          id: null as unknown as string,
          status: 'ACTIVE',
          initiatorId: '494949',
          participantId: '3030303'
        }

        await expect(consentDB.insert(consentWithoutId)).rejects.toThrow()
      }
    )
  })

  describe('update', (): void => {
    it('updates existing consent from a consent having only required fields',
      async (): Promise<void> => {
        // Inserting record to update
        await Db<Consent>('Consent').insert(partialConsent)

        // Update only selected fields of inserted record
        const updateCount: number = await consentDB.update(
          consentWithOnlyUpdateFields
        )

        expect(updateCount).toEqual(1)

        const consents: Consent[] = await Db<Consent>('Consent')
          .select('*')
          .where({
            id: completeConsent.id
          })

        expect(consents[0].id).toEqual(partialConsent.id)
        expect(consents[0].createdAt).toEqual(expect.any(Date))
        expect(consents[0]).toEqual(
          expect.objectContaining(consentWithOnlyUpdateFields)
        )
      }
    )

    // credentialStatus is non-conflicting if not `ACTIVE`
    // Any other field is non-conflicting if not null
    it('updates existing consent with only non-conflicting fields from consent',
      async (): Promise<void> => {
        // Inserting record to update
        await Db<Consent>('Consent').insert(partialConsent)

        const updateCount: number = await consentDB.update(conflictingConsent)

        expect(updateCount).toEqual(1)

        const consents: Consent[] = await Db<Consent>('Consent')
          .select('*')
          .where({
            id: completeConsent.id
          })

        const expectedConsent = {
          // Conflicting fields (initiatorId, participantId) are still the same
          ...partialConsent,
          createdAt: expect.any(Date),
          // Rest of the fields are updated
          credentialId: conflictingConsent.credentialId,
          credentialStatus: conflictingConsent.credentialStatus,
          credentialType: conflictingConsent.credentialType,
          credentialPayload: conflictingConsent.credentialPayload,
          credentialChallenge: conflictingConsent.credentialChallenge,
          revokedAt: null,
          clientDataJSON: null,
          attestationObject: null
        }

        expect(consents[0]).toEqual(expectedConsent)
      }
    )

    it('updates credentialStatus if it is not null but also not ACTIVE',
      async (): Promise<void> => {
        // Inserting record to update
        await Db<Consent>('Consent').insert(completeConsent)

        const updateCount: number = await consentDB.update(conflictingConsent)

        expect(updateCount).toEqual(1)

        const consents: Consent[] = await Db<Consent>('Consent')
          .select('*')
          .where({
            id: completeConsent.id
          })

        const expectedConsent = {
          // Conflicting fields (initiatorId, participantId) are still the same
          // Even other fields are the same
          ...completeConsent,
          createdAt: expect.any(Date),
          // credentialStatus is updated to 'ACTIVE'
          credentialStatus: 'ACTIVE',
          revokedAt: null,
          clientDataJSON: expect.any(String),
          attestationObject: expect.any(String)
        }

        expect(consents[0]).toEqual(expectedConsent)
      }
    )

    it('throws an error on updating non-existent consent', async (): Promise<void> => {
      await expect(consentDB.update(completeConsent))
        .rejects.toThrowError(NotFoundError)
    })
  })

  describe('retrieve', (): void => {
    it('retrieves an existing consent', async (): Promise<void> => {
      await Db<Consent>('Consent').insert(completeConsent)

      const consent: Consent = await consentDB.retrieve(completeConsent.id)

      expect(consent.createdAt).toEqual(expect.any(Date))
      expect(consent).toEqual(expect.objectContaining(completeConsent))
    })

    it('throws an error on retrieving non-existent consent', async (): Promise<void> => {
      await expect(consentDB.retrieve(completeConsent.id))
        .rejects.toThrowError(NotFoundError)
    })
  })

  describe('delete', (): void => {
    it('deletes an existing consent', async (): Promise<void> => {
      await Db<Consent>('Consent').insert(completeConsent)

      let consents: Consent[] = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      // Inserted properly
      expect(consents.length).toEqual(1)

      const deleteCount: number = await consentDB.delete(completeConsent.id)

      expect(deleteCount).toEqual(1)

      consents = await Db<Consent>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      // Deleted properly
      expect(consents.length).toEqual(0)
    })

    it('throws an error on deleting non-existent consent', async (): Promise<void> => {
      await expect(consentDB.delete(completeConsent.id))
        .rejects.toThrowError(NotFoundError)
    })

    it('deletes associated scopes on deleting a consent',
      async (): Promise<void> => {
        const tempScopes = [
          {
            consentId: '1234',
            action: 'accounts.transfer',
            accountId: '78901-12345'
          },
          {
            consentId: '1234',
            action: 'accounts.balance',
            accountId: '38383-22992'
          }
        ]

        await Db<Consent>('Consent').insert(completeConsent)
        // Insert associated scopes
        await Db<ModelScope>('Scope').insert(tempScopes)

        let scopes = await Db<ModelScope>('Scope')
          .select('*')
          .where({
            consentId: completeConsent.id
          })

        expect(scopes.length).toEqual(2)

        const deleteCount: number = await consentDB.delete(completeConsent.id)

        expect(deleteCount).toEqual(1)

        scopes = await Db<ModelScope>('Scope')
          .select('*')
          .where({
            consentId: completeConsent.id
          })

        const consents = await Db('Consent')
          .select('*')
          .where({
            id: completeConsent.id
          })

        // Confirm empty table
        expect(consents.length).toEqual(0)
        expect(scopes.length).toEqual(0)
      }
    )
  })
})
