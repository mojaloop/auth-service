/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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
import { genChallenge, isConsentRequestValid } from '../../../domain/consents/{ID}/generateChallenge'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { consentDB } from '../../../../lib/db'
import { Consent } from '../../../../model/consent'

/** The HTTP request `POST /consents/{ID}/generateChallenge` is used to create a
 * credential for the given Consent object. The `{ID}` in the URI should
 * contain the `{ID}` that was used in the `POST /consents`.
 * Called by a `PISP`to request a challenge from the `auth-service`, which
 * will be returned to the PISP via `PUT /consents/{ID}`
 */
export async function post (request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const id = request.params.id

  // Fetch consent using ID
  let consent: Consent = null
  try {
    consent = await consentDB.retrieve(id)
  } catch (error) {
    throw new Error('Invalid Consent Lookup')
  }

  // If consent is invalid, throw error
  if (!isConsentRequestValid(request, consent)) {
    throw new Error('400')
  }

  // Asynchronously generate challenge
  try {
    genChallenge(request, consent)
  } catch (error) {
    console.warn(error)
  }
  return h.response().code(202) // Suceess code
}
