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

import Config from '../../../config/knexfile'
import Knex from 'knex'

describe('testing scope table', (): void => {
  let db: Knex<unknown[]>

  beforeAll(async (): Promise<void> => {
    db = Knex(Config.test)
    await db.migrate.latest()
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
      id: 1,
      consentId: '123',
      action: 'accounts.getBalance',
      accountId: '12345-67890'
    })
    expect(users[1]).toEqual({
      id: 2,
      consentId: '123',
      action: 'accounts.transfer',
      accountId: '12345-67890'
    })
    expect(users[2]).toEqual({
      id: 3,
      consentId: '124',
      action: 'accounts.transfer',
      accountId: '21345-67890'
    })
  })
})

describe('testing that constraints are enforced in the Scope table', (): void => {
  let db: Knex<unknown[]>

  beforeAll(async (): Promise<void> => {
    db = Knex(Config.test)
    await db.migrate.latest()
    await db.seed.run()
  })

  afterAll(async (): Promise<void> => {
    db.destroy()
  })

  it('should properly enforce the primary key constraint', async (): Promise<void> => {
    expect(db).toBeDefined()
    /* Tests for duplication */
    await expect(db.from('Scope').insert({
      id: 1,
      consentId: '125',
      action: 'accounts.transfer',
      accountId: '78901-12345'
    })).rejects.toThrow()
    /* Test for non-nullability is not possible since column is set to increment and will thus be populated by a value if null. */
  })
  it('should properly enforce the non-nullable constraint for consentId', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(db.from('Scope').insert({
      id: 4,
      consentId: null,
      action: 'accounts.transfer',
      accountId: '78901-12345'
    })).rejects.toThrow()
  })
  it('should properly enforce the non-nullable constraint for action', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(db.from('Scope').insert({
      id: 4,
      consentId: '124',
      action: null,
      accountId: '78901-12345'
    })).rejects.toThrow()
  })
  it('should properly enforce the non-nullable constraint for accountId', async (): Promise<void> => {
    expect(db).toBeDefined()
    await expect(db.from('Scope').insert({
      id: 4,
      consentId: '124',
      action: 'accounts.transfer',
      accountId: null
    })).rejects.toThrow()
  })
})
