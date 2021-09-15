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
import { ConsentDB, ConsentModel } from '~/model/consent'
import { ScopeModel } from '~/model/scope'
import { NotFoundError } from '~/model/errors'
import { RevokedConsentModificationError } from '../../../src/model/errors';

/*
 * Mock Consent Resources
 */
const completeConsent: ConsentModel = {
  id: '1234',
  status: 'VERIFIED',
  participantId: 'dfsp-3333-2123',
  credentialType: 'FIDO',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w',
  credentialCounter: 4,
  originalCredential: JSON.stringify({ status:'PENDING', payload:{}, credentialType:'test'}),
}

const expectedCompleteConsent = {
  id: '1234',
  status: 'VERIFIED',
  participantId: 'dfsp-3333-2123',
  createdAt: expect.any(Date),
  credentialType: 'FIDO',
  credentialChallenge: 'xyhdushsoa82w92mzs',
  credentialPayload: 'dwuduwd&e2idjoj0w',
  credentialCounter: 4,
  originalCredential: expect.any(String),
  revokedAt: null,
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
    await Db<ConsentModel>('Consent').del()
  })

  describe('insert', (): void => {
    it('adds consent to the database',
      async (): Promise<void> => {
        const inserted: boolean = await consentDB.insert(completeConsent)

        expect(inserted).toEqual(true)

        const consents: ConsentModel[] = await Db<ConsentModel>('Consent')
          .select('*')
          .where({
            id: completeConsent.id
          })

        expect(consents.length).toEqual(1)
        expect(consents[0]).toEqual(expectedCompleteConsent)
        expect(JSON.parse(consents[0].originalCredential)).toEqual({ status:'PENDING', payload:{}, credentialType:'test'})
      }
    )

    it('throws an error on adding a consent with existing consentId',
      async (): Promise<void> => {
        const inserted: boolean = await consentDB.insert(completeConsent)

        expect(inserted).toEqual(true)

        const consents: ConsentModel[] = await Db<ConsentModel>('Consent')
          .select('*')
          .where({
            id: completeConsent.id
          })

        // Consent has been added
        expect(consents[0]).toEqual(expectedCompleteConsent)

        // Fail primary key constraint
        await expect(consentDB.insert(completeConsent)).rejects.toThrow()
      }
    )

    it('throws an error on adding consent without an id',
      async (): Promise<void> => {
        const consentWithoutId: ConsentModel = {
          id: null as unknown as string,
          status: 'VERIFIED',
          participantId: 'dfsp-3333-2123',
          credentialType: 'FIDO',
          credentialChallenge: 'xyhdushsoa82w92mzs',
          credentialPayload: 'dwuduwd&e2idjoj0w',
          credentialCounter: 4,
          originalCredential: expect.any(String),
        }

        await expect(consentDB.insert(consentWithoutId)).rejects.toThrow()
      }
    )
  })

  describe('retrieve', (): void => {
    it('retrieves an existing consent', async (): Promise<void> => {
      await Db<ConsentModel>('Consent').insert(completeConsent)

      const consent: ConsentModel = await consentDB.retrieve(completeConsent.id)

      expect(consent.createdAt).toEqual(expect.any(Date))
      expect(consent).toEqual(expect.objectContaining(expectedCompleteConsent))
      expect(JSON.parse(consent.originalCredential)).toEqual({ status:'PENDING', payload:{}, credentialType:'test'})
    })

    it('throws an error on retrieving non-existent consent', async (): Promise<void> => {
      await expect(consentDB.retrieve(completeConsent.id))
        .rejects.toThrowError(NotFoundError)
    })
  })

  describe('delete', (): void => {
    it('deletes an existing consent', async (): Promise<void> => {
      await Db<ConsentModel>('Consent').insert(completeConsent)

      let consents: ConsentModel[] = await Db<ConsentModel>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      // Inserted properly
      expect(consents.length).toEqual(1)

      const deleteCount: number = await consentDB.delete(completeConsent.id)

      expect(deleteCount).toEqual(1)

      consents = await Db<ConsentModel>('Consent')
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

        await Db<ConsentModel>('Consent').insert(completeConsent)
        // Insert associated scopes
        await Db<ScopeModel>('Scope').insert(tempScopes)

        let scopes = await Db<ScopeModel>('Scope')
          .select('*')
          .where({
            consentId: completeConsent.id
          })

        expect(scopes.length).toEqual(2)

        const deleteCount: number = await consentDB.delete(completeConsent.id)

        expect(deleteCount).toEqual(1)

        scopes = await Db<ScopeModel>('Scope')
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

  describe('revoke', (): void => {
    it('revokes an existing consent', async (): Promise<void> => {
      await Db<ConsentModel>('Consent').insert(completeConsent)

      const consent: ConsentModel = await consentDB.retrieve(completeConsent.id)

      expect(consent.createdAt).toEqual(expect.any(Date))
      expect(consent).toEqual(expect.objectContaining(expectedCompleteConsent))

      await consentDB.revoke(completeConsent.id)

      const consentRevoked: ConsentModel = await consentDB.retrieve(completeConsent.id)

      expect(consentRevoked).toEqual({
        id: '1234',
        participantId: 'dfsp-3333-2123',
        status: 'REVOKED',
        credentialType: 'FIDO',
        credentialChallenge: 'xyhdushsoa82w92mzs',
        credentialPayload: 'dwuduwd&e2idjoj0w',
        credentialCounter: 4,
        originalCredential: expect.any(String),
        createdAt: expect.any(Date),
        revokedAt: expect.any(Date),
      })

      expect(JSON.parse(consentRevoked.originalCredential)).toEqual({ status:'PENDING', payload:{}, credentialType:'test'})
    })

    it('throws an error on revoking non-existent consent', async (): Promise<void> => {
      await expect(consentDB.revoke(completeConsent.id))
        .rejects.toThrowError(NotFoundError)
    })

    it('does not revoke a revoked consent again in the database', async (): Promise<void> => {
      const inserted: boolean = await consentDB.insert(completeConsent)

      expect(inserted).toEqual(true)

      // Action
      await consentDB.revoke(completeConsent.id)

      // Assertion
      const consents: ConsentModel[] = await Db<ConsentModel>('Consent')
        .select('*')
        .where({
          id: completeConsent.id
        })

      expect(consents[0]).toEqual({
        id: '1234',
        participantId: 'dfsp-3333-2123',
        status: 'REVOKED',
        credentialType: 'FIDO',
        credentialChallenge: 'xyhdushsoa82w92mzs',
        credentialPayload: 'dwuduwd&e2idjoj0w',
        credentialCounter: 4,
        originalCredential: expect.any(String),
        createdAt: expect.any(Date),
        revokedAt: expect.any(Date)
      })

      expect(JSON.parse(consents[0].originalCredential)).toEqual({ status:'PENDING', payload:{}, credentialType:'test'})

      await expect(consentDB.revoke(completeConsent.id))
        .rejects.toThrowError(RevokedConsentModificationError)
    })
  })
})
