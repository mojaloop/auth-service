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
 - Kenneth Zeng <kkzeng@google.com>
 --------------
 ******/

import Convict from 'convict'
import DBConfig, { DatabaseConfig } from '~/../config/knexfile'
import PACKAGE from '../../package.json'

interface ServiceConfig {
  PORT: number;
  HOST: string;
  PARTICIPANT_ID: string;
  DATABASE?: DatabaseConfig;
  ENV: string;
  INSPECT: {
    DEPTH: number;
    SHOW_HIDDEN: boolean;
    COLOR: boolean;
  };
}

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

// Load and validate general config based on environment variable
const env = ConvictConfig.get('ENV')

ConvictConfig.loadFile(`${__dirname}/../../config/${env}.json`)
ConvictConfig.validate({ allowed: 'strict' })

// Extract simplified config from Convict object
const config: ServiceConfig = ConvictConfig.getProperties()

// Inject DBConfig into shared config
config.DATABASE = DBConfig

export default config
export {
  PACKAGE,
  ServiceConfig,
  DatabaseConfig
}
