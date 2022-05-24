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

import { Knex, knex } from 'knex'
import Config from '~/shared/config'

describe('testing scope table', (): void => {
  let db: Knex<unknown[]>

  beforeAll(async (): Promise<void> => {
    db = knex(Config.DATABASE)
    await db.seed.run()
  })

  afterAll(async (): Promise<void> => {
    db.destroy()
  })

  it('should properly select all the entries in the Scope table', async (): Promise<void> => {
    expect(db).toBeDefined()
    const users: Knex.QueryBuilder[] = await db.from('Scope').select('*')
    expect(users.length).toEqual(3)
    expect(users[0]).toEqual({
      id: expect.any(Number),
      consentId: '123',
      action: 'ACCOUNTS_GET_BALANCE',
      address: '12345-67890'
    })
    expect(users[1]).toEqual({
      id: expect.any(Number),
      consentId: '123',
      action: 'ACCOUNTS_TRANSFER',
      address: '12345-67890'
    })
    expect(users[2]).toEqual({
      id: expect.any(Number),
      consentId: '124',
      action: 'ACCOUNTS_TRANSFER',
      address: '21345-67890'
    })
  })
})

describe('testing that constraints are enforced in the Scope table', (): void => {
  let db: Knex<unknown[]>

  beforeAll(async (): Promise<void> => {
    db = knex(Config.DATABASE)
  })

  afterAll(async (): Promise<void> => {
    db.destroy()
  })

  it('should properly enforce the primary key constraint', async (): Promise<void> => {
    expect(db).toBeDefined()

    // Retrieve an existing entry and add another entry using it's id
    const users: Knex.QueryBuilder[] = await db.from('Scope').select('*')
    expect(users.length).toBeGreaterThan(0)
    const existingEntry = await users[0]
    const existingId: string = existingEntry.id

    /* Tests for duplication */
    await expect(
      db.from('Scope').insert({
        id: existingId,
        consentId: '125',
        action: 'ACCOUNTS_TRANSFER',
        address: '78901-12345'
      })
    ).rejects.toThrow()
    /* Test for non-nullability is not possible since column is set to increment and will thus be populated by a value if null. */
  })
  it('should properly enforce the non-nullable constraint for consentId', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(
      db.from('Scope').insert({
        id: 4,
        consentId: null,
        action: 'ACCOUNTS_TRANSFER',
        address: '78901-12345'
      })
    ).rejects.toThrow()
  })
  it('should properly enforce the non-nullable constraint for action', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(
      db.from('Scope').insert({
        id: 4,
        consentId: '124',
        action: null,
        address: '78901-12345'
      })
    ).rejects.toThrow()
  })
  it('should properly enforce the non-nullable constraint for address', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(
      db.from('Scope').insert({
        id: 4,
        consentId: '124',
        action: 'ACCOUNTS_TRANSFER',
        address: null
      })
    ).rejects.toThrow()
  })
})
