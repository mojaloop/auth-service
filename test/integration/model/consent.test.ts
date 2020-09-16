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
import ConsentDB, { Consent } from '../../../src/model/consent'
import { Scope } from '../../../src/model/scope'
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
  credentialPayload: 'dwuduwd&e2idjoj0w'
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

const expectedPartialConsent: object = {
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
  revokedAt: null
}

/*
 * Consent Resource Model Integration Tests
 */
describe('src/model/consent', (): void => {
  let Db: Knex
  let consentDB: ConsentDB

  beforeAll(async (): Promise<void> => {
    Db = Knex(Config.DATABASE as object)

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

        const expectedConsent: object = {
          // Conflicting fields (initiatorId, participantId) are still the same
          ...partialConsent,
          createdAt: expect.any(Date),
          // Rest of the fields are updated
          credentialId: conflictingConsent.credentialId,
          credentialStatus: conflictingConsent.credentialStatus,
          credentialType: conflictingConsent.credentialType,
          credentialPayload: conflictingConsent.credentialPayload,
          credentialChallenge: conflictingConsent.credentialChallenge,
          revokedAt: null
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

        const expectedConsent: object = {
          // Conflicting fields (initiatorId, participantId) are still the same
          // Even other fields are the same
          ...completeConsent,
          createdAt: expect.any(Date),
          // credentialStatus is updated to 'ACTIVE'
          credentialStatus: 'ACTIVE',
          revokedAt: null
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
        const tempScopes: object[] = [
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
        await Db<Scope>('Scope').insert(tempScopes)

        let scopes = await Db<Scope>('Scope')
          .select('*')
          .where({
            consentId: completeConsent.id
          })

        expect(scopes.length).toEqual(2)

        const deleteCount: number = await consentDB.delete(completeConsent.id)

        expect(deleteCount).toEqual(1)

        scopes = await Db<Scope>('Scope')
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
