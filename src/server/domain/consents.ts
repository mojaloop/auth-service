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
import { consentDB, scopeDB } from '../../lib/db'
import { Scope } from '../../model/scope'
import { Consent } from '../../model/consent'
import { Logger } from '@mojaloop/central-services-logger'
import { Enum } from '@mojaloop/central-services-shared'
import { ExternalScope } from '../../lib/scopes'

/**
   * Validates whether request is valid
   * by comparing if source header matches participant ID
   * @param request: request received from switch
   */
export function isRequestValid (request: Request): boolean {
  const fspiopSource = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
  return (request.payload.participantId === fspiopSource)
}

export async function createAndStoreConsent (request: Request): Promise<void> {
  const payload = request.payload

  const consent: Consent = {
    id: request.payload.id,
    initiatorId: request.payload.initiatorId,
    participantId: request.payload.participantId
  }

  const scopesArray: Scope[] = []

  payload.scopes.forEach((element: ExternalScope): void => {
    const accountId = element.accountId
    element.actions.forEach((action: string): void => {
      const scope = {
        consentId: consent.id,
        accountId,
        action
      }
      scopesArray.push(scope)
    })
  })

  try {
    await consentDB.insert(consent)
    await scopeDB.insert(scopesArray)
  } catch (error) {
    Logger.push(error).error('Error: Unable to store consent and scopes')
    throw error
  }
}
