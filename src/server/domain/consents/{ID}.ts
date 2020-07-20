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

 - Ahan Gupta <ahangupta.96@gmail.com>

 --------------
 ******/
import { Consent } from '../../../model/consent'
import { Scope } from '../../../model/scope'
import { consentDB, scopeDB } from '../../../lib/db'
import { IncorrectChallengeError } from '../errors'
import { ThirdpartyRequests, PutConsentsRequest, BaseRequestConfigType } from '@mojaloop/sdk-standard-components'
import { Enum } from '@mojaloop/central-services-shared'
import { logResponse } from '../../../shared/logger'
import { Request } from '@hapi/hapi'

export async function retrieveValidConsent (consentId: string, requestChallenge: string): Promise<Consent> {
  const consent: Consent = await consentDB.retrieve(consentId)
  if (consent.credentialChallenge !== requestChallenge) {
    throw new IncorrectChallengeError(consentId)
  }
  return consent
}

/**
 * Updates the consent resource in the database with incoming request's
 * credential attributes.
 * @param requestCredentialId incoming request's credential Id.
 * @param requestCredentialStatus incoming request's credential Status.
 * @param requestCredentialPayload incoming request's credential Payload.
 * @param consent Consent resource corresponding to incoming request's Consent Id.
 */
export async function updateConsentCredential (requestCredentialId: string, requestCredentialStatus: string,
  requestCredentialPayload: string, consent: Consent): Promise<number> {
  consent.credentialId = requestCredentialId
  consent.credentialStatus = requestCredentialStatus
  consent.credentialPayload = requestCredentialPayload
  return consentDB.updateCredentials(consent)
}

export async function putConsents (consent: Consent, signature: string, publicKey: string, request: Request): Promise<void> {
  const config: BaseRequestConfigType = {
    logger: logResponse,
    dfspId: request.headers[Enum.Http.Headers.FSPIOP.DESTINATION],
    jwsSign: true,
    tls: undefined
  }
  const requests = new ThirdpartyRequests(config)
  /* Retrieve the scopes pertinent to this consentId and populate the scopes accordingly. */
  const scopes: Scope[] = await scopeDB.retrieveAll(consent.id)
  const consentBody: PutConsentsRequest = {
    requestId: consent.id,
    initiatorId: consent.initiatorId as string,
    participantId: consent.participantId as string,
    scopes: scopes,
    credential: {
      id: consent.credentialId,
      credentialType: consent.credentialType,
      status: consent.credentialStatus,
      challenge: {
        payload: consent.credentialChallenge,
        signature: signature
      },
      payload: publicKey
    }
  }
  const destParticipantId = request.headers[Enum.HTTP.Headers.FSPIOP.SOURCE]
  requests.putConsents(consent.id, consentBody, destParticipantId)
}
