/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
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

 --------------
 ******/

import { Request } from '@hapi/hapi'
import { consentDB } from '../../../../lib/db'
import { Consent } from '../../../../model/consent'
import { putConsentId } from '../../../../shared/requests'
const Crypto = require('crypto')
const Enum = require('@mojaloop/central-services-shared').Enum

export const isConsentRequestValid = function (request: Request, consent: Consent): boolean {
  const fspiopSource = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]

  return (consent && consent.initiatorId === fspiopSource)
}

export const genChallenge = async function (request: Request, consent: Consent): Promise<void> {
  // If there is a pre-existing challenge for the consent id
  // Make outgoing call to PUT consents/{ID}
  if (consent.credentialChallenge) {
    try {
      putConsentId(consent, request.headers)
    } catch (error) {
      console.warn(error)
    }
    return
  }
  // Challenge generation
  let challenge = ''
  Crypto.randomBytes(32, (err: Error, buf): void => {
    if (err) throw err
    challenge = buf.toString('base64')
  })

  // Update consent credentials
  consent.credentialType = 'FIDO'
  consent.credentialStatus = 'PENDING'
  consent.credentialChallenge = challenge

  // Update in database
  await consentDB.updateCredentials(consent)

  // Outgoing call to PUT consents/{ID}
  try {
    putConsentId(consent, request.headers)
  } catch (error) {
    console.warn(error)
  }
}
