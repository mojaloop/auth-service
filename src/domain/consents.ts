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

import { insertConsentWithScopes } from '../model/db'
import { ModelScope } from '../model/scope'
import { Consent } from '../model/consent'
import { logger } from '~/shared/logger'
import { convertThirdpartyScopesToDatabaseScope } from './scopes'
import {
  DatabaseError
} from './errors'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'

/**
 * Builds internal Consent and Scope objects from request payload
 * Stores the objects in the database
 * @param request request received from switch
 */
export async function createAndStoreConsent (
  consentId: string,
  participantId: string,
  thirdpartyScopes: tpAPI.Schemas.Scope[],
  credential: tpAPI.Schemas.SignedCredential,
  publicKey: string,
  credentialChallenge: string,
  credentialCounter: number

): Promise<void> {
  const consent: Consent = {
    id: consentId,
    participantId,
    status: 'VERIFIED',
    credentialType: 'FIDO',
    credentialPayload: publicKey,
    credentialChallenge: credentialChallenge,
    credentialCounter: credentialCounter,
    originalCredential: JSON.stringify(credential)
  }

  const scopes: ModelScope[] = convertThirdpartyScopesToDatabaseScope(thirdpartyScopes, consentId)

  try {
    await insertConsentWithScopes(consent, scopes)
  } catch (error) {
    logger.push({ error }).error('Error: Unable to store consent and scopes')
    throw new DatabaseError(consent.id)
  }
}
