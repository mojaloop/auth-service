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

 - Ahan Gupta <ahangupta.96@gmail.com>
 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Kenneth Zeng <kkzeng@google.com>

 --------------
 ******/

'use strict'
import * as Knex from 'knex'
import { Consent } from '../src/model/consent/consent';


export const consents: Array<Consent> = [
  {
    id: '123',
    status: 'VERIFIED',
    participantId: 'DFSPA',
    credentialId: '9875',
    credentialType: 'FIDO',
    credentialPayload: 'string_representing_public_key_a',
    credentialChallenge: 'string_representing_challenge_b',
    credentialCounter: 4
  },
  {
    id: '124',
    status: 'REVOKED',
    participantId: 'DFSPA',
    credentialId: '9875',
    credentialType: 'FIDO',
    credentialPayload: 'string_representing_public_key_a',
    credentialChallenge: 'string_representing_challenge_b',
    credentialCounter: 4,
    revokedAt: '2011-10-05T14:48:00.000Z',
  }
]

export function seed (knex: Knex): Promise<Knex.QueryBuilder<number[]>> {
  return knex('Consent').del()
    .then(() => knex('Consent').insert(consents))
}
