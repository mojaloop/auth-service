/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing
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

import { consentDB } from '~/lib/db'
import { Consent, ConsentCredential } from '~/model/consent'
import SDKStandardComponents from '@mojaloop/sdk-standard-components'
import { ExternalScope } from '~/lib/scopes'

/**
 * Assigns credentials to given consent object and updates in the database
 * Returns updated consent object
 */
export async function updateConsentCredential (
  consent: Consent,
  credential: ConsentCredential): Promise<Consent> {
  // Update consent credentials
  consent.credentialType = credential.credentialType
  consent.credentialStatus = credential.credentialStatus
  consent.credentialChallenge = credential.credentialChallenge
  if (credential.credentialPayload) { // if Payload is non-null
    consent.credentialPayload = credential.credentialPayload as string
  }

  // Update in database,
  // relying on database validation for any null or relational aspects.
  await consentDB.update(consent)
  return consent
}

/**
 * Builds body of outgoing request and makes PUT consents/{ID} call to server
 * @param consent Consent object with credential challenge, type and status
 * @param headers headers from PISP generate challenge request
 */
export async function generatePutConsentsRequest (
  consent: Consent,
  scopes: ExternalScope[]):
  Promise<SDKStandardComponents.PutConsentsRequest> {
  // Construct body of outgoing request
  const body: SDKStandardComponents.PutConsentsRequest = {
    requestId: consent.id,
    initiatorId: consent.initiatorId as string,
    participantId: consent.participantId as string,
    scopes,
    credential: {
      id: null,
      credentialType: consent.credentialType as 'FIDO',
      status: consent.credentialStatus as 'PENDING',
      challenge: {
        payload: consent.credentialChallenge as string,
        signature: null
      },
      payload: consent.credentialPayload || null
    }
  }
  return body
}
