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

import rc from 'rc'
import parse from 'parse-strings-in-object'
import Config from '../../config/default.json'
import Package from '../../package.json'
export interface ServiceConfig {
  // package.json
  PACKAGE: object;

  // ../server.ts
  PORT: number;
  HOST: string;

  // inspect.ts
  INSPECT?: {
    DEPTH?: number;
    SHOW_HIDDEN?: boolean;
    COLOR?: boolean;
  };
}

const RC = parse(rc('AS', Config)) as ServiceConfig

export default {
  ...RC,
  PACKAGE: Package
}
