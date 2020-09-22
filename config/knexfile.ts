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

import Convict from 'convict'
import path from 'path'
import { DbConnectionFormat } from './custom-convict-formats'
const migrationsDirectory = path.join(__dirname, '../migrations')
const seedsDirectory = path.join(__dirname, '../seeds')

export interface DbConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  timezone: string;
}

export interface DbPool {
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

Convict.addFormat(DbConnectionFormat);

const ConvictDatabaseConfig = Convict<DatabaseConfig>({
  client: {
    doc: 'Which database client should we use',
    format: ['mysql', 'sqlite3'],
    default: 'mysql'
  },
  version: {
    doc: 'What database version should we use',
    format: String,
    default: '5.5'
  },
  useNullAsDefault: {
    doc: 'whether or not to use null for everything not specified',
    format: 'Boolean',
    default: false
  },
  connection: {
    doc: 'Connection object specifying properties like host, port, user etc.',
    format: DbConnectionFormat.name,
    default: {
      host: 'localhost',
      port: 3306,
      user: 'auth-service',
      password: 'password',
      database: 'auth-service',
      timezone: 'UTC'
    },
  },
  pool: {
    min: {
      doc: 'Minimum number of connections',
      format: 'Number',
      default: 10
    },
    max: {
      doc: 'Maximum number of connections',
      format: 'Number',
      default: 10
    },
    acquireTimeoutMillis: {
      doc: 'How long knex should wait when acquiring a connection before throwing a timeout error',
      format: 'Number',
      default: 30000
    },
    createTimeoutMillis: {
      doc: 'How long knex should wait when establishing a new connection before throwing a timeout error',
      format: 'Number',
      default: 30000
    },
    destroyTimeoutMillis: {
      doc: 'How long knex should wait when destroying new connection before throwing a timeout error',
      format: 'Number',
      default: 5000
    },
    idleTimeoutMillis: {
      doc: 'How long a connection must sit idle in the pool and not be checked out before it is automatically closed',
      format: 'Number',
      default: 30000
    },
    reapIntervalMillis: {
      doc: 'How often to check for idle resources to destroy',
      format: 'Number',
      default: 1000
    },
    createRetryIntervalMillis: {
      doc: 'How long knex should wait before trying to create a connection again',
      format: 'Number',
      default: 200
    }
  },
  migrations: {
    directory: {
      doc: 'Migration directory',
      format: String,
      default: migrationsDirectory
    },
    tableName: {
      doc: 'Migration table name',
      format: String,
      default: 'auth-service'
    },
    stub: {
      doc: 'Where the stubs for migration are located',
      format: String,
      default: `${migrationsDirectory}/migration.template`
    },
    loadExtensions: {
      doc: 'Array of extensions to load',
      format: 'Array',
      default: ['.ts']
    }
  },
  seeds: {
    directory: {
      doc: 'Seeds directory',
      format: String,
      default: seedsDirectory
    },
    loadExtensions: {
      doc: 'Array of extensions to load',
      format: 'Array',
      default: ['.ts']
    }
  }
})

const env = process.env.NODE_ENV ?? 'production'
const dbConfigFile = `${__dirname}/${env}_db.json`
ConvictDatabaseConfig.loadFile(dbConfigFile)
ConvictDatabaseConfig.validate({ allowed: 'strict' })

const Config: DatabaseConfig = ConvictDatabaseConfig.getProperties()

// Inject directory paths here
Config.migrations.directory = migrationsDirectory
Config.migrations.stub = `${migrationsDirectory}/migration.template`
Config.seeds.directory = seedsDirectory

export default Config
module.exports = Config
