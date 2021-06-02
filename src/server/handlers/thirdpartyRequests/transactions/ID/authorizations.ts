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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'

import { Context } from '~/server/plugins'
import { validateAndVerifySignature } from '~/domain/authorizations'
import { AuthPayload } from '~/domain/auth-payload'

/*
 * The HTTP request `POST /thirdpartyRequests/transactions/{ID}/authorizations`
 * is used to authorize the PISP transaction identified by {ID}.
 * The `switch` uses it to verify the user's signature on
 * the quote using the associated Consent's public key.
 * The response is sent using outgoing request
 * `PUT /thirdpartyRequests/transactions/{ID}/authorizations`.
 */
export function post (
  _context: Context,
  request: Request,
  h: ResponseToolkit): ResponseObject {
  // Validate and process asynchronously - don't await on promise to resolve
  validateAndVerifySignature(
    request.payload as AuthPayload,
    request.params.ID,
    request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
  )

  // Return a 202 (Accepted) acknowledgement in the meantime
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  post,
  validateAndVerifySignature
}
