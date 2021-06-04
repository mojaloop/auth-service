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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'

import { logger } from '~/shared/logger'
import { Context } from '~/server/plugins'
import { createAndStoreConsent } from '~/domain/consents'
import { putConsentError } from '~/domain/errors'

/** The HTTP request `POST /consents` is used to create a consent object.
 * Called by `DFSP` after the successful creation and
 * validation of a consentRequest.
 */
export async function post (
  _context: Context,
  request: Request,
  h: ResponseToolkit): Promise<ResponseObject> {
  // TOOD: validate which case we have here: PISP or AUTH - maybe change api definitions...
  const payload: tpAPI.Schemas.ConsentsPostRequestAUTH = request.payload as tpAPI.Schemas.ConsentsPostRequestAUTH
  const { consentId /*, credential */ } = payload
  const initiatorId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
  const participantId = request.headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  // Asynchronously deals with creation and storing of consents and scope
  setImmediate(async (): Promise<void> => {
    try {
      await createAndStoreConsent(
        consentId,
        initiatorId,
        participantId,
        payload.scopes
        // TODO: payload.credential validation
      )
    } catch (error) {
      logger.push(error).error('Error: Unable to create/store consent')
      await putConsentError(consentId, error, participantId)
    }
  })

  // Return Success code informing source: request received
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  post
}
