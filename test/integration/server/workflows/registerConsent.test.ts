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

 - Kenneth Zeng <kkzeng@google.com>
 --------------
 ******/

import axios from 'axios'
import headers from '~/../test/data/headers.json'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { closeKnexConnection } from '~/model/db'
import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'
const atob = require('atob')


// test data from Lewis
// here is how the client should convert ArrayBuffer to base64 strings using Browser's btoa function
// take a look on `reduce` version
// https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
// in nodejs we use only Buffer.from([...]).toString('base64')
const consentsPostRequestAUTH: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  consentId: '76059a0a-684f-4002-a880-b01159afe119',
  scopes: [
    {
      accountId: 'dfspa.username.5678',
      actions: [
        'accounts.transfer'
      ]
    },
  ],
  // todo: make note in api that we are converting all array buffers to base64 encoded strings
  credential: {
    credentialType: 'FIDO',
    status: 'PENDING',
    payload: {
      id: atob('HskU2gw4np09IUtYNHnxMM696jJHqvccUdBmd0xP6XEWwH0xLei1PUzDJCM19SZ3A2Ex0fNLw0nc2hrIlFnAtw'),
      rawId: atob('HskU2gw4np09IUtYNHnxMM696jJHqvccUdBmd0xP6XEWwH0xLei1PUzDJCM19SZ3A2Ex0fNLw0nc2hrIlFnAtw=='),
      response: {
        clientDataJSON: Buffer.from(
          [123, 34, 116, 121,
            112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 99, 114, 101, 97, 116,
            101, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 89, 122, 82, 104,
            90, 71, 70, 105, 89, 106, 77, 122, 90, 84, 107, 122, 77, 68, 90, 105, 77, 68, 77, 52, 77,
            68, 103, 52, 77, 84, 77, 121, 89, 87, 90, 109, 89, 50, 82, 108, 78, 84, 85, 50, 89, 122,
            85, 119, 90, 68, 103, 121, 90, 106, 89, 119, 77, 50, 89, 48, 78, 122, 99, 120, 77, 87,
            69, 53, 78, 84, 69, 119, 89, 109, 89, 122, 89, 109, 86, 108, 90, 106, 90, 107, 78, 103,
            34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47,
            108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 52, 50, 49, 56, 49, 34, 44, 34, 99, 114,
            111, 115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 125]
        ).toString('base64'),
        attestationObject: Buffer.from([163, 99, 102, 109, 116,
          102, 112, 97, 99, 107, 101, 100, 103, 97, 116, 116, 83, 116, 109, 116, 163, 99, 97, 108,
          103, 38, 99, 115, 105, 103, 88, 71, 48, 69, 2, 33, 0, 221, 137, 12, 243, 211, 177, 239,
          248, 228, 65, 210, 169, 42, 68, 38, 40, 168, 147, 155, 39, 179, 225, 234, 116, 151, 33,
          223, 232, 44, 47, 79, 85, 2, 32, 33, 237, 110, 217, 133, 0, 188, 128, 194, 36, 131, 7, 0,
          249, 46, 43, 66, 70, 135, 160, 121, 207, 244, 9, 36, 162, 22, 138, 10, 235, 128, 235, 99,
          120, 53, 99, 129, 89, 2, 193, 48, 130, 2, 189, 48, 130, 1, 165, 160, 3, 2, 1, 2, 2, 4,
          11, 5, 205, 83, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 48, 46, 49, 44,
          48, 42, 6, 3, 85, 4, 3, 19, 35, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 82, 111,
          111, 116, 32, 67, 65, 32, 83, 101, 114, 105, 97, 108, 32, 52, 53, 55, 50, 48, 48, 54, 51,
          49, 48, 32, 23, 13, 49, 52, 48, 56, 48, 49, 48, 48, 48, 48, 48, 48, 90, 24, 15, 50, 48,
          53, 48, 48, 57, 48, 52, 48, 48, 48, 48, 48, 48, 90, 48, 110, 49, 11, 48, 9, 6, 3, 85, 4,
          6, 19, 2, 83, 69, 49, 18, 48, 16, 6, 3, 85, 4, 10, 12, 9, 89, 117, 98, 105, 99, 111, 32,
          65, 66, 49, 34, 48, 32, 6, 3, 85, 4, 11, 12, 25, 65, 117, 116, 104, 101, 110, 116, 105,
          99, 97, 116, 111, 114, 32, 65, 116, 116, 101, 115, 116, 97, 116, 105, 111, 110, 49, 39,
          48, 37, 6, 3, 85, 4, 3, 12, 30, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 69, 69,
          32, 83, 101, 114, 105, 97, 108, 32, 49, 56, 52, 57, 50, 57, 54, 49, 57, 48, 89, 48, 19,
          6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134, 72, 206, 61, 3, 1, 7, 3, 66, 0, 4, 33,
          26, 111, 177, 181, 137, 37, 203, 10, 193, 24, 95, 124, 42, 227, 168, 180, 136, 16, 20,
          121, 177, 30, 255, 245, 85, 224, 125, 151, 81, 189, 43, 23, 106, 37, 45, 238, 89, 236,
          227, 133, 153, 32, 91, 179, 234, 40, 191, 143, 215, 252, 125, 167, 92, 5, 66, 114, 174,
          72, 88, 229, 145, 252, 90, 163, 108, 48, 106, 48, 34, 6, 9, 43, 6, 1, 4, 1, 130, 196, 10,
          2, 4, 21, 49, 46, 51, 46, 54, 46, 49, 46, 52, 46, 49, 46, 52, 49, 52, 56, 50, 46, 49, 46,
          49, 48, 19, 6, 11, 43, 6, 1, 4, 1, 130, 229, 28, 2, 1, 1, 4, 4, 3, 2, 4, 48, 48, 33, 6,
          11, 43, 6, 1, 4, 1, 130, 229, 28, 1, 1, 4, 4, 18, 4, 16, 20, 154, 32, 33, 142, 246, 65,
          51, 150, 184, 129, 248, 213, 183, 241, 245, 48, 12, 6, 3, 85, 29, 19, 1, 1, 255, 4, 2,
          48, 0, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 3, 130, 1, 1, 0, 62, 254,
          163, 223, 61, 42, 224, 114, 87, 143, 126, 4, 208, 221, 90, 75, 104, 219, 1, 175, 232, 99,
          46, 24, 180, 224, 184, 115, 67, 24, 145, 25, 108, 24, 75, 235, 193, 213, 51, 162, 61,
          119, 139, 177, 4, 8, 193, 185, 170, 65, 78, 117, 118, 133, 91, 9, 54, 151, 24, 179, 72,
          175, 92, 239, 108, 176, 48, 134, 114, 214, 31, 184, 189, 155, 134, 161, 10, 166, 130,
          206, 140, 45, 78, 240, 144, 237, 80, 84, 24, 254, 83, 212, 206, 30, 98, 122, 40, 243,
          114, 3, 9, 88, 208, 143, 250, 89, 27, 196, 24, 128, 225, 142, 138, 12, 237, 26, 133, 128,
          127, 144, 150, 113, 65, 122, 11, 69, 50, 21, 179, 141, 193, 71, 42, 36, 73, 118, 64, 180,
          232, 107, 254, 196, 241, 84, 99, 155, 133, 184, 232, 128, 20, 150, 54, 36, 56, 53, 89, 1,
          43, 252, 135, 124, 11, 68, 236, 125, 167, 148, 210, 6, 84, 178, 154, 220, 29, 186, 92,
          80, 123, 240, 202, 109, 243, 82, 188, 205, 222, 116, 13, 46, 167, 225, 8, 36, 162, 206,
          57, 79, 144, 77, 29, 153, 65, 94, 58, 124, 69, 181, 254, 40, 122, 155, 203, 220, 105,
          142, 139, 220, 213, 180, 121, 138, 92, 237, 53, 222, 138, 53, 9, 2, 10, 20, 183, 38, 191,
          191, 57, 167, 68, 7, 156, 185, 143, 91, 157, 202, 9, 183, 195, 235, 188, 189, 162, 175,
          105, 3, 104, 97, 117, 116, 104, 68, 97, 116, 97, 88, 196, 73, 150, 13, 229, 136, 14, 140,
          104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92,
          243, 186, 131, 29, 151, 99, 65, 0, 0, 0, 4, 20, 154, 32, 33, 142, 246, 65, 51, 150, 184,
          129, 248, 213, 183, 241, 245, 0, 64, 30, 201, 20, 218, 12, 56, 158, 157, 61, 33, 75, 88,
          52, 121, 241, 48, 206, 189, 234, 50, 71, 170, 247, 28, 81, 208, 102, 119, 76, 79, 233,
          113, 22, 192, 125, 49, 45, 232, 181, 61, 76, 195, 36, 35, 53, 245, 38, 119, 3, 97, 49,
          209, 243, 75, 195, 73, 220, 218, 26, 200, 148, 89, 192, 183, 165, 1, 2, 3, 38, 32, 1, 33,
          88, 32, 88, 207, 228, 149, 233, 244, 178, 237, 152, 197, 205, 216, 254, 73, 108, 90, 49,
          183, 218, 195, 134, 83, 251, 6, 32, 10, 83, 119, 191, 221, 228, 85, 34, 88, 32, 100, 179,
          99, 141, 67, 52, 186, 225, 214, 53, 233, 224, 158, 119, 168, 41, 234, 227, 230, 253, 29,
          133, 238, 119, 253, 20, 18, 198, 106, 184, 55, 149]
        ).toString('base64')
      },
      type: 'public-key'
    }
  }
}

// note to Kevin - I want to get the PR for main implementation and unit tests in 
// now, so I'll cover the fixes to the integration tests and new integration tests
// for tx in the next one!
describe.skip('Inbound POST /consents', (): void => {
  const ttkRequestsHistoryUri = `http://localhost:5050/api/history/requests`

  beforeEach(async(): Promise<void> => {
    // clear the request history in TTK between tests.
    await axios.delete(ttkRequestsHistoryUri, {})
  })

  afterAll(async (): Promise<void> => {
    await closeKnexConnection()
  })

  // Note - skipping temporarily
  describe('Happy Path', (): void => {
    describe('POST /consents from DFSP should create the model and start the workflow', (): void => {
      const axiosConfig = {
        headers: {
          'Content-Type': 'application/json',
          'FSPIOP-Source': 'switch',
          Date: 'Thu, 24 Jan 2019 10:23:12 GMT',
          'FSPIOP-Destination': 'als'
        }
      }

      it('should send POST /participants/CONSENT/{ID} to the ALS', async (): Promise<void> => {
        // Endpoint
        const scenariosURI = 'http://localhost:4004/consents'
        const payload = consentsPostRequestAUTH
        const response = await axios.post(scenariosURI, payload, {
          headers: headers
        })

        // auth-service should return Accepted code
        expect(response.status).toEqual(202)

        // wait a bit for the auth-service to process the request
        // takes a bit since attestation takes a bit of time
        await new Promise(resolve => setTimeout(resolve, 2000))

        // check that the auth-service has sent a POST /participants/{Type}/{ID} to the ALS (TTK)
        const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
        var postParticipantsTypeIdToALS = requestsHistory.filter(req => {
          return req.method === 'post' && req.path === '/participants/CONSENT/76059a0a-684f-4002-a880-b01159afe119'
        })
        expect(postParticipantsTypeIdToALS.length).toEqual(1)

        const historyPayload = postParticipantsTypeIdToALS[0].body as tpAPI.Schemas.ParticipantsTypeIDSubIDPostRequest
        expect(historyPayload).toEqual({
          fspId: 'centralAuth'
        })
      })
    })

    describe('PUT /participants/{Type}/{ID} from ALS should continue the flow', (): void => {
      it('should send PUT /consents/{ID} on receiving successful callback from ALS', async (): Promise<void> => {
        // Endpoint
        const axiosConfig = {
          headers: {
            'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
            'Accept': 'application/vnd.interoperability.participants+json;version=1.1',
            'FSPIOP-Source': 'als',
            Date: 'Thu, 24 Jan 2019 10:23:12 GMT',
            'FSPIOP-Destination': 'centralAuth'
          }
        }
        // simulate ALS sending successful callback to auth-service
        const putParticipantsTypeIdFromALS = {
          fspId: 'centralAuth'
        }
        const putScenarioUri = `http://localhost:4004/participants/CONSENT/76059a0a-684f-4002-a880-b01159afe119`

        const responseToPutParticipantsTypeId = await axios.put(putScenarioUri, putParticipantsTypeIdFromALS, axiosConfig)
        expect(responseToPutParticipantsTypeId.status).toEqual(200)

        // wait a bit for the auth-service to process the request
        // takes a bit since attestation takes a bit of time
        await new Promise(resolve => setTimeout(resolve, 2000))

        // check that the auth-service has sent a PUT /consents/{ID} to the DFSP (TTK)
        const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
        var putConsentsIdToDFSP = requestsHistory.filter(req => {
          return req.method === 'put' && req.path === '/consents/76059a0a-684f-4002-a880-b01159afe119'
        })
        expect(putConsentsIdToDFSP.length).toEqual(1)

        const historyPayload = putConsentsIdToDFSP[0].body as tpAPI.Schemas.ConsentRequestsIDPutResponseOTP
        expect(historyPayload).toEqual({
          scopes: consentsPostRequestAUTH.scopes,
          credential: {
            ...consentsPostRequestAUTH.credential,
            status: 'VERIFIED'
          }
        })
      })
    })
  })
})
