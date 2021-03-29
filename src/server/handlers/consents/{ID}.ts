// TODO: rename this file {ID} is not a good name, and leftover from older library
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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Ahan Gupta <ahangupta@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Consent, ConsentCredential } from '~/model/consent'
import { logger } from '~/shared/logger'
import { Context } from '~/server/plugins'
import * as SDKStandardComponents from '@mojaloop/sdk-standard-components'
import { thirdPartyRequest } from '~/lib/requests'
// TODO: import as Domain to improve readability
import {
  retrieveValidConsent,
  updateConsentCredential,
  buildConsentRequestBody
} from '~/domain/consents/{ID}'
import { verifySignature } from '~/lib/challenge'
import { Enum } from '@mojaloop/central-services-shared'
// TODO: Dependency on models is not good here
import { CredentialStatusEnum } from '~/model/consent/consent'
import { 
  InvalidSignatureError, 
  SignatureVerificationError, 
  putConsentError, 
  isMojaloopError 
} from '~/domain/errors'

// TODO: grab interface from api-snippets
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

// TODO: need jsdoc for this function
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

  // TODO: can we do some complex validation in a different, easily testable function?
  // TODO: refactor business logic to domain...
  try {
    // TODO: this is not async. refactor to mojaloop async pattern
    const consent: Consent = await retrieveValidConsent(consentId, challenge)
    let verifyResult: boolean

    // Use a nested try-catch to convert verifySignature errors to mojaloop
    // accepted errors
    try {
      verifyResult = verifySignature(challenge, signature, publicKey)
    } catch (error) {
      logger.push({error}).error('Error: Signature validity was not determined.')
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
    // TODO: there is no setImmediate() here
    // TODO: add conventions: Domain.updateConsentCredential
    await updateConsentCredential(consent, credential)

    /* Outbound PUT consents/{ID} call */
    const consentBody: SDKStandardComponents.PutConsentsRequest = await buildConsentRequestBody(consent, signature, publicKey)
    await thirdPartyRequest
      .putConsents(
        consent.id,
        consentBody,
        destinationParticipantId
      )
  } catch (error) {
    logger.push({ error }).error('Error: Outgoing PUT consents/{ID} call not made')
    if(isMojaloopError(error)) {
      await putConsentError(consentId, error, destinationParticipantId)
    }
  }
}

export async function put (_context: Context, request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const consentId = request.params.ID
  const updateConsentRequest = request.payload as UpdateCredentialRequest
  // The DFSP we need to reply to
  const destinationParticipantId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]

  // Note: not awaiting promise here
  validateAndUpdateConsent(consentId, updateConsentRequest, destinationParticipantId)

  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  put
}
