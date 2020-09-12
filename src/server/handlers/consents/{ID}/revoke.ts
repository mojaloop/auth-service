/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
 * which will be addressed in the future in
 * ticket #354
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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 --------------
 ******/
import {
  generatePatchRevokedConsentRequest,
  revokeConsentStatus
} from '~/domain/consents/revoke'
import * as validators from '~/domain/validators'
import { Context } from '~/server/plugins'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import Logger from '@mojaloop/central-services-logger'
import { Enum } from '@mojaloop/central-services-shared'
import { consentDB } from '~/lib/db'
import { Consent } from '~/model/consent'
import { thirdPartyRequest } from '~/lib/requests'
import * as thisModule from './revoke'

/**
 * Asynchronously deals with validating request, revoking consent object
 * and send outgoing PATCH consent/{id}/revoke request to switch
 */
export async function validateRequestAndRevokeConsent (
  request: Request): Promise<void> {
  console.log('original func')

  const consentId = request.params.id

  try {
    // Fetch consent from database using ID
    let consent: Consent
    try {
      consent = await consentDB.retrieve(consentId)
    } catch (error) {
      Logger.push(error)
      Logger.error('Error in retrieving consent')

      // If consent cannot be retrieved using given ID, send PUT ...error back
      // TODO: Error Handling dealt with in future ticket #355
      throw (new Error('NotImplementedYetError'))
    }

    // If request is not intiated by valid source, send PUT ...error back
    if (!validators.isConsentRequestInitiatedByValidSource(consent, request)) {
      // TODO: Error Handling dealt with in future ticket #355
      throw (new Error('NotImplementedYetError'))
    }

    // If Consent is ACTIVE, revoke it and update database. If already revoked, leave it alone but don't throw an error.
    consent = await revokeConsentStatus(consent)

    // Outgoing call to PATCH consents/{ID}/revoke
    const requestBody = generatePatchRevokedConsentRequest(consent)
    await thirdPartyRequest.patchConsents(
      consent.id,
      requestBody,
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
    )
  } catch (error) {
    Logger.push(error)
    Logger.error(`Outgoing call NOT made to PUT consent/${consentId}/revoke`)
    // TODO: Decide on error handling HERE - dealt with in future ticket #355
    throw error
  }
}

/**
 * The HTTP request `POST /consents/{id}/revoke` is used to revoke a consent
 * object - Called by either a PISP or DFSP
 */
export async function post (
  _context: Context,
  request: Request,
  h: ResponseToolkit): Promise<ResponseObject> {
  console.log('revoke handler')

  // Asynchronously validate request and revoke consent
  thisModule.validateRequestAndRevokeConsent(request)

  // Return Success code informing source: request received
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  post
}
