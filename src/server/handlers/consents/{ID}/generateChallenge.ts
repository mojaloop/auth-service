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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>

 --------------
 ******/
// eslint-disable-next-line max-len
import { updateConsentCredential, isConsentRequestInitiatedByValidSource, putConsentId, ConsentCredential } from '../../../../domain/consents/{ID}/generateChallenge'
import * as challenge from '../../../../lib/challenge'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { consentDB, scopeDB } from '../../../../lib/db'
import { Consent } from '../../../../model/consent'
import Logger from '@mojaloop/central-services-logger'
import { convertScopesToExternal } from '../../../../lib/scopes'
import { Scope } from '../../../../model/scope'

// Asynchronously deals with generating challenge, updating consent db
//  and making outgoing PUT consent/{ID} call
export async function postBackground (
  request: Request,
  consent: Consent,
  id: string
): Promise<void> {
  try {
    // If there is no pre-existing challenge for the consent id
    // Generate one and update database
    if (!consent.credentialChallenge) {
      // Challenge generation
      const challengeValue = await challenge.generate()

      // Updating credentials with generated challenge
      const credential: ConsentCredential = {
        credentialChallenge: challengeValue,
        credentialStatus: 'PENDING',
        credentialType: 'FIDO'
      }

      consent = await updateConsentCredential(consent, credential)
    }

    // Retrieve Scopes
    const scopesRetrieved: Scope[] = await scopeDB.retrieveAll(id)
    const scopes = convertScopesToExternal(scopesRetrieved)

    // Outgoing call to PUT consents/{ID}
    await putConsentId(consent, request, scopes)
  } catch (error) {
    Logger.push(error)
    // eslint-disable-next-line max-len
    Logger.error(`Error: Outgoing call with challenge credential NOT made to  PUT consent/${id}`)
    // TODO: Decide on error handling HERE -  dealt with in future ticket #355
  }
}

/** The HTTP request `POST /consents/{ID}/generateChallenge` is used to create a
 * credential for the given Consent object. The `{ID}` in the URI should
 * contain the `{ID}` that was used in the `POST /consents`.
 * Called by a `PISP`to request a challenge from the `auth-service`, which
 * will be returned to the PISP via `PUT /consents/{ID}`
 */
export async function post (
  request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const id = request.params.id

  // Fetch consent using ID
  let consent: Consent
  try {
    consent = await consentDB.retrieve(id)
  } catch (error) {
    // TODO: Error Handling dealt with in future ticket #355
    Logger.push(error)
    Logger.error('Error in retrieving consent')

    // If consent cannot be retrieved using given ID
    // Return 400 code
    return h.response().code(400)
  }

  // If consent is invalid, return 400 code
  if (!isConsentRequestInitiatedByValidSource(request, consent)) {
    return h.response().code(400)
  }

  // Asynchronously deals with generating challenge, updating consent db
  //  and making outgoing PUT consent/{ID} call
  postBackground(request, consent, id)
  // intentionally not await-ing we want to run it in background

  // Return Success code informing source: request received
  return h.response().code(202)
}
