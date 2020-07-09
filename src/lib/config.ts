/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
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
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Ahan Gupta <ahangupta.96@gmail.com>
 --------------
 ******/

import convict from 'convict'
import Config from '../../config/default.json'

const RC = convict(Config)

export const config = convict({
  PORT: RC.get('PORT') as number,
  RUN_MIGRATIONS: !RC.get('MIGRATIONS').DISABLED,
  RUN_DATA_MIGRATIONS: RC.get('MIGRATIONS').RUN_DATA_MIGRATIONS as boolean,
  DATABASE: {
    client: RC.get('DATABASE').DIALECT as string,
    connection: {
      host: (RC.get('DATABASE').HOST as string).replace(/\/$/, ''),
      port: RC.get('DATABASE').PORT as number,
      user: RC.get('DATABASE').USER as string,
      password: RC.get('DATABASE').PASSWORD as string,
      database: RC.get('DATABASE').SCHEMA as string,
      timezone: 'UTC'
    },
    pool: {
      // minimum size
      min: RC.get('DATABASE').POOL_MIN_SIZE as number,
      // maximum size
      max: RC.get('DATABASE').POOL_MAX_SIZE as number,
      // acquire promises are rejected after this many milliseconds
      // if a resource cannot be acquired
      acquireTimeoutMillis: RC.get('DATABASE').ACQUIRE_TIMEOUT_MILLIS as number,
      // create operations are cancelled after this many milliseconds
      // if a resource cannot be acquired
      createTimeoutMillis: RC.get('DATABASE').CREATE_TIMEOUT_MILLIS as number,
      // destroy operations are awaited for at most this many milliseconds
      // new resources will be created after this timeout
      destroyTimeoutMillis: RC.get('DATABASE').DESTROY_TIMEOUT_MILLIS as number,
      // free resouces are destroyed after this many milliseconds
      idleTimeoutMillis: RC.get('DATABASE').IDLE_TIMEOUT_MILLIS as number,
      // how often to check for idle resources to destroy
      reapIntervalMillis: RC.get('DATABASE').REAP_INTERVAL_MILLIS as number,
      // long long to idle after failed create before trying again
      createRetryIntervalMillis: RC.get('DATABASE').CREATE_RETRY_INTERVAL_MILLIS as number
      // ping: function (conn, cb) { conn.query('SELECT 1', cb) }
    },
    debug: RC.get('DATABASE').DEBUG as boolean
  }
})
