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
import { ThirdpartyRequests } from '@mojaloop/sdk-standard-components'
import { Consent } from '../model/consent'
import { Scope } from '../model/scope'
import { scopeDb } from '../lib/db'
import { logResponse } from './logger'
import { Enum } from '@mojaloop/central-services-shared'

/**
 * Builds body of outgoing request and makes PUT consents/{ID} call to server
 * @param consent Consent object with credential challenge, type and status
 * @param headers headers from PISP generate challenge request
 */

// TODO: Figure out return type of putConsents() and assign type accordingly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function putConsentId (consent: Consent, headers): Promise<any> {
  // Instantiate ThirdPartyRequests Object
  const config = {
    logger: logResponse,
    dfspId: headers[Enum.Http.Headers.FSPIOP.SOURCE],
    jwsSign: true,
    tls: undefined

  }

  const thirdPartyRequest = new ThirdpartyRequests(config)

  // Switch SOURCE and DESTINATION in headers
  const destinationId = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  // eslint-disable-next-line max-len
  headers[Enum.Http.Headers.FSPIOP.SOURCE] = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  headers[Enum.Http.Headers.FSPIOP.DESTINATION] = destinationId

  // Retrieve scopes
  const scopesRetrieved: Scope[] = await scopeDb.retrieve(consent.id)

  // Reformat scopes to match what external handler wants
  const temp = {}

  scopesRetrieved.forEach((scope: Scope): void => {
    const accountId: string = scope.accountId
    if (Object.prototype.hasOwnProperty.call(temp, scope.accountId)) {
      temp[accountId].actions.push(scope.action)
    } else {
      temp[accountId] = {
        accountId,
        actions: [scope.action]
      }
    }
  })

  const scopes: Scope[] = Object.values(temp)

  // Construct body of outgoing request
  const body = {
    requestId: consent.id,
    initiatorId: consent.initiatorId as string,
    participantId: consent.participantId as string,
    scopes,
    credential: {
      id: null,
      credentialType: consent.credentialType,
      status: consent.credentialStatus,
      challenge: {
        payload: consent.credentialChallenge,
        signature: null
      },
      payload: null
    }
  }
  // Use sdk-standard-components library to send request
  return thirdPartyRequest.putConsents(consent.id, body, destinationId)
}
