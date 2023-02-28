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

import path from 'path'

export interface DbConnection {
  filename?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  timezone?: string
}

export interface DbPool {
  min: number
  max: number
  acquireTimeoutMillis: number
  createTimeoutMillis: number
  destroyTimeoutMillis: number
  idleTimeoutMillis: number
  reapIntervalMillis: number
  createRetryIntervalMillis: number
}

export interface DatabaseConfig {
  ENV: string
  client: string
  version?: string
  useNullAsDefault?: boolean
  connection: DbConnection
  pool: DbPool

  migrations: {
    directory: string
    tableName: string
    stub?: string
    loadExtensions: string[]
  }

  seeds: {
    directory: string
    loadExtensions: string[]
  }
}

const migrationsDirectory = path.resolve(__dirname, '../../migrations')
const seedsDirectory = path.resolve(__dirname, '../../seeds')

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
    default: 'sqlite',
    env: 'DB_CLIENT'
  },
  version: {
    doc: 'What database version should we use',
    format: String,
    default: '5.5',
    env: 'DB_VERSION'
  },
  useNullAsDefault: {
    doc: 'whether or not to use null for everything not specified',
    format: Boolean,
    default: false,
    env: 'DB_USE_NULL_AS_DEFAULT'
  },
  connection: {
    filename: {
      doc: 'Database filename',
      format: String,
      default: null,
      env: 'DB_CONNECTION_FILENAME',
      nullable: true
    },
    host: {
      doc: 'Database host',
      format: String,
      default: null,
      env: 'DB_CONNECTION_HOST',
      nullable: true
    },
    port: {
      doc: 'Database port',
      format: Number,
      default: null,
      env: 'DB_CONNECTION_PORT',
      nullable: true
    },
    user: {
      doc: 'Database user',
      format: String,
      default: null,
      env: 'DB_CONNECTION_USER',
      nullable: true
    },
    password: {
      doc: 'Database password',
      format: String,
      default: null,
      env: 'DB_CONNECTION_PASSWORD',
      nullable: true
    },
    database: {
      doc: 'Database name',
      format: String,
      default: null,
      env: 'DB_CONNECTION_NAME',
      nullable: true
    },
    timezone: {
      doc: 'Database timezone',
      format: String,
      default: null,
      env: 'DB_CONNECTION_TIMEZONE',
      nullable: true
    }
  },
  pool: {
    min: {
      doc: 'The minimum number of connections in the connection pool',
      format: Number,
      default: 10,
      env: 'DB_POOL_MIN'
    },
    max: {
      doc: 'The maximum number of connections in the connection pool',
      format: Number,
      default: 10,
      env: 'DB_POOL_MAX'
    },
    acquireTimeoutMillis: {
      doc: 'Tarn library config. Acquire promises are rejected after this many milliseconds if a resource cannot be acquired',
      format: Number,
      default: 30000,
      env: 'DB_POOL_ACQUIRE_TIMEOUT_MILLIS'
    },
    createTimeoutMillis: {
      doc: 'Tarn library config. Create operations are cancelled after this many milliseconds if a resource cannot be acquired',
      format: Number,
      default: 30000,
      env: 'DB_POOL_CREATE_TIMEOUT_MILLIS'
    },
    destroyTimeoutMillis: {
      doc: 'Tarn library config. Destroy operations are awaited for at most this many milliseconds new resources will be created after this timeout',
      format: Number,
      default: 5000,
      env: 'DB_POOL_DESTROY_TIMEOUT_MILLIS'
    },
    idleTimeoutMillis: {
      doc: 'Tarn library config. Free resources are destroyed after this many milliseconds.',
      format: Number,
      default: 30000,
      env: 'DB_POOL_IDLE_TIMEOUT_MILLIS'
    },
    reapIntervalMillis: {
      doc: 'Tarn library config. How often to check for idle resources to destroy',
      format: Number,
      default: 1000,
      env: 'DB_POOL_REAP_INTERVAL_MILLIS'
    },
    createRetryIntervalMillis: {
      doc: 'Tarn library config. How long to idle after failed create before trying again',
      format: Number,
      default: 200,
      env: 'DB_POOL_CREATE_RETRY_INTERVAL_MILLIS'
    }
  },
  migrations: {
    directory: {
      doc: 'Migration directory',
      format: String,
      default: migrationsDirectory,
      env: 'DB_MIGRATION_DIRECTORY'
    },
    tableName: {
      doc: 'Migration table name',
      format: String,
      default: 'auth-service',
      env: 'DB_MIGRATION_TABLE_NAME'
    },
    stub: {
      doc: 'Where the stubs for migration are located',
      format: String,
      default: `${migrationsDirectory}/migration.template`,
      env: 'DB_MIGRATION_STUB_LOCATION'
    },
    loadExtensions: {
      doc: 'Array of extensions to load',
      format: Array,
      default: ['.js'],
      env: 'DB_MIGRATIONS_LOAD_EXTENSIONS'
    }
  },
  seeds: {
    directory: {
      doc: 'Seeds directory',
      format: String,
      default: seedsDirectory,
      env: 'DB_SEEDS_DIRECTORY'
    },
    loadExtensions: {
      doc: 'Array of extensions to load',
      format: Array,
      default: ['.js'],
      env: 'DB_SEEDS_LOAD_EXTENSIONS'
    }
  }
}
