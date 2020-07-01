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

 - Ahan Gupta <ahangupta.96@gmail.com>

 --------------
 ******/

'use strict'
import * as Knex from 'knex'

const scopes = [
  {
    consentId: '123',
    action: 'accounts.getBalance',
    accountId: '12345-67890'
  },
  {
    consentId: '123',
    action: 'accounts.transfer',
    accountId: '12345-67890'
  },
  {
    consentId: '124',
    action: 'accounts.transfer',
    accountId: '21345-67890'
  }
]

exports.seed = function (knex: Knex): Knex.QueryBuilder<number[]> | Error {
  try {
    return knex('Scope').insert(scopes)
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return new Error('-1001')
    else {
      console.log(`Uploading seeds for scopes has failed with the following error: ${err}`)
      return new Error('-1000')
    }
  }
}
