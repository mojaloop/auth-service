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

import { consentDB, scopeDB } from '../lib/db'
import { Scope } from '../model/scope'
import { Consent } from '../model/consent'
import { logger } from '~/shared/logger'
import { convertExternalToScope, ExternalScope } from '../lib/scopes'
import { DatabaseError } from './errors'

/**
 * Builds internal Consent and Scope objects from request payload
 * Stores the objects in the database
 * @param request request received from switch
 */
export async function createAndStoreConsent (
  consentId: string,
  initiatorId: string,
  participantId: string,
  externalScopes: ExternalScope[]
): Promise<void> {
  const consent: Consent = {
    id: consentId,
    initiatorId,
    participantId,
    status: 'ACTIVE'
  }

  const scopes: Scope[] = convertExternalToScope(externalScopes, consentId)

  try {
    await consentDB.insert(consent)
    await scopeDB.insert(scopes)
  } catch (error) {
    logger.push({ error }).error('Error: Unable to store consent and scopes')
    throw new DatabaseError(consent.id)
  }
}
