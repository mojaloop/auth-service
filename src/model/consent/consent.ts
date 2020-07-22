/* To ignore from integration and BDD testing, addressed in #354 and #368 */
/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
 * which will be addressed in the future in
 * ticket #354
 */

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
 * Unlike MySQL, SQLite (testing DB) doesn't support Timestamp type natively.
 * It returns ISO strings using the inbuilt Date() function.
 * Thus, return value for MySQL Timestamp as Date object for insertion/retrieval
 * of 'createdAt' field may need to be tested in the future.
 */

import { NotFoundError } from '../errors'
import Knex from 'knex'

/*
 * Interface for Consent resource type
 */
export interface Consent {
  id: string;
  initiatorId?: string;
  participantId?: string;
  credentialId?: string;
  credentialType?: string;
  credentialStatus?: string;
  credentialPayload?: string;
  credentialChallenge?: string;
  createdAt?: Date;
}

/*
 * Class to abstract Consent DB operations
 */
export class ConsentDB {
  // Knex instance
  private Db: Knex

  public constructor (dbInstance: Knex) {
    this.Db = dbInstance
  }

  // Add initial Consent parameters
  // Error bubbles up in case of primary key violation
  public async insert (consent: Consent): Promise<boolean> {
    // Returns [0] for MySQL-Knex and [Row Count] for SQLite-Knex
    await this
      .Db<Consent>('Consent')
      .insert(consent)

    return true
  }

  // Update Consent
  // No validation against Null or illegal updates in models
  public async update (consent: Consent): Promise<number> {
    // Returns number of updated rows
    const updateCount: number = await this
      .Db<Consent>('Consent')
      .where({ id: consent.id })
      .update(consent)

    // Ensure that the caller knows that the resource does not exist
    if (updateCount === 0) {
      throw new NotFoundError('Consent', consent.id)
    }

    return updateCount
  }

  // Retrieve Consent by ID (unique)
  public async retrieve (id: string): Promise<Consent> {
    // Returns array containing consents
    const consents: Consent[] = await this
      .Db<Consent>('Consent')
      .select('*')
      .where({ id: id })
      .limit(1)

    if (consents.length === 0) {
      throw new NotFoundError('Consent', id)
    }

    return consents[0]
  }

  // Delete Consent by ID
  // Deleting Consent automatically deletes associates scopes
  public async delete (id: string): Promise<number> {
    // Returns number of deleted rows
    const deleteCount: number = await this
      .Db<Consent>('Consent')
      .where({ id: id })
      .del()

    if (deleteCount === 0) {
      throw new NotFoundError('Consent', id)
    }

    return deleteCount
  }
}
