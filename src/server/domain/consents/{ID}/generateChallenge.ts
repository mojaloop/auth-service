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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>

 --------------
 ******/

import { Request } from '@hapi/hapi'
import { consentDB } from '../../../../lib/db'
import { Consent } from '../../../../model/consent'
import { promisify } from 'util'
import { randomBytes } from 'crypto'
import { Logger } from '@mojaloop/central-services-logger'
const Enum = require('@mojaloop/central-services-shared').Enum

/**
 * Validates whether generate challenge request is valid
 * by comparing consent ID sent matches with existing consent in table
 * and if source ID matches initiator ID
 * @param request: request received from PISP
 * @param consent: Consent object
 */
export const isConsentRequestValid = function (request: Request, consent: Consent): boolean {
  const fspiopSource = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]

  return (consent && consent.initiatorId === fspiopSource)
}

/**
 * Helper function which uses the crypto library to generate
 * a secure random challenge string (Base 64 encoding)
 */
export async function generateChallengeValue (): Promise<string> {
  const randBytes = promisify(randomBytes)
  try {
    const buf = await randBytes(32)
    return buf.toString('base64')
  } catch (error) {
    Logger.error('Unable to generate challenge string')
    throw error
  }
}

/**
 * Assigns credentials to given consent object and updates in the database
 * Returns updated consent object
 */
export async function updateCredential (consent: Consent, challenge: string, credentialType: string, credentialStatus: string): Consent {
  // Update consent credentials
  consent.credentialType = credentialType
  consent.credentialStatus = credentialStatus
  consent.credentialChallenge = challenge

  // Update in database
  await consentDB.updateCredentials(consent)
  return consent
}
