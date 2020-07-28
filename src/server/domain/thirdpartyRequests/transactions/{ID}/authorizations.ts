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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import { Consent } from '../../../../../model/consent'
import { Scope } from '../../../../../model/scope'

/*
 * Interface for incoming payload
 */
export interface AuthPayload {
  consentId: string;
  sourceAccountId: string;
  status: 'PENDING' | 'VERIFIED';
  challenge: string;
  value: string;
}

/*
 * Domain function to validate payload status
 */
export function isPayloadPending (payload: AuthPayload): boolean {
  return payload.status === 'PENDING'
}

/*
 * Domain function to check for existence of an active Consent key
 */
export function hasActiveCredentialForPayload (consent: Consent): boolean {
  return (consent.credentialStatus === 'ACTIVE' &&
    consent.credentialPayload !== null)
}

/*
 * Domain function to check for matching Consent scope
 */
export function hasMatchingScopeForPayload (
  consentScopes: Scope[],
  payload: AuthPayload): boolean {
  // Check if any scope matches
  for (const scope of consentScopes) {
    if (scope.accountId === payload.sourceAccountId) {
      return true
    }
  }

  return false
}
