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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import axios from 'axios'
// import { Consent } from '~/model/consent'

describe('server/handlers/consents', (): void => {
  it('Should return 202 (Accepted) status code',
    async (): Promise<void> => {
      // const consent: Consent = {
      //   id: '123'
      // }

      const scenariosURI = 'http://0.0.0.0:4004/consents'
      const body = {
        id: 'e3488c3a-a4f3-25a7-aa7a-fdc3994bb3ec',
        requestId: '179395e8-8dd7-16a0-99f9-0da8f0c51c7f',
        initiatorId: 'pispa',
        participantId: 'dfspa',
        scopes: [
          {
            scope: 'accounts.getBalance',
            accountId: 'dfspa.alice.1234'
          },
          {
            scope: 'accounts.transfer',
            accountId: 'dfspa.alice.1234'
          }
        ],
        credential: {
          id: '5678',
          type: 'FIDO',
          status: 'ACTIVE',
          challenge: {
            payload: 'base64(...)',
            signature: 'base64(...)'
          },
          payload: 'base64(...)'
        }
      }

      // fsioip encryption, signature, uri, http method
      // x forwarded for

      const headers = {
        date: new Date().toJSON(),
        'fspiop-source': 'third-party API',
        'fspiop-destination': 'auth-service'
      }

      // let response: AxiosResponse

      try {
        const response = await axios.post(scenariosURI, body, {
          headers: headers
        })

        expect(response.status).toEqual(202)
      } catch (err) {
        console.log(err.response)
      }
    }
  )
})
