/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 - Ahan Gupta <ahangupta.96@gmail.com>
 - Abhimanyu Kapur <abhi.kapur09@gmail.com>

 --------------
 ******/
import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void | Knex.SchemaBuilder> {
  return knex.schema.hasTable('Consent').then((exists: boolean): Knex.SchemaBuilder | void => {
    if (!exists) {
      return knex.schema.createTable('Consent', (t: Knex.CreateTableBuilder): void => {
        t.string('id', 36).primary().notNullable()
        t.string('status', 32).notNullable()
        t.string('participantId', 32).notNullable()

        t.string('credentialType', 16).notNullable()
        t.string('credentialPayload').notNullable()
        t.string('credentialChallenge', 128).notNullable()
        t.integer('credentialCounter').notNullable()
        t.json('originalCredential').notNullable()

        t.timestamp('createdAt').defaultTo(knex.fn.now())
        t.timestamp('revokedAt').nullable()
      })
    }
  })
}

export function down(knex: Knex): Knex.SchemaBuilder {
  return knex.schema.dropTableIfExists('Consent')
}
