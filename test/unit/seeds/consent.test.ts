/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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

 - Ahan Gupta <ahangupta.96@gmail.com>

 --------------
 ******/

import Config from '../../config/knexfile'
import Knex from 'knex'

describe('testing Consent table', (): void => {
  let db: Knex<unknown[]>

  beforeAll(async (): Promise<void> => {
    db = Knex(Config.test)
    await db.migrate.latest()
    await db.seed.run()
  })

  afterAll(async (): Promise<void> => {
    db.destroy()
  })

  it('should properly select all the entries in the Consent table', async (): Promise<void> => {
    expect(db).toBeDefined()
    const users: Knex.QueryBuilder[] = await db.from('Consent').select('*')
    expect(users.length).toEqual(3)
    expect(users[0]).toMatchObject({
      id: '123',
      initiatorId: 'PISPA',
      participantId: 'DFSPA',
      credentialId: null,
      credentialType: null,
      credentialStatus: null,
      credentialPayload: null,
      credentialChallenge: null
    })
    expect(users[1]).toMatchObject({
      id: '124',
      initiatorId: 'PISPB',
      participantId: 'DFSPA',
      credentialId: '9876',
      credentialType: 'FIDO',
      credentialStatus: 'PENDING',
      credentialPayload: null,
      credentialChallenge: 'string_representing_challenge_a'
    })
    expect(users[2]).toMatchObject({
      id: '125',
      initiatorId: 'PISPC',
      participantId: 'DFSPA',
      credentialId: '9875',
      credentialType: 'FIDO',
      credentialStatus: 'VERIFIED',
      credentialPayload: 'string_representing_public_key_a',
      credentialChallenge: 'string_representing_challenge_b'
    })
  })
})

describe('testing that constraints are enforced in the consent table', (): void => {
  let db: Knex<unknown[]>

  beforeAll(async (): Promise<void> => {
    db = Knex(Config.test)
    await db.migrate.latest()
    await db.seed.run()
  })

  afterAll(async (): Promise<void> => {
    db.destroy()
  })

  it('should properly enforce the primary key constraint in the Consent table', async (): Promise<void> => {
    expect(db).toBeDefined()
    /* Tests for duplication */
    await expect(db.from('Consent').insert({
      id: '123',
      initiatorId: 'PISPA',
      participantId: 'DFSPA',
      credentialId: null,
      credentialType: null,
      credentialStatus: null,
      credentialPayload: null,
      credentialChallenge: null
    })).rejects.toThrow()
    /* Tests for non-nullity */
    await expect(db.from('Consent').insert({
      id: null,
      initiatorId: 'PISPA',
      participantId: 'DFSPA',
      credentialId: null,
      credentialType: null,
      credentialStatus: null,
      credentialPayload: null,
      credentialChallenge: null
    })).rejects.toThrow()
  })
  it('should properly enforce the non-nullable constraint for initiatorId', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(db.from('Consent').insert({
      id: '126',
      initiatorId: null,
      participantId: 'DFSPA',
      credentialId: null,
      credentialType: null,
      credentialStatus: null,
      credentialPayload: null,
      credentialChallenge: null
    })).rejects.toThrow()
  })
  it('should properly enforce the non-nullable constraint for participantId', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(db.from('Consent').insert({
      id: '126',
      initiatorId: 'PISPA',
      participantId: null,
      credentialId: null,
      credentialType: null,
      credentialStatus: null,
      credentialPayload: null,
      credentialChallenge: null
    })).rejects.toThrow()
  })
})
