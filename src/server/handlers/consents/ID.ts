/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
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
 - Ahan Gupta <ahangupta@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import { Context } from '~/server/plugins'
import { validateAndUpdateConsent, UpdateCredentialRequest } from '~/domain/consents'

export async function put (_context: Context, request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const consentId = request.params.ID
  const updateConsentRequest = request.payload as UpdateCredentialRequest
  // The DFSP we need to reply to
  const destinationParticipantId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]

  // Note: not awaiting promise here
  validateAndUpdateConsent(consentId, updateConsentRequest, destinationParticipantId)

  return h.response().code(Enum.Http.ReturnCodes.OK.CODE)
}

export default {
  put
}
