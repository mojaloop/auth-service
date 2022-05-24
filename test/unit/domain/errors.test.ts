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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import {
  IncorrectCredentialStatusError,
  IncorrectConsentStatusError,
  EmptyCredentialPayloadError,
  InvalidSignatureError,
  SignatureVerificationError,
  DatabaseError,
  PutRequestCreationError,
  PayloadNotPendingError,
  MissingScopeError,
  InactiveOrMissingCredentialError,
  ConsentError
} from '~/domain/errors'
import { v4 } from 'uuid'

interface Case {
  error: ConsentError
  code: string
}
describe('errors', () => {
  const consentId: string = v4()
  const cases: Case[] = [
    {
      error: new IncorrectCredentialStatusError(consentId),
      code: '6206'
    },
    {
      error: new IncorrectConsentStatusError(consentId),
      code: '6207'
    },
    {
      error: new EmptyCredentialPayloadError(consentId),
      code: '6208'
    },
    {
      error: new InvalidSignatureError(consentId),
      code: '6209'
    },
    {
      error: new SignatureVerificationError(consentId),
      code: '6210'
    },
    {
      error: new DatabaseError(consentId),
      code: '6211'
    },
    {
      error: new PutRequestCreationError(consentId),
      code: '6217'
    },
    {
      error: new PayloadNotPendingError(consentId),
      code: '6218'
    },
    {
      error: new MissingScopeError(consentId),
      code: '6129'
    },
    {
      error: new InactiveOrMissingCredentialError(consentId),
      code: '6120'
    }
  ]
  cases.forEach((c: Case) => {
    it(c.error.message, () => {
      expect(c.error.errorCode).toEqual(c.code)
    })
  })
})
