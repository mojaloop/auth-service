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

 - Paweł Marzec <<pawel.marzec@modusbox.com>>
 --------------
 ******/

import Config from './shared/config'
import ServiceServer from './server'
import { Command } from 'commander'

// handle script parameters
const program = new Command(Config.PACKAGE.name)
program
  .version(Config.PACKAGE.version)
  .description('auth-service cli')
  .option('-p, --port <number>', 'listen on port', Config.PORT.toString())
  .option('-H, --host <string>', 'listen on host', Config.HOST)
  .parse(process.argv)

// overload Config with script parameters
Config.PORT = program.port
Config.HOST = program.host

// setup & start @hapi server
ServiceServer.run(Config)
