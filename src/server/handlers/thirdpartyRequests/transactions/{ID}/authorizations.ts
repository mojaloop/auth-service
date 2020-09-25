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
import { Context } from '~/server/plugins'
import { Consent } from '~/model/consent'
import { Scope } from '~/model/scope'
import { consentDB, scopeDB } from '~/lib/db'
import { NotFoundError } from '~/model/errors'
import { verifySignature } from '~/lib/challenge'
import { thirdPartyRequest } from '~/lib/requests'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import {
  AuthPayload,
  isPayloadPending,
  hasActiveCredentialForPayload,
  hasMatchingScopeForPayload,
  putErrorRequest
} from '~/domain/authorizations'

/*
 * TODO: There is a need to document and add Auth-Service
 * specific errors to Mojaloop.
 * The handler and unit test error values need to be changed
 * accordingly. This will be addressed in Ticket #355.
 * The following errors are just placeholders for now.
 */
const PAYLOAD_NOT_PENDING_ERROR = {
  code: '3100',
  description: 'Bad Request'
}
const CONSENT_NOT_FOUND_ERROR = {
  code: '2000',
  description: 'Not Found'
}
const SCOPE_NOT_FOUND_ERROR = {
  code: '2000',
  description: 'Forbidden'
}
const SERVER_ERROR = {
  code: '2000',
  description: 'Server Error'
}
const NO_ACTIVE_CREDS_ERROR = {
  code: '3100',
  description: 'No Active Credentials'
}
const INCORRECT_SIGNATURE_ERROR = {
  code: '3100',
  description: 'Incorrect Signature'
}

/*
 * Asynchronous POST handler helper function to
 * process everything in the background
 */
export async function validateAndVerifySignature (
  request: Request): Promise<void> {
  const payload: AuthPayload = request.payload as AuthPayload

  // Validate incoming payload status
  if (!isPayloadPending(payload)) {
    return putErrorRequest(
      request,
      PAYLOAD_NOT_PENDING_ERROR.code,
      PAYLOAD_NOT_PENDING_ERROR.description
    )
  }

  let consent: Consent

  // Check if consent exists and retrieve consent data
  try {
    consent = await consentDB.retrieve(payload.consentId)
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not retrieve consent')

    if (error instanceof NotFoundError) {
      return putErrorRequest(
        request,
        CONSENT_NOT_FOUND_ERROR.code,
        CONSENT_NOT_FOUND_ERROR.description
      )
    }

    return putErrorRequest(request, SERVER_ERROR.code, SERVER_ERROR.description)
  }

  let consentScopes: Scope[]

  // Retrieve scopes for the consent
  try {
    consentScopes = await scopeDB.retrieveAll(payload.consentId)
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not retrieve scope')

    if (error instanceof NotFoundError) {
      return putErrorRequest(
        request,
        SCOPE_NOT_FOUND_ERROR.code,
        SCOPE_NOT_FOUND_ERROR.description
      )
    }

    return putErrorRequest(request, SERVER_ERROR.code, SERVER_ERROR.description)
  }

  if (!hasMatchingScopeForPayload(consentScopes, payload)) {
    return putErrorRequest(
      request,
      SCOPE_NOT_FOUND_ERROR.code,
      SCOPE_NOT_FOUND_ERROR.description
    )
  }

  if (!hasActiveCredentialForPayload(consent)) {
    return putErrorRequest(
      request,
      NO_ACTIVE_CREDS_ERROR.code,
      NO_ACTIVE_CREDS_ERROR.description
    )
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
      return putErrorRequest(
        request,
        INCORRECT_SIGNATURE_ERROR.code,
        INCORRECT_SIGNATURE_ERROR.description
      )
    }

    payload.status = 'VERIFIED'
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not verify signature')

    return putErrorRequest(request, SERVER_ERROR.code, SERVER_ERROR.description)
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
  _context: Context,
  request: Request,
  h: ResponseToolkit): ResponseObject {
  // Validate and process asynchronously
  validateAndVerifySignature(request)

  // Return a 202 (Accepted) acknowledgement in the meantime
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  post
}
