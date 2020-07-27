/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
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

 - Ahan Gupta <ahangupta.96@gmail.com>

 --------------
 ******/

import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Consent } from '../../../model/consent'
import { Logger } from '@mojaloop/central-services-logger'
import { retrieveValidConsent, updateConsentCredential, putConsents, ConsentCredential, checkCredentialStatus } from '../../domain/consents/{ID}'
import { IncorrectChallengeError, IncorrectStatusError } from '../../domain/errors'
import { verifySignature } from '../../../lib/challenge'

export async function put (request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const id = request.params.id
  /* The incoming signature from the PISP. */
  const signature = request.payload.credential.challenge.signature
  /* The incoming public key from the PISP. */
  const publicKey = request.payload.credential.payload
  /* The incoming challenge from the PISP. */
  const challenge = request.payload.credential.challenge.payload
  /* The incoming credential id from the PISP. */
  const requestCredentialId = request.payload.credential.id
  /* The incoming credential status from the PISP. */
  const credentialStatus = request.payload.credential.status
  let consent: Consent

  try {
    consent = await retrieveValidConsent(id, challenge)
    /* Checks if incoming credential status is of the correct form */
    await checkCredentialStatus(credentialStatus, id)
  } catch (error) {
    if (error instanceof IncorrectChallengeError || error instanceof IncorrectStatusError) {
      Logger.push(error)
      return h.response().code(400)
    }
    Logger.push(error).error('Error in retrieving consent')
    throw error
  }

  setImmediate(async (): Promise<void> => {
    try {
      if (!verifySignature(challenge, signature, publicKey)) {
        Logger.push({ consentId: id }).error('Invalid Challenge')
        /* TODO, make outbound call to PUT consents/{ID}/error to be addressed in ticket number PUT_TICKET_HERE */
        return
      }
      const credential: ConsentCredential = {
        credentialId: requestCredentialId,
        credentialStatus: 'VERIFIED',
        credentialPayload: publicKey
      }
      await updateConsentCredential(consent, credential)

      /* Outbound PUT consents/{ID} call */
      putConsents(consent, signature, publicKey, request)
    } catch (error) {
      Logger.push(error).error('Error: Outgoing call with challenge credential NOT made to PUT consents/' + id)
      throw error
    }
  })

  return h.response().code(202)
}
