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

import { Scope } from '../model/scope'

/**
 * Interface for scope objects received from external source by handler
 * or to be sent in an outgoing call
 */
export interface ExternalScope {
  accountId: string;
  actions: string[];
}

/**
 * Reformats object structure, removing
 * scope & consent ids, and returns array of formatted scopes
 * @param scopes Scopes retrieved from database
 */
export function convertScopesToExternal (
  scopes: Scope[]): ExternalScope[] {
  // Dictionary of accountId to ExternalScope object
  const scopeDictionary = {}

  scopes.forEach((scope: Scope): void => {
    const accountId: string = scope.accountId

    if (!(accountId in scopeDictionary)) {
      // @ts-ignore
      scopeDictionary[accountId] = {
        accountId,
        actions: []
      }
    }
    // @ts-ignore
    scopeDictionary[accountId].actions.push(scope.action)
  })

  return Object.values(scopeDictionary)
}

/** Takes input of array of ExternalScope objects
 * Reformats and returns array of Scope objects
 * @param externalScopes Array of ExternalScope objects received
 * @param consentId Id of Consent to which scopes belong
 */
export function convertExternalToScope (
  externalScopes: ExternalScope[], consentId: string): Scope[] {
  const scopes: Scope[] = externalScopes.map(
    (element: ExternalScope): Scope[] =>
      element.actions.map((action: string): Scope => ({
        consentId,
        accountId: element.accountId,
        action
      })
      )
  ).flat()

  return scopes
}
