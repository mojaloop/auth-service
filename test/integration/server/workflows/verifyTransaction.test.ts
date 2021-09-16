
import axios from 'axios'
import headers from '~/../test/data/headers.json'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { closeKnexConnection, testCleanupConsents } from '~/model/db'
import { deriveChallenge } from '~/domain/challenge'
import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'
const atob = require('atob')
const btoa = require('btoa')

const validConsentId = 'be433b9e-9473-4b7d-bdd5-ac5b42463afb'
const validConsentsPostRequestAuth: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  consentId: validConsentId,
  scopes: [
    {actions: ['accounts.getBalance', 'accounts.transfer'], accountId: '412ddd18-07a0-490d-814d-27d0e9af9982'}, 
    {actions: ['accounts.getBalance'], accountId: '10e88508-e542-4630-be7f-bc0076029ea7'}
  ],
  credential: {
    credentialType: 'FIDO',
    status: 'PENDING',
    payload: {
      id: atob('vwWPva1iiTJIk_c7n9a49spEtJZBqrn4SECerci0b-Ue-6Jv9_DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ'),
      rawId: atob('vwWPva1iiTJIk/c7n9a49spEtJZBqrn4SECerci0b+Ue+6Jv9/DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ=='),
      response: {
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiTXpnd056QTFZMkU1TlRaaFlUZzBOMlE0T1dVMFlUUTBOR1JoT1dKbFpXUmpOR1EzTlRZNU1XSTBNV0l3WldNeE9EVTJZalJoWW1Sa05EbGhORE0yTUEiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjQyMTgxIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ==',
        attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIhAJEFVHrzmq90fdBVy4nOPc48vtvJVAyQleGVcp+nQ8lUAiB67XFnGhC7q7WI3NdcrCdqnewSjCfhqEvO+sbWKC60c2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAABFJogIY72QTOWuIH41bfx9QBAvwWPva1iiTJIk/c7n9a49spEtJZBqrn4SECerci0b+Ue+6Jv9/DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWaUBAgMmIAEhWCAITUwire20kCqzl0A3Fbpwx2cnSqwFfTgbA2b8+a/aUiJYIHRMWJlb4Lud02oWTdQ+fejwkVo17qD0KvrwwrZZxWIg'
      },
      type: 'public-key'
    }
  }
}

export const validVerificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  // This is stubbed out for pisp-demo-svc, where we generated these payloads
  // FIDO library actually signs the base64 hash of this challenge
  challenge: btoa('unimplemented123'),
  consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
  signedPayloadType: 'FIDO',
  signedPayload: {
    id: atob('vwWPva1iiTJIk_c7n9a49spEtJZBqrn4SECerci0b-Ue-6Jv9_DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ'),
    rawId: 'vwWPva1iiTJIk_c7n9a49spEtJZBqrn4SECerci0b-Ue-6Jv9_DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ',
    response: {
      authenticatorData: Buffer.from([73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23,
        15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 1, 0, 0, 0, 18]).toString('base64'),
      clientDataJSON: Buffer.from([123, 34, 116, 121, 112, 101, 34, 58,
        34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 100, 87, 53, 112, 98, 88, 66, 115, 90, 87,
        49, 108, 98, 110, 82, 108, 90, 68, 69, 121, 77, 119, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104,
        111, 115, 116, 58, 52, 50, 49, 56, 49, 34, 44, 34, 99, 114, 111, 115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 44, 34, 111, 116, 104, 101, 114,
        95, 107, 101, 121, 115, 95, 99, 97, 110, 95, 98, 101, 95, 97, 100, 100, 101, 100, 95, 104, 101, 114, 101, 34, 58, 34, 100, 111, 32, 110, 111, 116, 32, 99, 111, 109, 112,
        97, 114, 101, 32, 99, 108, 105, 101, 110, 116, 68, 97, 116, 97, 74, 83, 79, 78, 32, 97, 103, 97, 105, 110, 115, 116, 32, 97, 32, 116, 101, 109, 112, 108, 97, 116, 101,
        46, 32, 83, 101, 101, 32, 104, 116, 116, 112, 115, 58, 47, 47, 103, 111, 111, 46, 103, 108, 47, 121, 97, 98, 80, 101, 120, 34, 125]).toString('base64'),
      signature: Buffer.from([48, 68, 2, 32, 104, 17,
        39, 167, 189, 118, 136, 100, 84, 72, 120, 29, 255, 74, 131, 59, 254, 132, 36, 19, 184, 24, 93, 103, 67, 195, 25, 252, 6, 224, 120, 69, 2, 32, 56, 251, 234, 96, 138, 6,
        158, 231, 246, 168, 254, 147, 129, 142, 100, 145, 234, 99, 91, 152, 199, 15, 72, 19, 176, 237, 209, 176, 131, 243, 70, 167]).toString('base64')
    },
    type: 'public-key'
  }
}

export const invalidVerificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  challenge: btoa('incorrect challenge!'),
  consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
  signedPayloadType: 'FIDO',
  signedPayload: {
    id: atob('vwWPva1iiTJIk_c7n9a49spEtJZBqrn4SECerci0b-Ue-6Jv9_DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ'),
    rawId: 'vwWPva1iiTJIk_c7n9a49spEtJZBqrn4SECerci0b-Ue-6Jv9_DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ',
    response: {
      authenticatorData: Buffer.from([73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23,
        15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 1, 0, 0, 0, 18]).toString('base64'),
      clientDataJSON: Buffer.from([123, 34, 116, 121, 112, 101, 34, 58,
        34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 100, 87, 53, 112, 98, 88, 66, 115, 90, 87,
        49, 108, 98, 110, 82, 108, 90, 68, 69, 121, 77, 119, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104,
        111, 115, 116, 58, 52, 50, 49, 56, 49, 34, 44, 34, 99, 114, 111, 115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 44, 34, 111, 116, 104, 101, 114,
        95, 107, 101, 121, 115, 95, 99, 97, 110, 95, 98, 101, 95, 97, 100, 100, 101, 100, 95, 104, 101, 114, 101, 34, 58, 34, 100, 111, 32, 110, 111, 116, 32, 99, 111, 109, 112,
        97, 114, 101, 32, 99, 108, 105, 101, 110, 116, 68, 97, 116, 97, 74, 83, 79, 78, 32, 97, 103, 97, 105, 110, 115, 116, 32, 97, 32, 116, 101, 109, 112, 108, 97, 116, 101,
        46, 32, 83, 101, 101, 32, 104, 116, 116, 112, 115, 58, 47, 47, 103, 111, 111, 46, 103, 108, 47, 121, 97, 98, 80, 101, 120, 34, 125]).toString('base64'),
      signature: Buffer.from([48, 68, 2, 32, 104, 17,
        39, 167, 189, 118, 136, 100, 84, 72, 120, 29, 255, 74, 131, 59, 254, 132, 36, 19, 184, 24, 93, 103, 67, 195, 25, 252, 6, 224, 120, 69, 2, 32, 56, 251, 234, 96, 138, 6,
        158, 231, 246, 168, 254, 147, 129, 142, 100, 145, 234, 99, 91, 152, 199, 15, 72, 19, 176, 237, 209, 176, 131, 243, 70, 167]).toString('base64')
    },
    type: 'public-key'
  }
}

const axiosConfig = {
  headers: {
    'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
    'Accept': 'application/vnd.interoperability.participants+json;version=1.1',
    'FSPIOP-Source': 'als',
    Date: 'Thu, 24 Jan 2019 10:23:12 GMT',
    'FSPIOP-Destination': 'centralAuth'
  }
}
const ttkRequestsHistoryUri = `http://localhost:5050/api/history/requests`


describe('POST /thirdpartyRequests/verifications', () => {
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
      const preloadedChallengeFromUI = btoa('380705ca956aa847d89e4a444da9beedc4d75691b41b0ec1856b4abdd49a4360')
      expect(derivedChallenge).toStrictEqual(preloadedChallengeFromUI)

      // Arrange
      const consentsURI = 'http://localhost:4004/consents'
      
      // register the consent
      const response = await axios.post(consentsURI, validConsentsPostRequestAuth, {headers})
      
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
      const preloadedChallengeFromUI = btoa('380705ca956aa847d89e4a444da9beedc4d75691b41b0ec1856b4abdd49a4360')
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
        return req.method === 'put' 
          && req.path === `/thirdpartyRequests/verifications/${invalidVerificationRequest.verificationRequestId}/error`
      })

      expect(asyncCallback.length).toEqual(1)

      // check the payload
      const asyncCallbackPayload = asyncCallback[0].body as tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse
      expect(asyncCallbackPayload).toStrictEqual({
        "errorInformation": {
          "errorCode": "7105",
          "errorDescription": "Authorization received from PISP failed DFSP validation",
        }
      })
    })
  })
})