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

 - Paweł Marzec <pawel.marzec@modusbox.com>
 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Raman Mangla <ramanmangla@google.com>
 - Kenneth Zeng <kkzeng@google.com>
 --------------
 ******/

import Convict from 'convict'
import { DatabaseConfigScheme, DatabaseConfig } from './config-db'
import PACKAGE from '../../package.json'
import path from 'path'
import fs, { PathLike } from 'fs'
import { BaseRequestTLSConfig } from '@mojaloop/sdk-standard-components'

Convict.addFormat({
  name: 'string-array',
  validate: function (sources, _schema) {
    if (!Array.isArray(sources)) {
      throw new Error('must be of type Array')
    }

    sources.forEach((source) => {
      if (typeof source !== 'string') {
        throw new Error('Expected a string in array!')
      }
    })
  }
})

interface ServiceConfig {
  PORT: number
  HOST: string
  PARTICIPANT_ID: string
  DATABASE: DatabaseConfig
  ENV: string
  REQUEST_PROCESSING_TIMEOUT_SECONDS: number
  REDIS: {
    HOST: string
    PORT: number
    TIMEOUT: number
  }
  INSPECT: {
    DEPTH: number
    SHOW_HIDDEN: boolean
    COLOR: boolean
  }
  SHARED: {
    PEER_ENDPOINT: string
    ALS_ENDPOINT: string
    QUOTES_ENDPOINT?: string
    TRANSFERS_ENDPOINT?: string
    SERVICES_ENDPOINT?: string
    BULK_TRANSFERS_ENDPOINT?: string
    THIRDPARTY_REQUESTS_ENDPOINT?: string
    TRANSACTION_REQUEST_ENDPOINT?: string
    JWS_SIGN: boolean
    JWS_SIGNING_KEY: Buffer | string
    WSO2_AUTH: {
      staticToken: string
      tokenEndpoint: string
      clientKey: string
      clientSecret: string
      refreshSeconds: number
    }
    TLS: BaseRequestTLSConfig
  }
  DEMO_SKIP_VALIDATION_FOR_CREDENTIAL_IDS: Array<string>
}

export function getFileContent(path: PathLike): Buffer {
  if (!fs.existsSync(path)) {
    throw new Error("File doesn't exist")
  }
  return fs.readFileSync(path)
}

function getFileListContent(pathList: string): Buffer[] {
  return pathList.split(',').map((path): Buffer => getFileContent(path))
}

// TODO: Finish setting documentation, formats and env variables for config options.
const ConvictConfig = Convict<ServiceConfig>({
  ENV: {
    doc: 'The environment that the auth-service is running in',
    format: ['development', 'test', 'production', 'integration'],
    default: 'production',
    env: 'NODE_ENV'
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
  REQUEST_PROCESSING_TIMEOUT_SECONDS: {
    doc: 'The timeout for waiting for a response to a request',
    env: 'REQUEST_PROCESSING_TIMEOUT_SECONDS',
    default: 30
  },
  REDIS: {
    HOST: {
      doc: 'The Redis Hostname/IP address to connect.',
      format: '*',
      default: 'localhost',
      env: 'REDIS_HOST'
    },
    PORT: {
      doc: 'The Redis port to connect.',
      format: 'port',
      default: 6379,
      env: 'REDIS_PORT'
    },
    TIMEOUT: {
      doc: 'The Redis connection timeout',
      format: 'nat',
      default: 100,
      env: 'REDIS_TIMEOUT'
    }
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
      default: false,
      env: 'INSPECT_SHOW_HIDDEN'
    },
    COLOR: {
      doc: 'Show colors in output',
      format: 'Boolean',
      default: true,
      env: 'INSPECT_COLOR'
    }
  },
  SHARED: {
    PEER_ENDPOINT: '0.0.0.0:4003',
    ALS_ENDPOINT: '0.0.0.0:4002',
    QUOTES_ENDPOINT: '0.0.0.0:3002',
    TRANSFERS_ENDPOINT: '0.0.0.0:3000',
    SERVICES_ENDPOINT: '',
    BULK_TRANSFERS_ENDPOINT: '',
    THIRDPARTY_REQUESTS_ENDPOINT: '',
    TRANSACTION_REQUEST_ENDPOINT: '',
    JWS_SIGN: false,
    JWS_SIGNING_KEY: '',
    WSO2_AUTH: {
      staticToken: '',
      tokenEndpoint: '',
      clientKey: '',
      clientSecret: '',
      refreshSeconds: 60
    },
    TLS: {
      mutualTLS: {
        enabled: false
      },
      creds: {
        ca: '',
        cert: '',
        key: ''
      }
    }
  },
  DATABASE: DatabaseConfigScheme,
  DEMO_SKIP_VALIDATION_FOR_CREDENTIAL_IDS: {
    doc: 'For demo purposes only. Set a list of credentialIds you want to skip validation for.',
    format: 'string-array',
    default: [],
    env: 'DEMO_SKIP_VALIDATION_FOR_CREDENTIAL_IDS'
  }
})

// Load and validate general config based on environment variable
const env = ConvictConfig.get('ENV')
console.log('NODE_ENV:', env)
const configPath = path.resolve(__dirname, `../../config/${env}.json`)
// console.log('loading configuration from:', configPath)
ConvictConfig.loadFile(configPath)
ConvictConfig.validate({ allowed: 'strict' })

// Load file contents for keys and secrets
if (ConvictConfig.get('SHARED.JWS_SIGN')) {
  ConvictConfig.set(
    'SHARED.JWS_SIGNING_KEY',
    getFileContent(path.resolve(__dirname, '../../', ConvictConfig.get('SHARED').JWS_SIGNING_KEY as string))
  )
}

// Note: Have not seen these be comma seperated value strings. mimicking sdk-scheme-adapter for now
if (ConvictConfig.get('SHARED.TLS.mutualTLS.enabled')) {
  ConvictConfig.set(
    'SHARED.TLS.creds.ca',
    getFileListContent(path.resolve(__dirname, '../../', ConvictConfig.get('SHARED').TLS.creds.ca as string))
  )
  ConvictConfig.set(
    'SHARED.TLS.creds.cert',
    getFileListContent(path.resolve(__dirname, '../../', ConvictConfig.get('SHARED').TLS.creds.cert as string))
  )
  ConvictConfig.set(
    'SHARED.TLS.creds.key',
    getFileListContent(path.resolve(__dirname, '../../', ConvictConfig.get('SHARED').TLS.creds.key as string))
  )
}

// Extract simplified config from Convict object
const config: ServiceConfig = ConvictConfig.getProperties()

if (config.DEMO_SKIP_VALIDATION_FOR_CREDENTIAL_IDS.length > 0) {
  console.warn(
    'DEMO_SKIP_VALIDATION_FOR_CREDENTIAL_IDS set. This is for testing purposes only and should not be used in production.'
  )
}

export default config
export { PACKAGE, ServiceConfig }
