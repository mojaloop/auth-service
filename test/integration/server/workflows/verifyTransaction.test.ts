
import axios from 'axios'
import headers from '~/../test/data/headers.json'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { closeKnexConnection } from '~/model/db'
import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'
import exp from 'constants'
const atob = require('atob')


const validConsentId = '3a38f3cb-4c27-468b-8a68-b0dbfc623804'
const validConsentsPostRequestAuth: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  consentId: validConsentId,
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
    // TODO: regenerate this from pineapplepay with valid payloads
    payload: {
      id: atob('HskU2gw4np09IUtYNHnxMM696jJHqvccUdBmd0xP6XEWwH0xLei1PUzDJCM19SZ3A2Ex0fNLw0nc2hrIlFnAtw'),
      rawId: atob('HskU2gw4np09IUtYNHnxMM696jJHqvccUdBmd0xP6XEWwH0xLei1PUzDJCM19SZ3A2Ex0fNLw0nc2hrIlFnAtw=='),
      response: {
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWXpSaFpHRmlZak16WlRrek1EWmlNRE00TURnNE1UTXlZV1ptWTJSbE5UVTJZelV3WkRneVpqWXdNMlkwTnpjeE1XRTVOVEV3WW1ZelltVmxaalprTmciLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjQyMTgxIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ==',
        attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIhAN2JDPPTse/45EHSqSpEJiiok5sns+HqdJch3+gsL09VAiAh7W7ZhQC8gMIkgwcA+S4rQkaHoHnP9AkkohaKCuuA62N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAAEFJogIY72QTOWuIH41bfx9QBAHskU2gw4np09IUtYNHnxMM696jJHqvccUdBmd0xP6XEWwH0xLei1PUzDJCM19SZ3A2Ex0fNLw0nc2hrIlFnAt6UBAgMmIAEhWCBYz+SV6fSy7ZjFzdj+SWxaMbfaw4ZT+wYgClN3v93kVSJYIGSzY41DNLrh1jXp4J53qCnq4+b9HYXud/0UEsZquDeV'
      },
      type: 'public-key'
    }
  }
}

// TODO: regenerate this guy!
export const validVerificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  challenge: 'some challenge base64 encoded',
  consentId: 'c6163a7a-dade-4732-843d-2c6a0e7580bf',
  signedPayloadType: 'FIDO',
  signedPayload: {
    id: '45c-TkfkjQovQeAWmOy-RLBHEJ_e4jYzQYgD8VdbkePgM5d98BaAadadNYrknxgH0jQEON8zBydLgh1EqoC9DA',
    rawId: '45c+TkfkjQovQeAWmOy+RLBHEJ/e4jYzQYgD8VdbkePgM5d98BaAadadNYrknxgH0jQEON8zBydLgh1EqoC9DA==',
    response: {
      authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAACA==',
      clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQUFBQUFBQUFBQUFBQUFBQUFBRUNBdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIxODEiLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ==',
      signature: 'MEUCIDcJRBu5aOLJVc/sPyECmYi23w8xF35n3RNhyUNVwQ2nAiEA+Lnd8dBn06OKkEgAq00BVbmH87ybQHfXlf1Y4RJqwQ8='
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

  afterAll(async (): Promise<void> => {
    await closeKnexConnection()
  })

  describe('happy flow', () => {
    it('creates a consent, and verifies a transaction', async () => {
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

      // we have a registered credential - now let's try verifying a transaction 
      const verifyURI = 'http://localhost:4004/thirdpartyRequests/verifications'

      // Act
      const result = await axios.post(verifyURI, validVerificationRequest, { headers })
      
      // Assert
      expect(result.status).toBe(202)

      // wait a bit for the auth-service to process the request and call the ttk
      await new Promise(resolve => setTimeout(resolve, 2000))

      // check that the auth-service has sent a PUT /thirdpartyRequests/verifications/{ID} to the DFSP (TTK)
      const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
      const asyncCallback = requestsHistory.filter(req => {
        return req.method === 'put' && req.path === `/thirdpartyRequests/verifications/${validVerificationRequest.verificationRequestId}`
      })

      expect(asyncCallback.length).toEqual(1)

      // check the payload
      const asyncCallbackPayload = asyncCallback[0].body as tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse
      expect(asyncCallbackPayload).toStrictEqual({
        authenticationResonse: 'VERIFIED'
      })
    })
  })

  describe('unhappy flow', () => {
    it.todo('tries to verify a transaction signed with the wrong private key')
  })
})