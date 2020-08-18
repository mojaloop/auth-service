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
 - Ahan Gupta <ahangupta.96@gmail.com>
 --------------
 ******/
import { Consent } from '~/model/consent'
import { Scope } from '~/model/scope'
import { consentDB, scopeDB } from '~/lib/db'
import { IncorrectChallengeError, IncorrectStatusError } from '../errors'
import { PutConsentsRequest } from '@mojaloop/sdk-standard-components'
import { thirdPartyRequest } from '~/lib/requests'
import { Enum } from '@mojaloop/central-services-shared'
import { Request } from '@hapi/hapi'
import { ExternalScope, convertScopesToExternal } from '~/lib/scopes'

export interface ConsentCredential {
  credentialId: string;
  credentialStatus: 'ACTIVE';
  credentialPayload: string;
}

export async function retrieveValidConsent (
  consentId: string,
  requestChallenge: string): Promise<Consent> {
  const consent: Consent = await consentDB.retrieve(consentId)
  // if consent is revoked, we cannot proceed
  if (consent.status === 'REVOKED') {
    throw new IncorrectStatusError(consentId)
  }
  if (consent.credentialChallenge !== requestChallenge) {
    throw new IncorrectChallengeError(consentId)
  }
  return consent
}

export function checkCredentialStatus (
  credentialStatus: string,
  consentId: string): void {
  if (credentialStatus !== 'PENDING') {
    throw new IncorrectStatusError(consentId)
  }
}

/*
 * Updates the consent resource in the database with incoming request's
 * credential attributes.
 */
export async function updateConsentCredential (
  consent: Consent,
  credential: ConsentCredential): Promise<number> {
  consent.credentialId = credential.credentialId
  consent.credentialStatus = credential.credentialStatus
  consent.credentialPayload = credential.credentialPayload
  return consentDB.update(consent)
}

export async function buildConsentRequestBody (
  consent: Consent,
  signature: string,
  publicKey: string): Promise<PutConsentsRequest> {
  /* Retrieve the scopes pertinent to this consentId
   and populate the scopes accordingly. */
  const scopes: Scope[] = await scopeDB.retrieveAll(consent.id)
  const externalScopes: ExternalScope[] = convertScopesToExternal(scopes)
  // @ts-ignore
  const consentBody: PutConsentsRequest = {
    requestId: consent.id,
    scopes: externalScopes,
    initiatorId: consent.initiatorId as string,
    participantId: consent.participantId as string,
    credential: {
      id: consent.credentialId as string,
      credentialType: 'FIDO',
      status: 'ACTIVE',
      challenge: {
        payload: consent.credentialChallenge as string,
        signature: signature
      },
      payload: publicKey
    }
  }
  return consentBody
}

export async function putConsents (
  consent: Consent,
  signature: string,
  publicKey: string,
  request: Request): Promise<void> {
  /* Retrieve the scopes pertinent to this consentId
  and populate the scopes accordingly. */
  const consentBody: PutConsentsRequest = await buildConsentRequestBody(consent, signature, publicKey)
  const destParticipantId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
  thirdPartyRequest.putConsents(consent.id, consentBody, destParticipantId)
}
