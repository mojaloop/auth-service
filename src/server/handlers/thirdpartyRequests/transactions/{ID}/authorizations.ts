/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
 * which will be addressed in the future in
 * ticket #354
 */

/*
 * There is a need to add Auth-Service specific errors
 * to the Mojaloop error codes and document them. The
 * handler and unit test error values need to be changed
 * accordingly. This will be addressed in Ticket #355.
 */

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

import Logger from '@mojaloop/central-services-logger'
import { Enum } from '@mojaloop/central-services-shared'
import { Consent } from '../../../../../model/consent'
import { Scope } from '../../../../../model/scope'
import { consentDB, scopeDB } from '../../../../../lib/db'
import { NotFoundError } from '../../../../../model/errors'
import { verifySignature } from '../../../../../lib/challenge'
import { thirdPartyRequest } from '../../../../../lib/requests'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import {
  AuthPayload,
  isPayloadPending,
  hasActiveCredentialForPayload,
  hasMatchingScopeForPayload,
  putErrorRequest
} from '../../../../../domain/authorizations'

/*
 * Asynchronous POST handler helper function to
 * process everything in the background
 */
export async function validateAndVerifySignature (
  request: Request): Promise<void> {
  const payload: AuthPayload = request.payload as AuthPayload

  // Validate incoming payload status
  if (!isPayloadPending(payload)) {
    return putErrorRequest(request, '3100', 'Bad Request')
  }

  let consent: Consent

  // Check if consent exists and retrieve consent data
  try {
    consent = await consentDB.retrieve(payload.consentId)
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not retrieve consent')

    if (error instanceof NotFoundError) {
      return putErrorRequest(request, '2000', 'Not Found')
    }

    return putErrorRequest(request, '2000', 'Server Error')
  }

  let consentScopes: Scope[]

  // Retrieve scopes for the consent
  try {
    consentScopes = await scopeDB.retrieveAll(payload.consentId)
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not retrieve scope')

    if (error instanceof NotFoundError) {
      return putErrorRequest(request, '2000', 'Forbidden')
    }

    return putErrorRequest(request, '2000', 'Server Error')
  }

  if (!hasMatchingScopeForPayload(consentScopes, payload)) {
    return putErrorRequest(request, '2000', 'Forbidden')
  }

  if (!hasActiveCredentialForPayload(consent)) {
    return putErrorRequest(request, '3100', 'Bad Request')
  }

  try {
    // Challenge is a UTF-8 (Normalization Form C)
    // JSON string of the QuoteResponse object
    const isVerified = verifySignature(
      payload.challenge,
      payload.value,
      consent.credentialPayload as string
    )

    if (!isVerified) {
      return putErrorRequest(request, '3100', 'Bad Request')
    }

    payload.status = 'VERIFIED'
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not verify signature')

    return putErrorRequest(request, '2000', 'Server Error')
  }

  // PUT request to switch to inform about verification
  await thirdPartyRequest.putThirdpartyRequestsTransactionsAuthorizations(
    payload,
    request.params.id,
    request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
  )
}

/*
 * The HTTP request `POST /thirdpartyRequests/transactions/{ID}/authorizations`
 * is used to authorize the PISP transaction identified by {ID}.
 * The `switch` uses it to verify the user's signature on
 * the quote using the associated Consent's public key.
 * The response is sent using outgoing request
 * `PUT /thirdpartyRequests/transactions/{ID}/authorizations`.
 */
export function post (
  request: Request,
  h: ResponseToolkit): ResponseObject {
  // Hapi-OpenAPI plugin validates the payload schema for
  // existence of properties and their types based on the
  // OpenAPI specification. It also ensures non-null values.

  // Validate and process asynchronously
  validateAndVerifySignature(request)

  // Return a 202 (Accepted) acknowledgement in the meantime
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}
