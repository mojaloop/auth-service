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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import { consentDB } from '~/lib/db'
import { Consent } from '~/model/consent'
import { logger } from '~/shared/logger'
import { PatchConsentsRequest } from '@mojaloop/sdk-standard-components'
import { DatabaseError, InvalidConsentStatusError } from '~/domain/errors'

/**
 * Revoke status of consent object, update in the database
 * and return consent
 */
export async function revokeConsentStatus (
  consent: Consent): Promise<Consent> {
  if (consent.status === 'REVOKED') {
    logger.push({ consent }).log('Previously revoked consent was asked to be revoked')
    return consent
  }
  // Protects against invalid consent status types
  if (consent.status !== 'ACTIVE') {
    logger.push({ consent }).error('Invalid Consent Status')
    throw new InvalidConsentStatusError(consent.id)
  }

  consent.status = 'REVOKED'
  consent.revokedAt = (new Date()).toISOString()

  try {
    await consentDB.update(consent)
  } catch (error) {
    logger.push({ consent }).error('consentDB failed to update consent')
    throw new DatabaseError(consent.id)
  }

  return consent
}

/**
 * Generate outgoing PATCH consent/{id}/revoke request body
 */
export function generatePatchRevokedConsentRequest (
  consent: Consent
): PatchConsentsRequest {
  if (consent.status !== 'REVOKED') {
    throw new Error('Attempting to generate request for non-revoked consent!')
  }

  const requestBody: PatchConsentsRequest = {
    status: 'REVOKED',
    revokedAt: consent.revokedAt as string
  }
  return requestBody
}
