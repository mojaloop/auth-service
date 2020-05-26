#!./node_modules/.bin/ts-node

/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
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

 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import config from './shared/config'
import { handleCriticalEvents } from './shared/process'
import pkg from '../package.json'
import * as server from './server'
import { Command } from 'commander'

handleCriticalEvents()

const program = new Command(pkg.name)

program
  .version(pkg.version)
  .description('AuthService cli')
  .option('-p, --port <number>', 'listen on port', config.PORT.toString())
  .option('-H, --host <string>', 'listen on host', config.HOST)
  .parse(process.argv)

const serviceConfig = {
  PORT: program.port,
  HOST: program.host
}

server
  .setup(serviceConfig)
  .then(server.start)
