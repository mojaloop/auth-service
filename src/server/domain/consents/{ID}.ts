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
import { Consent } from '../../../model/consent'
import { consentDB } from '../../../lib/db'

export function isChallengeCorrect (consent: Consent, requestPayload: string): void {
  if (consent.credentialChallenge !== requestPayload) {
    throw new Error('Incorrect challenge')
  }
}

/**
 * Updates the consent resource in the database with incoming request's
 * credential attributes.
 * @param requestCredentialId incoming request's credential Id.
 * @param requestCredentialStatus incoming request's credential Status.
 * @param requestCredentialPayload incoming request's credential Payload.
 * @param consent Consent resource corresponding to incoming request's Consent Id.
 */
export async function saveCredential (requestCredentialId: string, requestCredentialStatus: string,
  requestCredentialPayload: string, consent: Consent): Promise<number> {
  consent.credentialId = requestCredentialId
  consent.credentialStatus = requestCredentialStatus
  consent.credentialPayload = requestCredentialPayload
  return consentDB.updateCredentials(consent)
}
