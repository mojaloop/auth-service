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
 - Kevin Leyow <kevin.leyow@modusbox.com>
 --------------
 ******/

import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'

import { logger } from '~/shared/logger'
import inspect from '~/shared/inspect'

/** The HTTP request `POST /consents` is used to create a consent object.
 *  Called by `DFSP` to register a Consent object.
 */
export async function post (
  _context: unknown,
  _request: Request,
  h: ResponseToolkit): Promise<ResponseObject> {
  // const payload: tpAPI.Schemas.ConsentsPostRequest = request.payload as tpAPI.Schemas.ConsentsPostRequestAUTH
  // const consentId = payload.consentId
  // const initiatorId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
  // The auth-service is now the authoritative source for the Consent object.
  // The auth-service's fspId is retrieved from the destination header.
  // const participantId = request.headers[Enum.Http.Headers.FSPIOP.DESTINATION]

  setImmediate(async (): Promise<void> => {
    try {
      // TODO: 1) auth-service needs to check signature against challenge.
      //       2) send a POST /participants/CONSENT/{ID} to the ALS and receive
      //          a PUT /participants/CONSENT/{ID}
      //       3) store the consent object and finally send back a
      //          PUT /consents/{ID} request. Wooo...state machine
    } catch (error) {
      // the model catches all planned, catches unplanned errors,
      // handles callbacks and also rethrows the error to stop the state machine
      logger.info(`Error running RegisterConsentModel : ${inspect(error)}`)
    }
  })

  // safe to return a 202 response
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  post
}
