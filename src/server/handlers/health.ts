/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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

import Shared from '@mojaloop/central-services-shared'
import { PACKAGE } from '../../shared/config'
import { Context } from '../plugins'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'

const healthCheck = new Shared.HealthCheck.HealthCheck(PACKAGE, [])

/**
 * Operations on /health
 */

/**
 * summary: Get Server
 * description: The HTTP request GET /health is used to return the current status of the API.
 * parameters:
 * produces: application/json
 * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
 */
export const get = async (_context: Context, _request: Request, h: ResponseToolkit): Promise<ResponseObject> => {
  return h.response(await healthCheck.getHealth()).code(200)
}

export default {
  get
}
