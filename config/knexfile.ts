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

 - Kenneth Zeng <kkzeng@google.com>
 --------------
 ******/

import { DatabaseConfig } from '../src/shared/config'
import path from 'path'
require('ts-node/register')
const migrationsDirectory = path.join(__dirname, '../migrations')
const seedsDirectory = path.join(__dirname, '../seeds')

interface KnexConfig {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
}

const mySQLConfig: DatabaseConfig = {
  client: 'mysql',
  version: '5.5',
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'auth-service',
    password: 'password',
    database: 'auth-service',
    timezone: 'UTC'
  },
  pool: {
    min: 10,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
  migrations: {
    directory: migrationsDirectory,
    tableName: 'auth-service',
    stub: `${migrationsDirectory}/migration.template`,
    loadExtensions: ['.ts']
  },
  seeds: {
    directory: seedsDirectory,
    loadExtensions: ['.ts']
  }
}

const Config: KnexConfig = {
  development: mySQLConfig,
  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations: {
      directory: migrationsDirectory,
      tableName: 'auth-service',
      loadExtensions: ['.ts']
    },
    seeds: {
      directory: seedsDirectory,
      loadExtensions: ['.ts']
    }
  },
  production: mySQLConfig
}

export default Config
module.exports = Config
