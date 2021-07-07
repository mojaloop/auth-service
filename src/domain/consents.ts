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
import { Consent, ConsentCredential } from '../model/consent'
import { logger } from '~/shared/logger'
import { convertThirdpartyScopesToDatabaseScope } from './scopes'
import {
  DatabaseError,
  InvalidSignatureError,
  SignatureVerificationError,
  putConsentError
} from './errors'
import { thirdPartyRequest } from '~/domain/requests'
import {
  retrieveValidConsent,
  updateConsentCredential,
  buildConsentsIDPutResponseVerifiedBody
} from '~/domain/consents/ID'
import { verifySignature } from '~/domain/challenge'
import { CredentialStatusEnum } from '~/model/consent/consent'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import * as fido from '~/domain/fido-credential'
/**
 * Builds internal Consent and Scope objects from request payload
 * Stores the objects in the database
 * @param request request received from switch
 */
export async function createAndStoreConsent (
  consentId: string,
  initiatorId: string,
  participantId: string,
  thirdpartyScopes: tpAPI.Schemas.Scope[],
  credential: tpAPI.Schemas.SignedCredential
): Promise<void> {
  // validate FIDO credential attestation
  if (!fido.validate(credential.payload)) {
    throw new SignatureVerificationError(consentId)
  }
  // TODO: store properly whole credential or only credential.payload.id ?
  const consent: Consent = {
    id: consentId,
    initiatorId,
    participantId,
    status: 'ACTIVE',
    credentialType: 'FIDO',
    credentialId: credential.payload.id,
    attestationObject: credential.payload.response.attestationObject,
    clientDataJSON: credential.payload.response.clientDataJSON
  }

  const scopes: ModelScope[] = convertThirdpartyScopesToDatabaseScope(thirdpartyScopes, consentId)

  try {
    await insertConsentWithScopes(consent, scopes)
  } catch (error) {
    logger.push({ error }).error('Error: Unable to store consent and scopes')
    throw new DatabaseError(consent.id)
  }
}

export interface UpdateCredentialRequest {
  credential: {
    id: string;
    payload: string;
    // When Updating the credential, only a status of `PENDING` is allowed
    status: CredentialStatusEnum.PENDING;
    challenge: {
      signature: string;
      payload: string;
    };
  };
}

// TODO: check with diagrams do we need this code - PISP vs AUTH interfaces and flows for `/consents` resource
export async function validateAndUpdateConsent (
  consentId: string,
  request: UpdateCredentialRequest,
  destinationParticipantId: string): Promise<void> {
  const {
    credential: {
      challenge: {
        signature,
        payload: challenge
      },
      payload: publicKey,
      id: requestCredentialId
    }
  } = request

  try {
    const consent: Consent = await retrieveValidConsent(consentId, challenge)
    let verifyResult: boolean

    // Use a nested try-catch to convert verifySignature errors to mojaloop
    // accepted errors
    try {
      verifyResult = verifySignature(challenge, signature, publicKey)
    } catch (error) {
      logger.push({ error }).error('Error: Signature validity was not determined.')
      throw new SignatureVerificationError(consentId)
    }

    // If signature is invalid for given key and challenge
    if (!verifyResult) {
      throw new InvalidSignatureError(consentId)
    }

    const credential: ConsentCredential = {
      credentialType: 'FIDO',
      credentialChallenge: challenge,
      credentialId: requestCredentialId,
      credentialStatus: CredentialStatusEnum.VERIFIED,
      credentialPayload: publicKey
    }
    await updateConsentCredential(consent, credential)

    const consentBody = await buildConsentsIDPutResponseVerifiedBody(consent)
    await thirdPartyRequest
      .putConsents(
        consent.id,
        consentBody,
        destinationParticipantId
      )
  } catch (error) {
    logger.push({ error }).error('Error: Outgoing PUT consents/{ID} call not made')
    await putConsentError(consentId, error, destinationParticipantId)
  }
}
