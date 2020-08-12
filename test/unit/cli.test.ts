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

 * Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import Config from '~/shared/config'
import server from '~/server'
jest.mock('~/server')

describe('cli', (): void => {
  it('should use default port & host', async (): Promise<void> => {
    const cli = await import('~/cli')
    expect(cli).toBeDefined()
    expect(server.run).toHaveBeenCalledWith({
      PACKAGE: Config.PACKAGE,
      PARTICIPANT_ID: Config.PARTICIPANT_ID,
      PORT: Config.PORT,
      HOST: Config.HOST,
      DB_ENVIRONMENT: Config.DB_ENVIRONMENT,
      INSPECT: {
        DEPTH: 4,
        SHOW_HIDDEN: false,
        COLOR: true
      },
      DATABASE: {
        ACQUIRE_TIMEOUT_MILLIS: 30000,
        CREATE_RETRY_INTERVAL_MILLIS: 200,
        CREATE_TIMEOUT_MILLIS: 30000,
        DEBUG: false,
        DESTROY_TIMEOUT_MILLIS: 5000,
        DIALECT: 'mysql',
        HOST: 'localhost',
        IDLE_TIMEOUT_MILLIS: 30000,
        PASSWORD: 'password',
        POOL_MAX_SIZE: 10,
        POOL_MIN_SIZE: 10,
        PORT: 3306,
        REAP_INTERVAL_MILLIS: 1000,
        SCHEMA: 'auth-service',
        USER: 'auth-service'
      },
      MIGRATIONS: {
        DISABLED: false,
        RUN_DATA_MIGRATIONS: true
      },
      _: []
    })
  })
})
