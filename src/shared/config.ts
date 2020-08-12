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
 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

// import rc from 'rc'
// import parse from 'parse-strings-in-object'
// import Config from '../../config/default.json'
import PACKAGE from '../../package.json'

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

export interface ServiceConfig {
  ENV: string;
  PORT: number;
  HOST: string;
  PARTICIPANT_ID: string;

  DATABASE?: {
    client: string;
    version?: string;
    useNullAsDefault?: boolean;
    connection: DbConnection | string;
    pool?: DbPool;

    migrations?: {
      directory: string;
      tableName: string;
      stub: string;
      loadExtensions: string[];
    };

    seeds?: {
      directory: string;
      loadExtensions: string[];
    };
  };

  INSPECT: {
    DEPTH: number;
    SHOW_HIDDEN: boolean;
    COLOR: boolean;
  };
}

// const RC = parse(rc('AS', Config)) as ServiceConfig

export {
  PACKAGE
}
