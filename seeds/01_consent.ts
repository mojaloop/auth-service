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

export const consents = [
  {
    id: '123',
    status: 'ACTIVE',
    initiatorId: 'PISPA',
    participantId: 'DFSPA',
    credentialId: null,
    credentialType: null,
    credentialStatus: null,
    credentialPayload: null,
    credentialChallenge: null,
    revokedAt: null
  },
  {
    id: '124',
    status: 'ACTIVE',
    initiatorId: 'PISPB',
    participantId: 'DFSPA',
    credentialId: '9876',
    credentialType: 'FIDO',
    credentialStatus: 'PENDING',
    credentialPayload: null,
    credentialChallenge: 'string_representing_challenge_a',
    revokedAt: null
  },
  {
    id: '125',
    status: 'ACTIVE',
    initiatorId: 'PISPC',
    participantId: 'DFSPA',
    credentialId: '9875',
    credentialType: 'FIDO',
    credentialStatus: 'VERIFIED',
    credentialPayload: 'string_representing_public_key_a',
    credentialChallenge: 'string_representing_challenge_b',
    revokedAt: null
  },
  {
    id: '126',
    status: 'REVOKED',
    initiatorId: 'PISPC',
    participantId: 'DFSPA',
    credentialId: '9875',
    credentialType: 'FIDO',
    credentialStatus: 'VERIFIED',
    credentialPayload: 'string_representing_public_key_a',
    credentialChallenge: 'string_representing_challenge_b',
    revokedAt: '2011-10-05T14:48:00.000Z'
  },
  {
    id: '127',
    status: 'REVOKED',
    initiatorId: 'PISPA',
    participantId: 'DFSPA',
    credentialId: null,
    credentialType: null,
    credentialStatus: null,
    credentialPayload: null,
    credentialChallenge: null,
    revokedAt: '2020-08-19T05:44:18.843Z'
  }
]

export function seed (knex: Knex): Promise<Knex.QueryBuilder<number[]>> {
  return knex('Consent').del()
    .then(() => knex('Consent').insert(consents))
}
