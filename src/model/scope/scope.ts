/* istanbul ignore file */
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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import { Knex } from 'knex'
import { NotFoundError } from '../errors'

/*
 * Interface for Scope resource type
 */
export interface ScopeModel {
  id?: number
  consentId: string
  action: string
  address: string
}

/*
 * Class to abstract Scope DB operations
 */
export class ScopeDB {
  // Knex instance
  private Db: Knex

  public constructor(dbInstance: Knex) {
    this.Db = dbInstance
  }

  // Add a single Scope or an array of Scopes
  public async insert(scopes: ScopeModel | ScopeModel[], trx?: Knex.Transaction): Promise<boolean> {
    // To avoid inconsistencies between DBs, we define a standard
    // way to deal with empty arrays.
    // We just return true because an empty array was anyways
    // not going to affect the DB.
    if (Array.isArray(scopes) && scopes.length === 0) {
      return true
    }

    const action = this.Db<ScopeModel>('Scope').insert(scopes)
    if (trx) {
      await action.transacting(trx)
    } else {
      await action
    }
    return true
  }

  // Retrieve Scopes by Consent ID
  public async getForConsentId(consentId: string): Promise<ScopeModel[]> {
    const scopes: ScopeModel[] = await this.Db<ScopeModel>('Scope').select('*').where({ consentId })

    // Not distinguishing between a Consent that exists
    // with 0 scopes and a Consent that does not exist
    if (scopes.length === 0) {
      throw new NotFoundError('Consent Scopes', consentId)
    }

    return scopes
  }
}
