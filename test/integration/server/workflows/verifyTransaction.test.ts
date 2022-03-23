
import axios from 'axios'
import headers from '~/../test/data/headers.json'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { closeKnexConnection, testCleanupConsents } from '~/model/db'
import { deriveChallenge } from '~/domain/challenge'
import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'
import btoa from 'btoa'
// import atob from 'atob'

const validConsentId = 'be433b9e-9473-4b7d-bdd5-ac5b42463afb'
const validConsentsPostRequestAuth: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  status: 'ISSUED',
  consentId: validConsentId,
  scopes: [
    { actions: ['ACCOUNTS_GET_BALANCE', 'ACCOUNTS_TRANSFER'], address: '412ddd18-07a0-490d-814d-27d0e9af9982' },
    { actions: ['ACCOUNTS_GET_BALANCE'], address: '10e88508-e542-4630-be7f-bc0076029ea7' }
  ],
  credential: {
    credentialType: 'FIDO',
    status: 'PENDING',
    fidoPayload: {
      id: 'N_L4HWcqQH0uDSGl6nwYtKfWsuWY_0f1_CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q',
      rawId: 'N/L4HWcqQH0uDSGl6nwYtKfWsuWY/0f1/CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q==',
      response: {
        attestationObject: 'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEcwRQIhAMewwET/ekF0fFwBKHEiKr6bIyEuJb3GlS1QT/oJKBLcAiAPukDS55G7pKV358QrL4t0IuBbsGtru+iiR51OdhlsAWN4NWOBWQLcMIIC2DCCAcCgAwIBAgIJALA5KjdfOKLrMA0GCSqGSIb3DQEBCwUAMC4xLDAqBgNVBAMTI1l1YmljbyBVMkYgUm9vdCBDQSBTZXJpYWwgNDU3MjAwNjMxMCAXDTE0MDgwMTAwMDAwMFoYDzIwNTAwOTA0MDAwMDAwWjBuMQswCQYDVQQGEwJTRTESMBAGA1UECgwJWXViaWNvIEFCMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMScwJQYDVQQDDB5ZdWJpY28gVTJGIEVFIFNlcmlhbCA5MjU1MTQxNjAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATBUzDbxw7VyKPri/NcB5oy/eVWBkwkXfQNU1gLc+nLR5EP7xcV93l5aHDpq1wXjOuZA5jBJoWpb6nbhhWOI9nCo4GBMH8wEwYKKwYBBAGCxAoNAQQFBAMFBAMwIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjcwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQL8BXn4ETR+qxFrtajbkgKjAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQABaTFk5Jj2iKM7SQ+rIS9YLEj4xxyJlJ9fGOoidDllzj4z7UpdC2JQ+ucOBPY81JO6hJTwcEkIdwoQPRZO5ZAScmBDNuIizJxqiQct7vF4J6SJHwEexWpF4XztIHtWEmd8JbnlvMw1lMwx+UuD06l11LxkfhK/LN613S91FABcf/ViH6rqmSpHu+II26jWeYEltk0Wf7jvOtRFKkROFBl2WPc2Dg1eRRYOKSJMqQhQn2Bud83uPFxT1H5yT29MKtjy6DJyzP4/UQjhLmuy9NDt+tlbtvfrXbrIitVMRE6oRert0juvM8PPMb6tvVYQfiM2IaYLKChn5yFCywvR9Xa+aGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAAAAAAAAAAAAAAAAAAAAAAAAABAN/L4HWcqQH0uDSGl6nwYtKfWsuWY/0f1/CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9aUBAgMmIAEhWCCaDbxvbxlV6hLykMmKAzqYVLctaUtm6XIY8yUkDW7d5CJYIDykWJ0Sw3P0pxecZuZSSj93m1Q1M+W7mMtZE5SnkjF4',
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWVdKaVltWXlOR0psWlRNek5qUmhNR0ZoWTJOak0yTXdOemhqWTJGaE1USTVOekExTVRBNU1EbGxNV0ppTVRZMk5XTXpZVEpqWVRsbVkyWTVOV1E0T1EiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJjcm9zc09yaWdpbiI6ZmFsc2V9'
      },
      type: 'public-key'
    }
  }
}

export const validVerificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  // This is stubbed out for pisp-demo-svc
  // FIDO library actually signs the base64 hash of this challenge
  challenge: 'unimplemented123',
  consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
  signedPayloadType: 'FIDO',
  fidoSignedPayload: {
    id: 'N_L4HWcqQH0uDSGl6nwYtKfWsuWY_0f1_CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q',
    rawId: 'N/L4HWcqQH0uDSGl6nwYtKfWsuWY/0f1/CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q==',
    response: {
      authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAACw==',
      clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiZFc1cGJYQnNaVzFsYm5SbFpERXlNdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCIsImNyb3NzT3JpZ2luIjpmYWxzZX0=',
      signature: 'MEUCIFAVNRa300tOD1qdki66w8wHXRDuXtJxUKyLlyHdDp25AiEA4uYOUdzTI7vNtAv76CcZKzIvw9O8melbxfTBIVa16B0='
    },
    type: 'public-key'
  }
}

export const invalidVerificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  challenge: btoa('incorrect challenge!'),
  consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
  signedPayloadType: 'FIDO',
  fidoSignedPayload: {
    id: 'N_L4HWcqQH0uDSGl6nwYtKfWsuWY_0f1_CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q',
    rawId: 'N/L4HWcqQH0uDSGl6nwYtKfWsuWY/0f1/CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q==',
    response: {
      authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAACw==',
      clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiZFc1cGJYQnNaVzFsYm5SbFpERXlNdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCIsImNyb3NzT3JpZ2luIjpmYWxzZX0=',
      signature: 'MEUCIFAVNRa300tOD1qdki66w8wHXRDuXtJxUKyLlyHdDp25AiEA4uYOUdzTI7vNtAv76CcZKzIvw9O8melbxfTBIVa16B0='
    },
    type: 'public-key'
  }
}

const axiosConfig = {
  headers: {
    'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
    Accept: 'application/vnd.interoperability.participants+json;version=1.1',
    'FSPIOP-Source': 'als',
    Date: 'Thu, 24 Jan 2019 10:23:12 GMT',
    'FSPIOP-Destination': 'centralAuth'
  }
}
const ttkRequestsHistoryUri = 'http://localhost:5050/api/history/requests'

describe('POST /thirdpartyRequests/verifications', () => {
  jest.setTimeout(15000)

  beforeEach(async () => {
    // clear the request history in TTK between tests.
    await axios.delete(ttkRequestsHistoryUri, {})

    try {
      await testCleanupConsents([
        validConsentId
      ])
    } catch (err) {
      // non-fatal, it's safe to ignore here.
    }
  })

  afterAll(async (): Promise<void> => {
    await closeKnexConnection()
  })

  describe('happy flow', () => {
    it('creates a consent, and verifies a transaction', async () => {
      // check that the derivation lines up with our mock data
      const derivedChallenge = deriveChallenge(validConsentsPostRequestAuth)
      const preloadedChallengeFromUI = btoa('abbbf24bee3364a0aaccc3c078ccaa12970510909e1bb1665c3a2ca9fcf95d89')
      expect(derivedChallenge).toStrictEqual(preloadedChallengeFromUI)

      // Arrange
      const consentsURI = 'http://localhost:4004/consents'

      // register the consent
      const response = await axios.post(consentsURI, validConsentsPostRequestAuth, { headers })

      // auth-service should return Accepted code
      expect(response.status).toEqual(202)

      // wait a bit for the auth-service to process the request
      // takes a bit since attestation takes a bit of time
      await new Promise(resolve => setTimeout(resolve, 2000))
      const putParticipantsTypeIdFromALS = {
        fspId: 'centralAuth'
      }
      const mockAlsParticipantsURI = `http://localhost:4004/participants/CONSENT/${validConsentId}`

      // mock the ALS callback to the auth-service
      const responseToPutParticipantsTypeId = await axios.put(mockAlsParticipantsURI, putParticipantsTypeIdFromALS, axiosConfig)
      expect(responseToPutParticipantsTypeId.status).toEqual(200)

      // // we have a registered credential - now let's try verifying a transaction
      const verifyURI = 'http://localhost:4004/thirdpartyRequests/verifications'

      // Act
      const result = await axios.post(verifyURI, validVerificationRequest, { headers })

      // Assert
      expect(result.status).toBe(202)

      // wait a bit for the auth-service to process the request and call the ttk
      await new Promise(resolve => setTimeout(resolve, 4000))

      // check that the auth-service has sent a PUT /thirdpartyRequests/verifications/{ID} to the DFSP (TTK)
      const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
      const asyncCallback = requestsHistory.filter(req => {
        return req.method === 'put' && req.path === `/thirdpartyRequests/verifications/${validVerificationRequest.verificationRequestId}`
      })

      expect(asyncCallback.length).toEqual(1)

      // check the payload
      const asyncCallbackPayload = asyncCallback[0].body as tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse
      expect(asyncCallbackPayload).toStrictEqual({
        authenticationResponse: 'VERIFIED'
      })
    })
  })

  describe('unhappy flow', () => {
    it('creates a consent, and tries to verify a transaction that signed the wrong challenge', async () => {
      // check that the derivation lines up with our mock data
      const derivedChallenge = deriveChallenge(validConsentsPostRequestAuth)
      const preloadedChallengeFromUI = btoa('abbbf24bee3364a0aaccc3c078ccaa12970510909e1bb1665c3a2ca9fcf95d89')
      expect(derivedChallenge).toStrictEqual(preloadedChallengeFromUI)

      // Arrange
      const consentsURI = 'http://localhost:4004/consents'

      // register the consent
      const response = await axios.post(consentsURI, validConsentsPostRequestAuth, { headers })

      // auth-service should return Accepted code
      expect(response.status).toEqual(202)

      // wait a bit for the auth-service to process the request
      // takes a bit since attestation takes a bit of time
      await new Promise(resolve => setTimeout(resolve, 2000))
      const putParticipantsTypeIdFromALS = {
        fspId: 'centralAuth'
      }
      const mockAlsParticipantsURI = `http://localhost:4004/participants/CONSENT/${validConsentId}`

      // mock the ALS callback to the auth-service
      const responseToPutParticipantsTypeId = await axios.put(mockAlsParticipantsURI, putParticipantsTypeIdFromALS, axiosConfig)
      expect(responseToPutParticipantsTypeId.status).toEqual(200)

      // // we have a registered credential - now let's try verifying a transaction
      const verifyURI = 'http://localhost:4004/thirdpartyRequests/verifications'

      // Act
      const result = await axios.post(verifyURI, invalidVerificationRequest, { headers })

      // Assert
      expect(result.status).toBe(202)

      // wait a bit for the auth-service to process the request and call the ttk
      await new Promise(resolve => setTimeout(resolve, 4000))

      // check that the auth-service has sent a PUT /thirdpartyRequests/verifications/{ID} to the DFSP (TTK)
      const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
      const asyncCallback = requestsHistory.filter(req => {
        return req.method === 'put' &&
          req.path === `/thirdpartyRequests/verifications/${invalidVerificationRequest.verificationRequestId}/error`
      })

      expect(asyncCallback.length).toEqual(1)

      // check the payload
      const asyncCallbackPayload = asyncCallback[0].body as tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse
      expect(asyncCallbackPayload).toStrictEqual({
        errorInformation: {
          errorCode: '7105',
          errorDescription: 'Authorization received from PISP failed DFSP validation',
          extensionList: expect.any(Object)
        }
      })
    })
  })
})
