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

 - Paweł Marzec <pawel.marzec@modusbox.com>
 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import Convict from 'convict'
import PACKAGE from '../../package.json'
import path from 'path'

const migrationsDirectory = path.join(__dirname, '../../migrations')
const seedsDirectory = path.join(__dirname, '../../seeds')

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

interface DatabaseConfig {
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

interface ServiceConfig {
  SHOULD_USE_TEST_DATABASE: boolean;
  PORT: number;
  HOST: string;
  PARTICIPANT_ID: string;
  DATABASE?: DatabaseConfig;

  INSPECT: {
    DEPTH: number;
    SHOW_HIDDEN: boolean;
    COLOR: boolean;
  };
}

const MySQLConfig = Convict<DatabaseConfig>({
  client: {
    doc: 'Database client name.',
    format: String,
    default: 'mysql'
  },
  version: {
    doc: 'Database client version.',
    format: String,
    default: '5.5'
  },
  connection: {
    host: {
      doc: 'Database connection host.',
      format: String,
      default: 'localhost'
    },
    port: {
      doc: 'The port to bind.',
      format: 'port',
      default: 3306
    },
    user: {
      doc: 'Database user name.',
      format: String,
      default: 'auth-service'
    },
    password: {
      doc: 'Database user password.',
      format: String,
      default: 'password'
    },
    database: {
      doc: 'Database name.',
      format: String,
      default: 'auth-service'
    },
    timezone: {
      doc: 'Database timezone.',
      format: String,
      default: 'UTC'
    }
  },
  pool: {
    min: {
      doc: 'Minimum size.',
      format: Number,
      default: 10
    },
    max: {
      doc: 'Maximum size.',
      format: Number,
      default: 10
    },
    acquireTimeoutMillis: {
      doc: 'Unacquired promises are rejected after these many ms.',
      format: Number,
      default: 30000
    },
    createTimeoutMillis: {
      doc: 'Unacquired create operations are rejected after these many ms.',
      format: Number,
      default: 30000
    },
    destroyTimeoutMillis: {
      doc: 'Unacquired destory operations are rejected after these many ms.',
      format: Number,
      default: 5000
    },
    idleTimeoutMillis: {
      doc: 'Free resources are destroyed after these many ms.',
      format: Number,
      default: 30000
    },
    reapIntervalMillis: {
      doc: 'How often to check for idle resources to destroy.',
      format: Number,
      default: 1000
    },
    createRetryIntervalMillis: {
      doc: 'Long idle after fialed create before trying again.',
      format: Number,
      default: 200
    }
  },
  migrations: {
    directory: {
      doc: 'Migrations directory path.',
      format: String,
      default: migrationsDirectory
    },
    stub: {
      doc: 'Migrations file stub,',
      format: String,
      default: `${migrationsDirectory}/migration.template`
    },
    tableName: {
      doc: 'Migrations table name.',
      format: String,
      default: 'auth-service'
    },
    loadExtensions: {
      doc: 'File Extension for migrations.',
      format: Array,
      default: ['.ts']
    }
  },
  seeds: {
    directory: {
      doc: 'Seeds directory path.',
      format: String,
      default: seedsDirectory
    },
    loadExtensions: {
      doc: 'File Extension for seeds.',
      format: Array, // Check array elements?
      default: ['.ts']
    }
  }
})

const SQLiteConfig = Convict<DatabaseConfig>({
  client: {
    doc: 'Database client name.',
    format: String,
    default: 'mysql'
  },
  connection: {
    doc: 'Database type.',
    format: String,
    default: ':memory:'
  },
  useNullAsDefault: {
    doc: 'Boolean for whether to use Null as default value',
    format: Boolean,
    default: true
  },
  migrations: {
    directory: {
      doc: 'Migrations directory path.',
      format: String,
      default: migrationsDirectory
    },
    tableName: {
      doc: 'Migrations table name.',
      format: String,
      default: 'auth-service'
    },
    loadExtensions: {
      doc: 'File Extension for migrations.',
      format: Array,
      default: ['.ts']
    }
  },
  seeds: {
    directory: {
      doc: 'Seeds directory path.',
      format: String,
      default: seedsDirectory
    },
    loadExtensions: {
      doc: 'File Extension for seeds.',
      format: Array, // Check array elements?
      default: ['.ts']
    }
  }
})

const ConvictConfig = Convict<ServiceConfig>({
  SHOULD_USE_TEST_DATABASE: {
    doc: 'Should we use sqlite (unit tests only)',
    format: 'Boolean',
    default: false
  },
  HOST: {
    doc: 'The Hostname/IP address to bind.',
    format: '*',
    default: '0.0.0.0',
    env: 'HOST',
    arg: 'host'
  },
  PORT: {
    doc: 'The port to bind.',
    format: 'port',
    default: 4004,
    env: 'PORT',
    arg: 'port'
  },
  PARTICIPANT_ID: {
    doc: 'Service ID for the Mojaloop network.',
    format: String,
    default: 'auth-service',
    env: 'PARTICIPANT_ID',
    arg: 'participantId'
  },
  INSPECT: {
    DEPTH: {
      doc: 'Inspection depth',
      format: 'nat',
      env: 'INSPECT_DEPTH',
      default: 4
    },
    SHOW_HIDDEN: {
      doc: 'Show hidden properties',
      format: 'Boolean',
      default: false
    },
    COLOR: {
      doc: 'Show colors in output',
      format: 'Boolean',
      default: true
    }
  }
})

// Load and validate database config
//TODO: change this name
const shouldUseTestDatabase = ConvictConfig.get('SHOULD_USE_TEST_DATABASE')

let DBConfig: Convict.Config<DatabaseConfig> = MySQLConfig
let dbConfigName = 'mysql'

if (shouldUseTestDatabase) {
  DBConfig = SQLiteConfig
  dbConfigName = 'sqlite'
}

DBConfig.loadFile(`${__dirname}/../../config/${dbConfigName}.json`)
DBConfig.validate({ allowed: 'strict' })

// Load and validate general config
ConvictConfig.loadFile(`${__dirname}/../../config/config.json`)
ConvictConfig.validate({ allowed: 'strict' })

// Extract simplified config from Convict object
const config: ServiceConfig = {
  SHOULD_USE_TEST_DATABASE: ConvictConfig.get('SHOULD_USE_TEST_DATABASE'),
  PORT: ConvictConfig.get('PORT'),
  HOST: ConvictConfig.get('HOST'),
  PARTICIPANT_ID: ConvictConfig.get('PARTICIPANT_ID'),
  DATABASE: DBConfig.getProperties(),
  INSPECT: {
    DEPTH: ConvictConfig.get('INSPECT.DEPTH'),
    SHOW_HIDDEN: ConvictConfig.get('INSPECT.SHOW_HIDDEN'),
    COLOR: ConvictConfig.get('INSPECT.COLOR')
  }
}

export default config
export {
  PACKAGE,
  ServiceConfig
}
