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

 - Raman Mangla <ramanmangla@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import { Consent } from '../model/consent'
import { Scope } from '../model/scope'
import { consentDB, scopeDB } from '~/model/db'
import { verifySignature } from '~/domain/challenge'
import {
  putAuthorizationErrorRequest,
  DatabaseError,
  MissingScopeError,
  InactiveOrMissingCredentialError,
  PayloadNotPendingError,
  InvalidSignatureError,
  SignatureVerificationError
} from '~/domain/errors'
import { logger } from '~/shared/logger'

import {
  AuthPayload,
  isPayloadPending,
  hasActiveCredentialForPayload,
  hasMatchingScopeForPayload
} from './auth-payload'

// this function is outdated.
// TODO: this function needs to handle a POST /thirdpartyRequests/verifications
//       payload and send a PUT /thirdpartyRequests/verifications/{ID} callback
//       to the source DFSP
export async function validateAndVerifySignature (
  payload: AuthPayload,
  transactionRequestId: string,
  participantId: string
): Promise<void> {
  try {
    // Validate incoming payload status
    if (!isPayloadPending(payload)) {
      throw new PayloadNotPendingError(payload.consentId)
    }

    let consent: Consent

    // Check if consent exists and retrieve consent data
    try {
      consent = await consentDB.retrieve(payload.consentId)
      console.log('consent', consent)
    } catch (error) {
      logger.push({ error }).error('Could not retrieve consent')
      throw new DatabaseError(payload.consentId)
    }

    let consentScopes: Scope[]

    // Retrieve scopes for the consent
    try {
      consentScopes = await scopeDB.retrieveAll(payload.consentId)
    } catch (error) {
      logger.push({ error }).error('Could not retrieve scope')
      throw new DatabaseError(payload.consentId)
    }

    if (!hasMatchingScopeForPayload(consentScopes, payload)) {
      throw new MissingScopeError(payload.consentId)
    }

    if (!hasActiveCredentialForPayload(consent)) {
      throw new InactiveOrMissingCredentialError(payload.consentId)
    }

    let isVerified: boolean
    try {
      // Challenge is a UTF-8 (Normalization Form C)
      // JSON string of the QuoteResponse object
      isVerified = verifySignature(
        payload.challenge,
        payload.value,
        consent.credentialPayload as string
      )
    } catch (error) {
      logger.push({ error }).error('Could not verify signature')
      throw new SignatureVerificationError(payload.consentId)
    }

    if (!isVerified) {
      throw new InvalidSignatureError(payload.consentId)
    }

    payload.status = 'VERIFIED'

    /*
    await thirdPartyRequest.putThirdpartyRequestsTransactionsAuthorizations(
      payload,
      transactionRequestId,
      participantId
    )
    */
  } catch (error) {
    logger.push({ error }).error('Outgoing PUT request not made for transaction authorizations')
    putAuthorizationErrorRequest(transactionRequestId, error, participantId)
  }
}
