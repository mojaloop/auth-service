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

 - Ahan Gupta <ahangupta@google.com>

 --------------
 ******/
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Consent } from '../../../model/consent'
import { Logger } from '@mojaloop/central-services-logger'
import { retrieveValidConsent, updateConsentCredential, putConsents, ConsentCredential, checkCredentialStatus } from '../../../domain/consents/{ID}'
import { IncorrectChallengeError, IncorrectStatusError } from '../../../domain/errors'
import { verifySignature } from '../../../lib/challenge'
import { NotFoundError } from '../../../model/errors'

export async function retrieveUpdateAndPutConsent (id: string, challenge: string, credentialStatus: string, signature: string, publicKey: string, requestCredentialId: string, request: Request): Promise<void> {
  let consent: Consent
  try {
    consent = await retrieveValidConsent(id, challenge)
    /* Checks if incoming credential status is of the correct form */
    await checkCredentialStatus(credentialStatus, id)
    try {
      if (!verifySignature(challenge, signature, publicKey)) {
        Logger.push({ consentId: id })
        Logger.error('Invalid Challenge')
        /* TODO, make outbound call to PUT consents/{ID}/error to be addressed in ticket number 355 */
        return
      }
      const credential: ConsentCredential = {
        credentialId: requestCredentialId,
        credentialStatus: 'ACTIVE',
        credentialPayload: publicKey
      }
      await updateConsentCredential(consent, credential)
      /* Outbound PUT consents/{ID} call */
      putConsents(consent, signature, publicKey, request)
    } catch (error) {
      Logger.push(error)
      Logger.error('Error: Outgoing call with challenge credential NOT made to PUT consents/' + id)
      /* TODO, make outbound call to PUT consents/{ID}/error to be addressed in ticket number 355 */
    }
  } catch (error) {
    if (error instanceof IncorrectChallengeError || error instanceof IncorrectStatusError || error instanceof NotFoundError) {
      Logger.push(error)
      /* TODO, make outbound call to PUT consents/{ID}/error to be addressed in ticket number 355 */
    }
    Logger.push(error)
    Logger.error('Error in retrieving consent.')
  }
}

export default async function put (request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const id = request.params.id
  const requestPayload = request.payload
  const [signature, publicKey, challenge, requestCredentialId, credentialStatus] = [
    requestPayload.credential.challenge.signature,
    request.payload.credential.payload,
    request.payload.credential.challenge.payload,
    request.payload.credential.id,
    request.payload.credential.status
  ]
  retrieveUpdateAndPutConsent(id, challenge, credentialStatus, signature, publicKey, requestCredentialId, request)
  return h.response().code(202)
}
