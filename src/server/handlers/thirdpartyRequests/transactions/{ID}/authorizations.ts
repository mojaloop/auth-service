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
import Enum from '@mojaloop/central-services-shared'
import { Consent } from '../../../../../model/consent'
import { Scope } from '../../../../../model/scope'
import { consentDB, scopeDB } from '../../../../../lib/db'
import { NotFoundError } from '../../../../../model/errors'
import { verifySignature } from '../../../../../lib/challenge'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import {
  AuthPayload,
  hasNullFields,
  hasCorrectStatus,
  hasActiveConsentKey,
  hasMatchingScope
} from '../../../../domain/thirdpartyRequests/transactions/{ID}/authorizations'

/*
 * The HTTP request `POST /thirdpartyRequests/transactions/{ID}/authorizations`
 * is used to authorize the PISP transaction identified by {ID}.
 * The Switch uses it to verify the user's signature on
 * the quote using the associated Consent's public key.
 * The response is sent using outgoing request
 * `PUT /thirdpartyRequests/transactions/{ID}/authorizations`.
 */
export async function post (
  request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  // TODO: request validation for headers, source and
  // payload structure (non existent/extra fields)
  // TODO: use JOI for these 2 validations?
  // Or Is request validation done internally?

  const payload: AuthPayload = request.payload as AuthPayload

  // Validate against payload null fields
  if (hasNullFields(payload)) {
    return h.response().code(Enum.Http.ReturnCodes.BADREQUEST.CODE)
  }

  // Validate incoming status
  if (!hasCorrectStatus(payload)) {
    return h.response().code(Enum.Http.ReturnCodes.BADREQUEST.CODE)
  }

  let consent: Consent

  // Check if consent exists and retrieve consent data
  try {
    consent = await consentDB.retrieve(payload.consentId)
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not retrieve consent')

    if (error instanceof NotFoundError) {
      return h.response().code(Enum.Http.ReturnCodes.NOTFOUND.CODE)
    }

    return h.response().code(Enum.Http.ReturnCodes.BADREQUEST.CODE)
  }

  let consentScopes: Scope[]

  // Retrieve scopes for the consent
  try {
    consentScopes = await scopeDB.retrieveAll(payload.consentId)
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not retrieve scope')

    if (error instanceof NotFoundError) {
      return h.response().code(Enum.Http.ReturnCodes.NOTFOUND.CODE)
    }

    return h.response().code(Enum.Http.ReturnCodes.BADREQUEST.CODE)
  }

  // Check if the request scope matches with the consent
  if (!hasMatchingScope(consentScopes, payload)) {
    return h.response().code(Enum.Http.ReturnCodes.NOTFOUND.CODE)
  }

  // Check for presence of an active key
  if (!hasActiveConsentKey(consent)) {
    //
    // TODO: Is this the correct error code for key not existing? or just 400
    //
    return h.response().code(Enum.Http.ReturnCodes.NOTFOUND.CODE)
  }

  // If everything checks out, delay processing to the next
  // event loop cycle and return successful acknowledgement
  // of a correct request
  setImmediate((): void => {
    try {
      // TODO: Is quote object format UTF8 string or is conversion required?
      // Verify signature
      const isVerified = verifySignature(
        payload.challenge,
        payload.value,
        consent.credentialPayload as string
      )

      if (isVerified) {
        payload.status = 'VERIFIED'
      }

      // TODO: Check what to do if verification fails: leave status as PENDING?

      // TODO: PUT request to switch
    } catch (error) {
      Logger.push(error)
      Logger.error('Could not verify signature')

      // TODO: Inform Switch that there is some problem on server side or
      // Should this just throw an error?
    }
  })

  // Request acknowledgement: received and processing it
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}
