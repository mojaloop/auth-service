/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
 * which will be addressed in the future in
 * ticket #354
 */

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

/*
 * Unlike MySQL, SQLite (testing DB) doesn't support Timestamp type natively.
 * It returns ISO strings using the inbuilt Date() function.
 * Thus, return value for MySQL Timestamp as Date object for insertion/retrieval
 * of 'createdAt' field may need to be tested in the future.
 */

import { NotFoundError, RevokedConsentModificationError } from '../errors'
import { Knex } from 'knex'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { logger } from '~/shared/logger'

/*
 * Interface for Consent resource type as modelled in DB
 */
export interface ConsentModel {
  id: string
  // participant DFSP that requested a Consent resource be made
  participantId: string
  /*
   * status of a Consent
   * a consent resource will be marked ISSUED on creation.
   * When a consent is "deleted" we mark it REVOKED instead of dropping the row.
   */
  status: tpAPI.Schemas.ConsentStatusIssued | tpAPI.Schemas.ConsentStatusRevoked
  // credential type - currently trying to support FIDO/Generic credentials
  credentialType: 'FIDO' | 'GENERIC'
  // assuming this is the public key of the pair
  credentialPayload: string
  // This is the original challenge sent by the DFSP to the PISP that is derived from the scopes + consentId
  credentialChallenge: string
  // a counter that gets incremented every time the credential is used
  credentialCounter: number
  // the original credential used to register the consent
  originalCredential: string
  createdAt?: Date
  revokedAt?: Date
}

const tableName = 'Consent'

/*
 * Class to abstract Consent DB operations
 */
export class ConsentDB {
  // Knex instance
  private Db: Knex

  public constructor(dbInstance: Knex) {
    this.Db = dbInstance
  }

  // Add initial Consent parameters
  // Error bubbles up in case of primary key violation
  public async insert(consent: ConsentModel, trx?: Knex.Transaction): Promise<boolean> {
    logger.debug(`ConsentDB.insert - ${JSON.stringify(consent)}`)
    // optionally insert in transaction
    const action = this.Db<ConsentModel>(tableName).insert(consent)
    if (trx) {
      await action.transacting(trx)
    } else {
      await action
    }
    return true
  }

  // Retrieve Consent by ID (unique)
  public async retrieve(id: string): Promise<ConsentModel> {
    // Returns array containing consents
    const consents: ConsentModel[] = await this.Db<ConsentModel>(tableName).select('*').where({ id: id }).limit(1)

    if (consents.length === 0) {
      throw new NotFoundError(tableName, id)
    }

    return consents[0]
  }

  // Delete Consent by ID
  // Deleting Consent automatically deletes associates scopes
  public async delete(id: string): Promise<number> {
    // Returns number of deleted rows
    const deleteCount: number = await this.Db<ConsentModel>(tableName).where({ id: id }).del()

    if (deleteCount === 0) {
      throw new NotFoundError(tableName, id)
    }

    return deleteCount
  }

  // Revoke Consent
  public async revoke(id: string): Promise<number> {
    const consents: ConsentModel[] = await this.Db<ConsentModel>(tableName).select('*').where({ id }).limit(1)

    if (consents.length === 0) {
      throw new NotFoundError(tableName, id)
    }

    if (consents[0].status === 'REVOKED') {
      throw new RevokedConsentModificationError(tableName, id)
    }

    return await this.Db<ConsentModel>(tableName).where({ id }).update({
      status: 'REVOKED',
      revokedAt: this.Db.fn.now()
    })
  }
}
