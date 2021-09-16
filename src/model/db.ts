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
import { logger } from '~/shared/logger'
import Config from '../shared/config'
import { ConsentModel, ConsentDB } from './consent'
import { ScopeModel, ScopeDB } from './scope'

const Db: Knex = Knex(Config.DATABASE)
const consentDB: ConsentDB = new ConsentDB(Db)
const scopeDB: ScopeDB = new ScopeDB(Db)

const closeKnexConnection = async (): Promise<void> => Db.destroy()

async function insertConsentWithScopes (consent: ConsentModel, scopes: ScopeModel[]): Promise<void> {
  
  const trxProvider = Db.transactionProvider()
  const trx = await trxProvider()
  console.log('tmp doing stuff!')
  try {
    await consentDB.insert(consent, trx)
    await scopeDB.insert(scopes, trx)
    await trx.commit()
  } catch (err) {
    logger.push(err).debug(`db.insertConsentWithScopes error`)
    await trx.rollback()
    throw err
  }
}

async function getConsent (consentId: string): Promise<ConsentModel> {
  return consentDB.retrieve(consentId)
}

async function getScopesForConsentId (consentId: string): Promise<Array<ScopeModel>> {
  return scopeDB.getForConsentId(consentId)
}

async function testCleanupConsents (consentIds: Array<string>): Promise<void> {
  await Promise.all(consentIds.map(async id => {
    return consentDB.delete(id)
  }))
}

export {
  Db,
  consentDB,
  scopeDB,
  closeKnexConnection,
  insertConsentWithScopes,
  getConsent,
  getScopesForConsentId,

  // Test utils
  testCleanupConsents
}
