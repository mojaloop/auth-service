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
 - Raman Mangla <ramanmangla@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
 * which will be addressed in the future in
 * ticket #354
 */

import crypto from 'crypto'
import { logger } from '~/shared/logger'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { canonicalize } from 'json-canonicalize'
import sha256 from 'crypto-js/sha256'

/**
 * Helper function to validate signatures using public key
 * @param challenge UTF-8 challenge string
 * @param signature Base64 signature string
 * @param publicKey PEM Base64 Public key string or KeyObject for verification
 *
 * Currently, the implementation focuses on RSA 2048 and ECDSA:secp256k1 keys.
 * Support for additional keys can be extended further.
 */
export function verifySignature (
  challenge: string,
  signature: string,
  publicKey: string | crypto.KeyObject): boolean {
  try {
    // Digest Algorithm
    const verifier: crypto.Verify = crypto.createVerify('SHA256')
    // Hashing the challenge string
    verifier.update(challenge)

    return verifier.verify(publicKey, signature, 'base64')
  } catch (error) {
    logger.push({ error }).error('Unable to verify signature')
    throw error
  }
}

export function deriveChallenge (consentsPostRequest: tpAPI.Schemas.ConsentsPostRequestAUTH): string {
  const rawChallenge = {
    consentId: consentsPostRequest.consentId,
    scopes: consentsPostRequest.scopes
  }

  const RFC8785String = canonicalize(rawChallenge)
  return sha256(RFC8785String).toString()
}
