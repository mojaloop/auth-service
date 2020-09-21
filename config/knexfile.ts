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

// import Convict from 'convict'
import path from 'path'
import ProductionDatabaseConfig from './production_db.json'
const migrationsDirectory = path.join(__dirname, '../migrations')
const seedsDirectory = path.join(__dirname, '../seeds')

interface DbConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  timezone: string;
}

interface DbPool {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

export interface DatabaseConfig {
  client: string;
  version?: string;
  useNullAsDefault?: boolean;
  connection: DbConnection | string;
  pool?: DbPool;

  migrations: {
    directory: string;
    tableName: string;
    stub?: string;
    loadExtensions: string[];
  };

  seeds: {
    directory: string;
    loadExtensions: string[];
  };
}

// const ConvictDatabaseConfig = Convict<DatabaseConfig>({
//   client: {
//     doc: 'Which database client should we use',
//     format: ['mysql', 'sqlite3'],
//     default: 'mysql'
//   },
//   version: {
//     doc: 'What database version should we use',
//     format: String,
//     default: '5.5'
//   },
//   connection: {
//     host: {
//       doc: 'The Hostname/IP address to bind.',
//       format: '*',
//       default: '0.0.0.0'
//     },
//     port: {
//       doc: 'The port to bind.',
//       format: 'port',
//       default: 4004
//     },
//     user: {
//       doc: 'The username for the database',
//       format: String,
//       default: 'auth-service'
//     },
//     password: {
//       doc: 'The password for the database',
//       format: String,
//       default: 'password'
//     },
//     database: {
//       doc: 'The name of the database',
//       format: String,
//       default: 'auth-service'
//     },
//     timezone: {
//       doc: 'Timezone used for timestamps in the database',
//       format: String,
//       default: 'UTC'
//     }
//   },
//   pool: {
//     min: {
//       doc: 'Minimum number of connections',
//       format: 'Number',
//       default: 10
//     },
//     max: {
//       doc: 'Maximum number of connections',
//       format: 'Number',
//       default: 10
//     },
//     acquireTimeoutMillis: {
//       doc: '',
//       format: 'Number',
//       default: 30000
//     },
//     createTimeoutMillis: {
//       doc: '',
//       format: 'Number',
//       default: 30000
//     },
//     destroyTimeoutMillis: {
//       doc: '',
//       format: 'Number',
//       default: 5000
//     },
//     idleTimeoutMillis: {
//       doc: '',
//       format: 'Number',
//       default: 30000
//     },
//     reapIntervalMillis: {
//       doc: '',
//       format: 'Number',
//       default: 1000
//     },
//     createRetryIntervalMillis: {
//       doc: '',
//       format: 'Number',
//       default: 200
//     }
//   },
//   migrations: {
//     directory: {
//       doc: 'Migration directory',
//       format: String,
//       default: migrationsDirectory
//     },
//     tableName: {
//       doc: 'Migration table name',
//       format: String,
//       default: 'auth-service'
//     },
//     stub: {
//       doc: '',
//       format: String,
//       default: `${migrationsDirectory}/migration.template`
//     },
//     loadExtensions: {
//       doc: 'Array of extensions to load',
//       format: 'Array',
//       default: ['.ts']
//     }
//   },
//   seeds: {
//     directory: {
//       doc: '',
//       format: String,
//       default: seedsDirectory
//     },
//     loadExtensions: {
//       doc: 'Array of extensions to load',
//       format: 'Array',
//       default: ['.ts']
//     }
//   }
// })

// Load and validate database config
// const env = process.env.NODE_ENV ?? 'development'
// ConvictDatabaseConfig.loadFile(`${__dirname}/${env}_db.json`)
// ConvictDatabaseConfig.validate()

// TODO: Check if connection config is working
const Config: DatabaseConfig = ProductionDatabaseConfig
Config.migrations.directory = migrationsDirectory
Config.migrations.stub = `${migrationsDirectory}/migration.template`
Config.seeds.directory = seedsDirectory

export default Config
module.exports = Config
