/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 --------------
 ******/

import { Request } from '@hapi/hapi'
import { consentDB } from '../../lib/db'
import { Consent } from '../../model/consent'
import { Enum } from '@mojaloop/central-services-shared'
import Logger from '@mojaloop/central-services-logger'
import SDKStandardComponents from '@mojaloop/sdk-standard-components'

/**
 * Validates if the request is initiated by a valid source
 * Compares Consent object's initiator ID with source
 */
export function isConsentRequestInitiatedByValidSource (
  consent: Consent,
  request: Request): boolean {
  const fspiopSource = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
  return (consent?.initiatorId === fspiopSource)
}

/**
 * Revoke status of consent object, update in the database
 * and return consent
 */
export async function revokeConsentStatus (
  consent: Consent): Promise<Consent> {
  if (consent.status === 'REVOKED') {
    Logger.push('Previously revoked consent was asked to be revoked')
    return consent
  }
  consent.status = 'REVOKED'
  consent.revokedAt = (new Date()).toISOString()
  await consentDB.update(consent)
  return consent
}

/**
 * Generate outgoing PATCH consent/{id}/revoke request body
 */
export function generatePatchConsentRequest (
  consent: Consent
): SDKStandardComponents.PatchConsentsRequest {
  const requestBody: SDKStandardComponents.PatchConsentsRequest = {
    status: 'REVOKED',
    revokedAt: consent.revokedAt as string

  }
  return requestBody
}
