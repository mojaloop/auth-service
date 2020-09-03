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

 - Paweł Marzec <pawel.marzec@modusbox.com>
 - Kenneth Zeng <kkzeng@google.com>
 --------------
 ******/

import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import Blip from 'blipp'
import { Server, ServerRoute, Util as HapiUtil, RequestQuery } from '@hapi/hapi'
import { Readable as StreamReadable } from 'stream'
import ErrorHandling from '@mojaloop/central-services-error-handling'
import { Util } from '@mojaloop/central-services-shared'
import Good from './good'
import OpenAPI from './openAPI'

async function register (server: Server): Promise<Server> {
  const openapiBackend = await OpenAPI.initialize()

  const plugins = [
    Util.Hapi.OpenapiBackendValidator,
    Good,
    openapiBackend,
    Inert,
    Vision,
    Blip,
    ErrorHandling,
    Util.Hapi.HapiEventPlugin,
    Util.Hapi.FSPIOPHeaderValidation
  ]

  await server.register(plugins)

  // use as a catch-all handler
  server.route({
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    path: '/{path*}',
    handler: (req, h): ServerRoute =>
      openapiBackend.options.openapi.handleRequest(
        {
          method: req.method,
          path: req.path,
          body: req.payload,
          query: req.query,
          headers: req.headers
        },
        req,
        h
      )
  })
  return server
}

// Context is required for OpenAPI
export interface Context {
  method: HapiUtil.HTTP_METHODS_PARTIAL_LOWERCASE;
  path: string;
  body: StreamReadable | Buffer | string | object;
  query: RequestQuery;
  headers: HapiUtil.Dictionary<string>;
}

export default {
  register
}
