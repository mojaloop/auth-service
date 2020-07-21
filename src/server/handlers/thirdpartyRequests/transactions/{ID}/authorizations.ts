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
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Consent } from '../../../../../model/consent'
import { consentDB } from '../../../../../lib/db'
import { NotFoundError } from '../../../../../model/errors'

interface AuthPayload {
  consentId: string;
  sourceAccountId: string;
  status: string;
  challenge: string;
  value: string;
}

// @ts-ignore
export async function post (
  request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  // TODO: request validation for headers, source and
  // payload structure (non existent/extra fields)

  // Use Joi here?
  // Is request validation done internally?

  const payload: AuthPayload = request.payload as AuthPayload

  // Validate against null fields
  for (const key in payload) {
    if (payload[key as keyof AuthPayload] == null) {
      // Incorrect payload
      return h.response().code(400)
    }
  }

  // Validate incoming transaction status
  if (payload.status !== 'PENDING') {
    // Incorrect payload
    return h.response().code(400)
  }

  let consent: Consent

  // Check if consent exists and retrieve consent data
  try {
    consent = await consentDB.retrieve(payload.consentId)
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not retrieve consent')

    if (error instanceof NotFoundError) {
      return h.response().code(404)
    }

    return h.response().code(400)
  }

  // Check for presence of key, verified key status
  if (consent.credentialStatus === 'ACTIVE' && consent.credentialPayload !== null) {
    // TODO: Is this the correct error code? or just 400
    return h.response().code(401)
  }

  // TODO: Check if scope exists and matches out for the consent

  // If everything checks out, delay processing to the next
  // event loop cycle and return successful acknowledgement
  // of a correct request
  setImmediate((): void => {
    try {
      // Do any required conversions: check for any quote object format to UTF8 conversions
      // Verify signature
      // const isVerified = verifySign(payload.challenge, payload.value, consent.credentialPayload)

      // Check what to do if verification fails: leave status as PENDING?
      // if (isVerified) {
      //   payload.status = 'VERIFIED'
      // }
    } catch (error) {
      Logger.push(error)
      Logger.error('Could not verify signature')

      // TODO: Inform Switch that there is some problem on server side
      // Should this just be the PUT request or something else?
    }

    // TODO: PUT request to switch
  })

  // Request acknowledgement: received and processing it
  return h.response().code(202)
}
