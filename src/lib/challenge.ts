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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Raman Mangla <ramanmangla@google.com>

 --------------
 ******/

/* istanbul ignore file */

/*
 * This flag is to ignore BDD testing for model
 * which will be addressed in the future in
 * ticket #354
 */

import util from 'util'
import crypto from 'crypto'
import Logger from '@mojaloop/central-services-logger'

// Async promisified randomBytes function
const randomBytesAsync = util.promisify(crypto.randomBytes)

/**
 * Helper function which uses the crypto library to generate
 * a secure random challenge string (Base 64 encoding) of given size
 * @param size Integer value of how many bytes should generated, 32 by default
 */
export async function generate (size: number = 32): Promise<string> {
  try {
    const buf = await randomBytesAsync(Math.round(Math.abs(size)))
    return buf.toString('base64')
  } catch (error) {
    Logger.push(error).error('Unable to generate challenge string')
    throw error
  }
}

/**
 * Helper function to validate signatures using public key
 * @param challenge UTF-8 challenge string
 * @param signature Base64 sign string
 * @param publicKey PEM Base64 Public key string or KeyObject for verification
 *
 * Currently, the implementation focuses on RSA 2048 and ECDSA:secp256k1 keys.
 * Support for additional keys can be extended further.
 */
export function verifySign (
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
    Logger.push(error)
    Logger.error('Unable to verify signature')
    throw error
  }
}
