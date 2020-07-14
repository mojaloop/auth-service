/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
 * which will be addressed in a future ticket
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

import Knex from 'knex'
import { NotFoundError } from '../errors'

/*
* Interface for Scope resource type
*/
export interface Scope {
  id?: number;
  consentId: string;
  action: string;
  accountId: string;
}

/*
 * Class to abstract Scope DB operations
 */
export class ScopeDB {
  // Knex instance
  private Db: Knex

  public constructor (dbInstance: Knex) {
    this.Db = dbInstance
  }

  // Add a single Scope or an array of Scopes
  public async register (scopes: Scope | Scope[]): Promise<number> {
    // Returns array containing number of inserted rows
    const insertCount: number[] = await this
      .Db<Scope>('Scope')
      .insert(scopes)

    return insertCount[0]
  }

  // Retrieve Scopes by Consent ID
  public async retrieveAll (consentId: string): Promise<Scope[]> {
    const scopes: Scope[] = await this
      .Db<Scope>('Scope')
      .select('*')
      .where({ consentId: consentId })

    if (scopes.length === 0) {
      throw new NotFoundError('Scope', consentId)
    }

    return scopes
  }

  // Delete Scopes by Consent ID
  public async deleteAll (consentId: string): Promise<number> {
    const deleteCount: number = await this
      .Db<Scope>('Scope')
      .where({ consentId: consentId })
      .del()

    if (deleteCount === 0) {
      throw new NotFoundError('Scope', consentId)
    }

    return deleteCount
  }
}
