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
 * Flag to ignore BDD testing, which will be dealt
 * with in a later ticket
 */

import util from 'util'
import crypto from 'crypto'
import { Logger } from '@mojaloop/central-services-logger'

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

/*
 * Helper function to validate signatures using public key
 */
export async function verifySign (challenge: string, signature: string, key: string): Promise<boolean> {
  // const challengeBuffer = Buffer.from(challenge, 'base64')
  // const signatureBuffer = Buffer.from(signature, 'base64')

  // return crypto.verify(signAlgorithm, challengeBuffer, key, signatureBuffer)
  // const verify = crypto.createVerify('RSA-SHA256')
  // verify.update(challenge, 'utf8')
  // return verify.verify(key, signature)

  const verifier: crypto.Verify = crypto.createVerify('sha256')

  verifier.update(challenge)

  return verifier.verify(key, signature, 'base64')
}
