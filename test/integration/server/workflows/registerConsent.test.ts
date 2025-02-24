/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 - Kenneth Zeng <kkzeng@google.com>
 --------------
 ******/

import axios from 'axios'
import headers from '~/../test/data/headers.json'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { closeKnexConnection } from '~/model/db'
import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'

// test data from Lewis
// here is how the client should convert ArrayBuffer to base64 strings using Browser's btoa function
// take a look on `reduce` version
// https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
// in nodejs we use only Buffer.from([...]).toString('base64')
const consentsPostRequestAUTH: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  status: 'ISSUED',
  consentId: '76059a0a-684f-4002-a880-b01159afe119',
  scopes: [
    {
      address: 'dfspa.username.5678',
      actions: ['ACCOUNTS_TRANSFER']
    }
  ],
  // todo: make note in api that we are converting all array buffers to base64 encoded strings
  credential: {
    credentialType: 'FIDO',
    status: 'PENDING',
    fidoPayload: {
      id: 'T4qTvVJfCTiuKAv05kW5uXrEV13Zr0q1ySpcnr0NgdWid6wdzXHelE0z6uvBlYGJxPApuWQiD6xbFwLBzO5SyA',
      rawId: 'T4qTvVJfCTiuKAv05kW5uXrEV13Zr0q1ySpcnr0NgdWid6wdzXHelE0z6uvBlYGJxPApuWQiD6xbFwLBzO5SyA==',
      response: {
        attestationObject:
          'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEcwRQIhANS4oASh3C7nrbcGkHGRLiXaKqtZkfjTyxhf62df6Hz2AiA3Mb3iYyH09DxaedGYfZTrR+qNInNMCMbHzEXb/fMpgGN4NWOBWQLcMIIC2DCCAcCgAwIBAgIJALA5KjdfOKLrMA0GCSqGSIb3DQEBCwUAMC4xLDAqBgNVBAMTI1l1YmljbyBVMkYgUm9vdCBDQSBTZXJpYWwgNDU3MjAwNjMxMCAXDTE0MDgwMTAwMDAwMFoYDzIwNTAwOTA0MDAwMDAwWjBuMQswCQYDVQQGEwJTRTESMBAGA1UECgwJWXViaWNvIEFCMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMScwJQYDVQQDDB5ZdWJpY28gVTJGIEVFIFNlcmlhbCA5MjU1MTQxNjAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATBUzDbxw7VyKPri/NcB5oy/eVWBkwkXfQNU1gLc+nLR5EP7xcV93l5aHDpq1wXjOuZA5jBJoWpb6nbhhWOI9nCo4GBMH8wEwYKKwYBBAGCxAoNAQQFBAMFBAMwIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjcwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQL8BXn4ETR+qxFrtajbkgKjAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQABaTFk5Jj2iKM7SQ+rIS9YLEj4xxyJlJ9fGOoidDllzj4z7UpdC2JQ+ucOBPY81JO6hJTwcEkIdwoQPRZO5ZAScmBDNuIizJxqiQct7vF4J6SJHwEexWpF4XztIHtWEmd8JbnlvMw1lMwx+UuD06l11LxkfhK/LN613S91FABcf/ViH6rqmSpHu+II26jWeYEltk0Wf7jvOtRFKkROFBl2WPc2Dg1eRRYOKSJMqQhQn2Bud83uPFxT1H5yT29MKtjy6DJyzP4/UQjhLmuy9NDt+tlbtvfrXbrIitVMRE6oRert0juvM8PPMb6tvVYQfiM2IaYLKChn5yFCywvR9Xa+aGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAAAAAAAAAAAAAAAAAAAAAAAAABAT4qTvVJfCTiuKAv05kW5uXrEV13Zr0q1ySpcnr0NgdWid6wdzXHelE0z6uvBlYGJxPApuWQiD6xbFwLBzO5SyKUBAgMmIAEhWCBtJtLrpagWe8sj5hlm+oaBCdgE72G929RfGuEq80jHwCJYIMbMNFfVh+8KdEAOixumW8kyaI2CF6M1TauFRc5Cd1xo',
        clientDataJSON:
          'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiTWpobU1EVTBNemcxTnpNNU16SXlaRGxsWmpReU9HWXdOamxsTmpJek5qUTJZbUV4TmpVNVlURTVaamcwWlRGaU4yRm1NR001WW1KaU1UZGtPV016T1EiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJjcm9zc09yaWdpbiI6ZmFsc2V9'
      },
      type: 'public-key'
    }
  }
}

// note to Kevin - I want to get the PR for main implementation and unit tests in
// now, so I'll cover the fixes to the integration tests and new integration tests
// for tx in the next one!
describe('Inbound POST /consents', (): void => {
  const ttkRequestsHistoryUri = 'http://localhost:5050/api/history/requests'

  beforeEach(async (): Promise<void> => {
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
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // check that the auth-service has sent a POST /participants/{Type}/{ID} to the ALS (TTK)
        const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
        const postParticipantsTypeIdToALS = requestsHistory.filter((req) => {
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
            Accept: 'application/vnd.interoperability.participants+json;version=1.1',
            'FSPIOP-Source': 'als',
            Date: 'Thu, 24 Jan 2019 10:23:12 GMT',
            'FSPIOP-Destination': 'centralAuth'
          }
        }
        // simulate ALS sending successful callback to auth-service
        const putParticipantsTypeIdFromALS = {
          fspId: 'centralAuth'
        }
        const putScenarioUri = 'http://localhost:4004/participants/CONSENT/76059a0a-684f-4002-a880-b01159afe119'

        const responseToPutParticipantsTypeId = await axios.put(
          putScenarioUri,
          putParticipantsTypeIdFromALS,
          axiosConfig
        )
        expect(responseToPutParticipantsTypeId.status).toEqual(200)

        // wait a bit for the auth-service to process the request
        // takes a bit since attestation takes a bit of time
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // check that the auth-service has sent a PUT /consents/{ID} to the DFSP (TTK)
        const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
        const putConsentsIdToDFSP = requestsHistory.filter((req) => {
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
