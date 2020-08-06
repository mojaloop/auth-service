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
import Config from '../../config/knexfile'
import { config } from './config'
import ConsentDB from '../model/consent'
import ScopeDB from '../model/scope'

function getKnexInstance (): Knex {
  let Db: Knex
  switch (config.get('DB_ENVIRONMENT')) {
    case 'test': {
      Db = Knex(Config.test as object)
      break
    }

    case 'development': {
      Db = Knex(Config.development as object)
      break
    }

    case 'production': {
      Db = Knex(Config.production as object)
      break
    }

    default: {
      throw new Error('Unexpected environment encountered.')
    }
  }
  return Db
}

const knexInstance: Knex = getKnexInstance()
const consentDB: ConsentDB = new ConsentDB(knexInstance)
const scopeDB: ScopeDB = new ScopeDB(knexInstance)

export {
  consentDB,
  scopeDB
}
