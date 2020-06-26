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

const consents = [
    {
        id: "123",
        initiatorid: "PISPA",
        participantid: "DFSPA",
        credentialtype: null,
        credentialstatus: null,
        credentialpayload: null,
        credentialchallenge: null 
    },
    {
        id: "124",
        initiatorid: "PISPB",
        participantid: "DFSPA",
        credentialtype: "FIDO",
        credentialstatus: "PENDING",
        credentialpayload: null,
        credentialchallenge: "string_representing_challenge_a" 
    },
    {
        id: "125",
        initiatorid: "PISPC",
        participantid: "DFSPA",
        credentialtype: "FIDO",
        credentialstatus: "VERIFIED",
        credentialpayload: "string_representing_public_key_a",
        credentialchallenge: "string_representing_challenge_b"
    },
]

exports.seed = async function (knex: any, _: Promise<any>) {
    try {
        return knex('Consent').insert(consents)
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return -1001
        else {
            console.log(`Uploading seeds for consents has failed with the following error: ${err}`)
            return -1000
        }
    }
}
