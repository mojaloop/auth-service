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
 - Ahan Gupta <ahangupta@google.com>

 --------------
 ******/
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Consent, ConsentCredential } from '~/model/consent'
import { Logger } from '@mojaloop/central-services-logger'
import * as SDKStandardComponents from '@mojaloop/sdk-standard-components'
import { thirdPartyRequest } from '~/lib/requests'
import {
  retrieveValidConsent,
  updateConsentCredential,
  checkCredentialStatus,
  buildConsentRequestBody
} from '~/domain/consents/{ID}'
import { verifySignature } from '~/lib/challenge'
import { Enum } from '@mojaloop/central-services-shared'
import { CredentialStatusEnum } from '~/model/consent/consent'

interface PutConsentRequest {
  credential: {
    id: string;
    payload: string;
    // TODO: should this be an enum? Or a string constant?
    // Maybe we should leave it as a string as we're checking against an enum?
    status: string;
    challenge: {
      signature: string;
      payload: string;
    };
  };
}

export async function retrieveUpdateAndPutConsent (
  request: Request): Promise<void> {
  const id = request.params.id

  const {
    credential: {
      challenge: {
        signature,
        payload: challenge
      },
      payload: publicKey,
      id: requestCredentialId,
      status: credentialStatus
    }
  } = request.payload as PutConsentRequest

  try {
    const consent: Consent = await retrieveValidConsent(id, challenge)
    /* Checks if incoming credential status is of the correct form */
    checkCredentialStatus(credentialStatus, id)

    const verifyResult = verifySignature(challenge, signature, publicKey)
    if (!verifyResult) {
      // TODO: domain specific error
      throw new Error('Invalid challenge')
    }

    const credential: ConsentCredential = {
      credentialType: 'FIDO',
      credentialChallenge: challenge,
      credentialId: requestCredentialId,
      credentialStatus: CredentialStatusEnum.ACTIVE,
      credentialPayload: publicKey
    }
    await updateConsentCredential(consent, credential)

    /* Outbound PUT consents/{ID} call */
    const consentBody: SDKStandardComponents.PutConsentsRequest = await buildConsentRequestBody(consent, signature, publicKey)
    await thirdPartyRequest
      .putConsents(
        consent.id,
        consentBody,
        request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
      )
  } catch (error) {
    // TODO: common outbound call here
    Logger.push(error)
    Logger.error('Error in retrieving consent.')
    /* TODO, make outbound call to PUT consents/{ID}/error
    to be addressed in ticket number 355 */
  }
}

export async function put (
  request: Request,
  h: ResponseToolkit): Promise<ResponseObject> {
  // Note: not awaiting promise here
  retrieveUpdateAndPutConsent(request)
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}
