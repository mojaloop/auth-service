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
  // participant DFSP that requested a Consent resource be made
  participantId: string;
  // status of the consent
  status: string;
  // NOTE: not sure what purpose credentialId serves.
  credentialId: string;
  // credential type - currently trying to support FIDO/Generic credentials
  credentialType: string;
  // NOTE: unsure this field is needed since `auth-service` verifies
  //       credential on receiving them
  credentialStatus: string;
  // assuming this is the public key of the pair
  credentialPayload: string;
  // NOTE: not sure what `credentialChallenge` is used for.
  //       best guess is that in `retrieveValidConsent` the original challenge
  //       used to register the consent is needed to retrieve the Consent.
  //       assuming this is an extra layer of protection since only the
  //       DFSP has the variables used to derive the original challenge?
  // TODO: remove this if it serves a redundant purpose
  credentialChallenge: string;
  // not sure how this fido2 counter works but fido2-lib suggests we store it
  credentialCounter: number;
  createdAt?: Date;
  revokedAt?: string;
}

/*
 * Interface for Consent resource type
 * A consent resource should be marked ACTIVE on creation.
 * When a consent is "deleted" we mark it REVOKED instead of dropping the row.
 */
export enum ConsentStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

/*
 * Interface for Consent Credential resource type
 * NOTE: unsure if we still PENDING. VERIFIED should be the only status needed
 *       now since the credential is verified at once when received by the
 *       auth-service and stored AFTER. VERIFIED might also not be needed
 *       because assuming the prior, row existence equates verified
 */
export enum CredentialStatusEnum {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
}

/*
 * Interface for Consent Credential resource type
 * This is a subset of the Consent resource representing a FIDO credential
 */
export interface ConsentCredential {
  credentialId?: string;
  credentialType: 'FIDO' | 'GENERIC';
  credentialStatus: CredentialStatusEnum;
  credentialPayload: string | null;
  credentialChallenge: string;
  credentialCounter: string;
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
  public async insert (consent: Consent, trx?: Knex.Transaction): Promise<boolean> {
    // optionally insert in transaction
    const action = this.Db<Consent>('Consent').insert(consent)
    if (trx) {
      await action.transacting(trx)
    } else {
      await action
    }
    return true
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

  // Revoke Consent
  public async revoke (id: string): Promise<number> {
    const consents: Consent[] = await this
      .Db<Consent>('Consent')
      .select('*')
      .where({ id })
      .limit(1)

    if (consents.length === 0) {
      throw new NotFoundError('Consent', id)
    }

    const existingConsent: Consent = consents[0]
    const revokedConsent: Consent = {
      ...existingConsent,
      'status': 'REVOKED'
    }

    return await this.Db<Consent>('Consent')
      .where({ id })
      .update(revokedConsent)
  }
}
