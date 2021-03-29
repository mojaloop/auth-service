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

import { logger } from '~/shared/logger'
import { Enum } from '@mojaloop/central-services-shared'
import { Context } from '~/server/plugins'
// TODO: no importing Models here
// we should re-export from Domain if the interface is needed
import { Consent } from '~/model/consent'
import { Scope } from '~/model/scope'
// TODO: remove lib, refactor to shared
import { consentDB, scopeDB } from '~/lib/db'
import { verifySignature } from '~/lib/challenge'
import { thirdPartyRequest } from '~/lib/requests'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import {
  isMojaloopError,
  putAuthorizationErrorRequest,
  DatabaseError,
  MissingScopeError,
  InactiveOrMissingCredentialError,
  PayloadNotPendingError,
  InvalidSignatureError,
  SignatureVerificationError
} from '~/domain/errors'
import {
  AuthPayload,
  isPayloadPending,
  hasActiveCredentialForPayload,
  hasMatchingScopeForPayload
} from '~/domain/authorizations'

/*
 * Asynchronous POST handler helper function to
 * process everything in the background
 */
export async function validateAndVerifySignature (
  request: Request): Promise<void> {
  const payload: AuthPayload = request.payload as AuthPayload

  try {
    // Validate incoming payload status
    // TODO: can we validate this properly in swagger? otherwise keep it here.
    if (!isPayloadPending(payload)) {
      throw new PayloadNotPendingError(payload.consentId)
    }

    let consent: Consent

    // Check if consent exists and retrieve consent data
    try {
      // TODO: no access of models here- refactor to use domain
      consent = await consentDB.retrieve(payload.consentId)
    } catch (error) {
      logger.push({ error }).error('Could not retrieve consent')
      throw new DatabaseError(payload.consentId)
    }

    let consentScopes: Scope[]

    // Retrieve scopes for the consent
    try {
      // TODO: no access of models here- refactor to use domain
      consentScopes = await scopeDB.retrieveAll(payload.consentId)
    } catch (error) {
      logger.push({ error }).error('Could not retrieve scope')
      throw new DatabaseError(payload.consentId)
    }

    if (!hasMatchingScopeForPayload(consentScopes, payload)) {
      throw new MissingScopeError(payload.consentId)
    }

    if (!hasActiveCredentialForPayload(consent)) {
      throw new InactiveOrMissingCredentialError(payload.consentId)
    }

    
    let isVerified: boolean
    try {
      // Challenge is a UTF-8 (Normalization Form C)
      // JSON string of the QuoteResponse object
      
      // TODO: refactor and clean up... spaghetti code a little bit 
      isVerified = verifySignature(
        payload.challenge,
        payload.value,
        consent.credentialPayload as string
      )
    } catch (error) {
      logger.push({error}).error('Could not verify signature')
      throw new SignatureVerificationError(payload.consentId)
    }

    if (!isVerified) {
      throw new InvalidSignatureError(payload.consentId)
    }

    // TODO: use an enum
    payload.status = 'VERIFIED'

    // PUT request to switch to inform about verification
    await thirdPartyRequest.putThirdpartyRequestsTransactionsAuthorizations(
      payload,
      request.params.ID,
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
    )
  } catch (error) {
    logger.push({error}).error('Outgoing PUT request not made for transaction authorizations')
    // TODO: we need to return a PUT .../error for all types of errors
    // drop isMojaloopError
    if (isMojaloopError(error)) {
      const id = request.params.ID
      const destParticipantId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      putAuthorizationErrorRequest(id, error, destParticipantId)
    }
  }
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
  // TODO: use setImmediate here
  // Validate and process asynchronously
  validateAndVerifySignature(request)

  // Return a 202 (Accepted) acknowledgement in the meantime
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  post
}
