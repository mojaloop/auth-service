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
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import Convict from 'convict'
import path from 'path'

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
  ENV: string;
  client: string;
  version?: string;
  useNullAsDefault?: boolean;
  connection: DbConnection | string;
  pool: DbPool;

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

export const DbConnectionFormat = {
  name: 'db-connection',
  validate: function (val: unknown): boolean {
    // String check - i.e. SQLite will use a string to specify connection in memory
    if (typeof val === 'string' || val instanceof String) return true

    //  Object check
    if (typeof val === 'object' && val) {
      const connection = val as DbConnection

      // Check that object is DbConnection and has DbConnection fields -
      // i.e. PG and MySQL use a DbConnection object to configure
      // Verify that all fields are filled AND they are the right format - presence + format check
      if (typeof connection.host !== 'string') {
        throw new Error('Mandatory field: \'host\' is missing or is in the wrong format')
      }

      if (typeof connection.port !== 'number') {
        throw new Error('Mandatory field: \'port\' is missing or is in the wrong format')
      }

      if (typeof connection.database !== 'string') {
        throw new Error('Mandatory field: \'database\' is missing or is in the wrong format')
      }

      if (typeof connection.user !== 'string') {
        throw new Error('Mandatory field: \'user\' is missing or is in the wrong format')
      }

      return true
    }

    throw new Error('Connection is not a string or a object conforming to the DbConnection interface')
  },
  coerce: function (val: unknown): DbConnection | string {
    if (typeof val === 'string' || val instanceof String) {
      return val as string
    }
    return val as DbConnection
  }
}

export const DbPoolFormat = {
  name: 'db-pool',
  validate: function (val: unknown): boolean {
    if (val == null || typeof val === 'undefined') {
      return true
    } else if (typeof val === 'object') {
      const pool = val as DbPool

      // Fields are allowed to be missing so only validate their format if the field is not undefined or null
      if (typeof pool.min !== 'number') {
        throw new Error('min is not a number')
      }

      if (typeof pool.max !== 'number') {
        throw new Error('max is not a number')
      }

      if (typeof pool.acquireTimeoutMillis !== 'number') {
        throw new Error('acquireTimeoutMillis is not a number')
      }

      if (typeof pool.createTimeoutMillis !== 'number') {
        throw new Error('createTimeoutMillis is not a number')
      }

      if (typeof pool.createRetryIntervalMillis !== 'number') {
        throw new Error('createRetryIntervalMillis is not a number')
      }

      if (typeof pool.reapIntervalMillis !== 'number') {
        throw new Error('reapIntervalMillis is not a number')
      }

      if (typeof pool.destroyTimeoutMillis !== 'number') {
        throw new Error('destroyTimeoutMillis is not a number')
      }

      if (typeof pool.idleTimeoutMillis !== 'number') {
        throw new Error('idleTimeoutMillis is not a number')
      }

      return true
    }
    throw new Error('Pool is not null or an object conforming to the DbPool interface.')
  },
  coerce: function (val: unknown): DbPool | undefined {
    if (val == null || typeof val === 'undefined') {
      return undefined
    }
    return val as DbPool
  }
}

const migrationsDirectory = path.resolve(__dirname, '../../migrations')
const seedsDirectory = path.resolve(__dirname, '../../seeds')

Convict.addFormat(DbConnectionFormat)
Convict.addFormat(DbPoolFormat)

export const DatabaseConfigScheme = {
  ENV: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test', 'integration'],
    default: 'production',
    env: 'NODE_ENV'
  },
  client: {
    doc: 'Which database client should we use',
    format: ['mysql', 'sqlite3'],
    default: 'sqlite'
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
    default: null
  },
  pool: {
    doc: 'Pool object specifying tarn pool properties',
    format: DbPoolFormat.name,
    default: null
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
}
