/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop
 files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
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

 - Kevin Leyow <kevin.leyow@modusbox.com>
 --------------
 ******/
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import {
  AssertionResult,
  AttestationResult,
  ExpectedAssertionResult,
  ExpectedAttestationResult,
  Fido2Lib
} from 'fido2-lib'
import str2ab from 'string-to-arraybuffer'
import { deriveChallenge } from '~/domain/challenge'
import { decodeBase64String } from '~/domain/buffer'
import FidoUtils from '~/shared/fido-utils'
import btoa from 'btoa'

/* IMPORTANT
   The fido challenges found in `auth-service` are signed with
   Kevin Leyow's <kevin.leyow@modusbox.com> Yubikey. If the POST /consent
   `consentId` and `scopes` ever change form you will need to derivie and resign the challenges,
   update the `credential` object and update this PSA.
   You will also need to update the public keys found in every verify transaction flow.
   Use https://github.com/mojaloop/contrib-fido-test-ui#creating-a-test-credential
   to retrieve data used to update the response bodies.
*/

/*
  Example attestation result
  The typescript interface doesn't dive deep into the returned values.
  So this is to be used as reference

  Fido2AttestationResult {
    audit: {
      validExpectations: true,
      validRequest: true,
      complete: true,
      journal: Set {
        'type',
        'aaguid',
        'credentialPublicKeyCose',
        'credentialPublicKeyJwk',
        'credentialPublicKeyPem',
        'rawClientDataJson',
        'origin',
        'challenge',
        'tokenBinding',
        'rawId',
        'rawAuthnrData',
        'rpIdHash',
        'flags',
        'sig',
        'alg',
        'x5c',
        'attCert',
        'fmt',
        'counter',
        'credId',
        'credIdLen',
        'transports'
      },
      warning: Map {
        'attesation-not-validated' => 'could not validate attestation because the root attestation certification could not be found'
      },
      info: Map {
        'yubico-device-id' => 'Security Key by Yubico',
        'fido-u2f-transports' => [Set],
        'fido-aaguid' => [ArrayBuffer],
        'basic-constraints' => [BasicConstraints],
        'attestation-type' => 'basic'
      }
    },
    validateAudit: [AsyncFunction: validateAudit],
    requiredExpectations: Set { 'origin', 'challenge', 'flags' },
    optionalExpectations: Set { 'rpId' },
    expectations: Map {
      'origin' => 'http://localhost:42181',
      'challenge' => 'YzRhZGFiYjMzZTkzMDZiMDM4MDg4MTMyYWZmY2RlNTU2YzUwZDgyZjYwM2Y0NzcxMWE5NTEwYmYzYmVlZjZkNg',
      'flags' => Set { 'AT', 'UP-or-UV' }
    },
    request: {
      id: ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 86
      },
      rawId: ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 64
      },
      response: {
        clientDataJSON: long string
        attestationObject: long string
      }
    },
    clientData: Map {
      'challenge' => 'YzRhZGFiYjMzZTkzMDZiMDM4MDg4MTMyYWZmY2RlNTU2YzUwZDgyZjYwM2Y0NzcxMWE5NTEwYmYzYmVlZjZkNg',
      'origin' => 'http://localhost:42181',
      'type' => 'webauthn.create',
      'tokenBinding' => undefined,
      'rawClientDataJson' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 181
      },
      'rawId' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 64
      }
    },
    authnrData: Map {
      'fmt' => 'packed',
      'alg' => { algName: 'ECDSA_w_SHA256', hashAlg: 'SHA256' },
      'attCert' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 705
      },
      'x5c' => [],
      'sig' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 71
      },
      'rawAuthnrData' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 196
      },
      'transports' => undefined,
      'rpIdHash' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 32
      },
      'flags' => Set { 'UP', 'AT' },
      'counter' => 4,
      'aaguid' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 16
      },
      'credIdLen' => 64,
      'credId' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 64
      },
      'credentialPublicKeyCose' => ArrayBuffer {
        [Uint8Contents]: Some Array,
        byteLength: 77
      },
      'credentialPublicKeyJwk' => {
        kty: 'EC',
        alg: 'ECDSA_w_SHA256',
        crv: 'P-256',
        x: 'WM/klen0su2Yxc3Y/klsWjG32sOGU/sGIApTd7/d5FU=',
        y: 'ZLNjjUM0uuHWNengnneoKerj5v0dhe53/RQSxmq4N5U='
      },
      'credentialPublicKeyPem' => '-----BEGIN PUBLIC KEY-----\n' +
        'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWM/klen0su2Yxc3Y/klsWjG32sOG\n' +
        'U/sGIApTd7/d5FVks2ONQzS64dY16eCed6gp6uPm/R2F7nf9FBLGarg3lQ==\n' +
        '-----END PUBLIC KEY-----\n'
    }
  }
*/
import atob from 'atob'

function ab2str(buf: ArrayBuffer) {
  let str = ''
  new Uint8Array(buf).forEach((ch) => {
    str += String.fromCharCode(ch)
  })
  return str
}

const consentsPostRequestAUTHPayload: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  status: 'ISSUED',
  consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
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
        attestationObject:
          'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEcwRQIhAMewwET/ekF0fFwBKHEiKr6bIyEuJb3GlS1QT/oJKBLcAiAPukDS55G7pKV358QrL4t0IuBbsGtru+iiR51OdhlsAWN4NWOBWQLcMIIC2DCCAcCgAwIBAgIJALA5KjdfOKLrMA0GCSqGSIb3DQEBCwUAMC4xLDAqBgNVBAMTI1l1YmljbyBVMkYgUm9vdCBDQSBTZXJpYWwgNDU3MjAwNjMxMCAXDTE0MDgwMTAwMDAwMFoYDzIwNTAwOTA0MDAwMDAwWjBuMQswCQYDVQQGEwJTRTESMBAGA1UECgwJWXViaWNvIEFCMSIwIAYDVQQLDBlBdXRoZW50aWNhdG9yIEF0dGVzdGF0aW9uMScwJQYDVQQDDB5ZdWJpY28gVTJGIEVFIFNlcmlhbCA5MjU1MTQxNjAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATBUzDbxw7VyKPri/NcB5oy/eVWBkwkXfQNU1gLc+nLR5EP7xcV93l5aHDpq1wXjOuZA5jBJoWpb6nbhhWOI9nCo4GBMH8wEwYKKwYBBAGCxAoNAQQFBAMFBAMwIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjcwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQL8BXn4ETR+qxFrtajbkgKjAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQABaTFk5Jj2iKM7SQ+rIS9YLEj4xxyJlJ9fGOoidDllzj4z7UpdC2JQ+ucOBPY81JO6hJTwcEkIdwoQPRZO5ZAScmBDNuIizJxqiQct7vF4J6SJHwEexWpF4XztIHtWEmd8JbnlvMw1lMwx+UuD06l11LxkfhK/LN613S91FABcf/ViH6rqmSpHu+II26jWeYEltk0Wf7jvOtRFKkROFBl2WPc2Dg1eRRYOKSJMqQhQn2Bud83uPFxT1H5yT29MKtjy6DJyzP4/UQjhLmuy9NDt+tlbtvfrXbrIitVMRE6oRert0juvM8PPMb6tvVYQfiM2IaYLKChn5yFCywvR9Xa+aGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAAAAAAAAAAAAAAAAAAAAAAAAABAN/L4HWcqQH0uDSGl6nwYtKfWsuWY/0f1/CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9aUBAgMmIAEhWCCaDbxvbxlV6hLykMmKAzqYVLctaUtm6XIY8yUkDW7d5CJYIDykWJ0Sw3P0pxecZuZSSj93m1Q1M+W7mMtZE5SnkjF4',
        clientDataJSON:
          'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWVdKaVltWXlOR0psWlRNek5qUmhNR0ZoWTJOak0yTXdOemhqWTJGaE1USTVOekExTVRBNU1EbGxNV0ppTVRZMk5XTXpZVEpqWVRsbVkyWTVOV1E0T1EiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJjcm9zc09yaWdpbiI6ZmFsc2V9'
      },
      type: 'public-key'
    }
  }
}

const consentsPostRequestAUTH = {
  headers: {
    'fspiop-source': 'dfspA',
    'fspiop-destination': 'centralAuth'
  },
  params: {},
  payload: consentsPostRequestAUTHPayload
}

const verificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  // This is stubbed out for pisp-demo-svc
  // FIDO library actually signs the base64 hash of this challenge
  challenge: btoa('unimplemented123'),
  consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
  signedPayloadType: 'FIDO',
  fidoSignedPayload: {
    id: 'N_L4HWcqQH0uDSGl6nwYtKfWsuWY_0f1_CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q',
    rawId: 'N/L4HWcqQH0uDSGl6nwYtKfWsuWY/0f1/CbLwCoQchLgiCB866aXc7F08T69oQ6c10grLMaeVhXag4d8OdwA9Q==',
    response: {
      authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAACw==',
      clientDataJSON:
        'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiZFc1cGJYQnNaVzFsYm5SbFpERXlNdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCIsImNyb3NzT3JpZ2luIjpmYWxzZX0=',
      signature: 'MEUCIFAVNRa300tOD1qdki66w8wHXRDuXtJxUKyLlyHdDp25AiEA4uYOUdzTI7vNtAv76CcZKzIvw9O8melbxfTBIVa16B0='
    },
    type: 'public-key'
  }
}

// test the fido2-lib for peace of mind
describe('fido-lib', (): void => {
  describe.only('peace of mind', (): void => {
    it('should derive the challenge correctly', () => {
      // Arrange
      const expected = 'YWJiYmYyNGJlZTMzNjRhMGFhY2NjM2MwNzhjY2FhMTI5NzA1MTA5MDllMWJiMTY2NWMzYTJjYTlmY2Y5NWQ4OQ=='

      // Act
      const challenge = deriveChallenge(consentsPostRequestAUTH.payload as tpAPI.Schemas.ConsentsPostRequestAUTH)

      // Assert
      expect(challenge).toStrictEqual(expected)
    })

    it('should decode the clientDataJSON', () => {
      // Arrange
      const expected = {
        type: 'webauthn.create',
        challenge: 'YWJiYmYyNGJlZTMzNjRhMGFhY2NjM2MwNzhjY2FhMTI5NzA1MTA5MDllMWJiMTY2NWMzYTJjYTlmY2Y5NWQ4OQ',
        origin: 'http://localhost:8080',
        crossOrigin: false
      }

      // Act

      // We have to do a bit of fussing around here - convert from a base64 encoded string to a JSON string...
      const decodedJsonString = decodeBase64String(
        consentsPostRequestAUTH.payload.credential.fidoPayload!.response.clientDataJSON
      )
      const parsedClientData = JSON.parse(decodedJsonString)

      // Assert
      expect(parsedClientData).toStrictEqual(expected)
    })

    it('attestation should succeed', async (): Promise<void> => {
      // The base challenge that was derived
      const challenge = 'YWJiYmYyNGJlZTMzNjRhMGFhY2NjM2MwNzhjY2FhMTI5NzA1MTA5MDllMWJiMTY2NWMzYTJjYTlmY2Y5NWQ4OQ=='
      const attestationExpectations: ExpectedAttestationResult = {
        challenge,
        origin: 'http://localhost:8080',
        factor: 'either'
      }

      const f2l = new Fido2Lib()
      const clientAttestationResponse: AttestationResult = {
        id: str2ab(consentsPostRequestAUTH.payload.credential.fidoPayload!.id),
        rawId: str2ab(consentsPostRequestAUTH.payload.credential.fidoPayload!.rawId),
        response: {
          clientDataJSON: consentsPostRequestAUTH.payload.credential.fidoPayload!.response.clientDataJSON,
          attestationObject: consentsPostRequestAUTH.payload.credential.fidoPayload!.response.attestationObject
        }
      }
      // eslint-disable-next-line no-useless-catch
      try {
        const result = await f2l.attestationResult(clientAttestationResponse, attestationExpectations)
        console.log('credentialPublicKeyPem:', result.authnrData.get('credentialPublicKeyPem'))

        const credIdAB = result.authnrData.get('credId')
        const credId = btoa(ab2str(credIdAB))
        console.log('credId:', credId)
      } catch (error) {
        throw error
      }
    })

    it('assertion should succeed', async () => {
      console.log(btoa('unimplemented123'))
      console.log(atob(verificationRequest.fidoSignedPayload.response.clientDataJSON))
      // Arrange
      const f2l = new Fido2Lib()
      const assertionExpectations: ExpectedAssertionResult = {
        challenge: verificationRequest.challenge,
        origin: 'http://localhost:8080',
        // fido2lib infers this from origin, so we don't need to set it
        // rpId: 'localhost',
        factor: 'either',
        // Get this from the log statement in the previous request
        publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmg28b28ZVeoS8pDJigM6mFS3LWlL
ZulyGPMlJA1u3eQ8pFidEsNz9KcXnGbmUko/d5tUNTPlu5jLWROUp5IxeA==
-----END PUBLIC KEY-----`,
        prevCounter: 0,
        userHandle: null
      }
      const authenticatorData = FidoUtils.stringToArrayBuffer(
        verificationRequest.fidoSignedPayload.response.authenticatorData
      )
      console.log('authenticatorData.length', authenticatorData.byteLength)
      const assertionResult: AssertionResult = {
        // fido2lib requires an ArrayBuffer, not just any old Buffer!
        id: FidoUtils.stringToArrayBuffer(verificationRequest.fidoSignedPayload.id),
        response: {
          clientDataJSON: verificationRequest.fidoSignedPayload.response.clientDataJSON,
          authenticatorData,
          signature: verificationRequest.fidoSignedPayload.response.signature,
          userHandle: verificationRequest.fidoSignedPayload.response.userHandle
        }
      }

      // Act
      await f2l.assertionResult(assertionResult, assertionExpectations) // will throw on error

      // Assert
    })
  })

  // TODO: Update these tests when we have the demo app updated and running
  describe.skip('custom site based attestation and assertion', () => {
    const consent = {
      consentId: '46876aac-5db8-4353-bb3c-a6a905843ce7',
      consentRequestId: 'c51ec534-ee48-4575-b6a9-ead2955b8069',
      scopes: [{ address: 'dfspa.username.5678', actions: ['ACCOUNTS_TRANSFER'] }]
    }
    const challenge = deriveChallenge(consent as unknown as tpAPI.Schemas.ConsentsPostRequestAUTH)
    const credential: tpAPI.Schemas.VerifiedCredential = {
      credentialType: 'FIDO',
      status: 'VERIFIED',
      fidoPayload: {
        id: 'iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6_U00NfDa_Wxyti0uVwPzragBrzw',
        rawId: 'iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6/U00NfDa/Wxyti0uVwPzragBrzw==',
        response: {
          attestationObject:
            'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEcwRQIgC8d5Y5Tfs4nNybpZT97j5ZVuTNFu1AWWwqpR8em4LJcCIQDDzayDA6lzgrbB3jDMM2/NI70TtZux2T3lIWMK8IGxr2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMTLX5kZhaUsGGUVJvPd6efRKHVvWMqnrf4u23AvlzDddEEAAAAAAAAAAAAAAAAAAAAAAAAAAABAiehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6/U00NfDa/Wxyti0uVwPzragBrz6UBAgMmIAEhWCDAVRRKKW4qj4bWykF+8L4FI49plPv1i7yD+ef0ATwwlyJYIO7sxbQE+9J1LAY6lLMMh+jiSU0/Rf9j0MXiqC2/b7Cq',
          clientDataJSON:
            'eyJjaGFsbGVuZ2UiOiJORGxqT1RjeFltWXdZVFExWm1Ka1pUa3pOek13Tm1SalpUazNZVFl6TURjM01HSmtZamMzWW1FellqWm1OemcwWkRJMU5HWTJPR0UwTm1Sa05EQmhNZyIsImNsaWVudEV4dGVuc2lvbnMiOnt9LCJoYXNoQWxnb3JpdGhtIjoiU0hBLTI1NiIsIm9yaWdpbiI6Imh0dHBzOi8vc2FuZGJveC5tb2phbG9vcC5pbyIsInR5cGUiOiJ3ZWJhdXRobi5jcmVhdGUifQ=='
        },
        type: 'public-key'
      }
    }

    const customSiteVR: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
      verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
      // FIDO library actually signs the base64 hash of this challenge
      challenge: 'OWZhYjAxZTcwYjU4YzRhMzRmOWQwNzBmZjllZDFiNjc2NWVhMzA1NGI1MWZjZThjZGFjNDEyZDBmNmM2MWFhMQ',
      consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
      signedPayloadType: 'FIDO',
      fidoSignedPayload: {
        id: 'iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6_U00NfDa_Wxyti0uVwPzragBrzw',
        rawId: 'iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6/U00NfDa/Wxyti0uVwPzragBrzw==',
        response: {
          authenticatorData: 'y1+ZGYWlLBhlFSbz3enn0Sh1b1jKp63+LttwL5cw3XQBAAAAAg==',
          clientDataJSON:
            'eyJjaGFsbGVuZ2UiOiJUMWRhYUZscVFYaGFWR04zV1dwVk5GbDZVbWhOZWxKdFQxZFJkMDU2UW0xYWFteHNXa1JHYVU1cVl6Sk9WMVpvVFhwQk1VNUhTVEZOVjFwcVdsUm9hbHBIUm1wT1JFVjVXa1JDYlU1dFRUSk5WMFpvVFZFIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9zYW5kYm94Lm1vamFsb29wLmlvIiwidHlwZSI6IndlYmF1dGhuLmdldCJ9',
          signature: 'MEYCIQC3Igm0I4uFjJydEYIcDPn6Wq39fY0QyQdZu2pEwaaMoAIhAKb2B6XaVXKO+ORsUgP5Riw22rkvIhS6eb3KadyFfaos'
        },
        type: 'public-key'
      }
    }

    it('performs the attestation', async () => {
      // Arrange
      const attestationExpectations: ExpectedAttestationResult = {
        challenge,
        origin: 'https://sandbox.mojaloop.io',
        factor: 'either'
      }

      const f2l = new Fido2Lib()
      const clientAttestationResponse: AttestationResult = {
        id: str2ab(credential.fidoPayload!.id),
        rawId: str2ab(credential.fidoPayload!.rawId),
        response: {
          clientDataJSON: credential.fidoPayload!.response.clientDataJSON,
          attestationObject: credential.fidoPayload!.response.attestationObject
        }
      }

      // Act
      const result = await f2l.attestationResult(clientAttestationResponse, attestationExpectations)
      console.log('credentialPublicKeyPem:', result.authnrData.get('credentialPublicKeyPem'))

      // Assert
      // nothing threw!
    })

    it('performs the assertion', async () => {
      // Arrange
      const f2l = new Fido2Lib()
      const assertionExpectations: ExpectedAssertionResult = {
        // This must be base64 encoded,
        // as navigator.credentials.get base64 encodes the challenge
        challenge: btoa(customSiteVR.challenge),
        origin: 'https://sandbox.mojaloop.io',
        factor: 'either',
        // Get this from the log statement in the previous request
        publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEwFUUSiluKo+G1spBfvC+BSOPaZT7
9Yu8g/nn9AE8MJfu7MW0BPvSdSwGOpSzDIfo4klNP0X/Y9DF4qgtv2+wqg==
-----END PUBLIC KEY-----`,
        prevCounter: 0,
        userHandle: null
      }
      const authenticatorData = FidoUtils.stringToArrayBuffer(customSiteVR.fidoSignedPayload.response.authenticatorData)
      console.log('authenticatorData.length', authenticatorData.byteLength)
      const assertionResult: AssertionResult = {
        // fido2lib requires an ArrayBuffer, not just any old Buffer!
        id: FidoUtils.stringToArrayBuffer(customSiteVR.fidoSignedPayload.id),
        response: {
          clientDataJSON: customSiteVR.fidoSignedPayload.response.clientDataJSON,
          authenticatorData,
          signature: customSiteVR.fidoSignedPayload.response.signature,
          userHandle: customSiteVR.fidoSignedPayload.response.userHandle
        }
      }

      // Act
      await f2l.assertionResult(assertionResult, assertionExpectations) // will throw on error

      // Assert
    })
  })

  describe('yubikey site based attestation and assertion', () => {
    const credential: tpAPI.Schemas.VerifiedCredential = {
      credentialType: 'FIDO',
      status: 'VERIFIED',
      fidoPayload: {
        id: atob('Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA'),
        rawId: atob('Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA=='),
        response: {
          attestationObject:
            'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEgwRgIhAOrrUscl/GRHvjoAtJE6KbgQxUSj3vwp3Ztmh9nQEvuSAiEAgDjZEL8PKFvgJnX7JCk260lOeeht5Ffe/kmA9At17a9jeDVjgVkCwTCCAr0wggGloAMCAQICBAsFzVMwDQYJKoZIhvcNAQELBQAwLjEsMCoGA1UEAxMjWXViaWNvIFUyRiBSb290IENBIFNlcmlhbCA0NTcyMDA2MzEwIBcNMTQwODAxMDAwMDAwWhgPMjA1MDA5MDQwMDAwMDBaMG4xCzAJBgNVBAYTAlNFMRIwEAYDVQQKDAlZdWJpY28gQUIxIjAgBgNVBAsMGUF1dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xJzAlBgNVBAMMHll1YmljbyBVMkYgRUUgU2VyaWFsIDE4NDkyOTYxOTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCEab7G1iSXLCsEYX3wq46i0iBAUebEe//VV4H2XUb0rF2olLe5Z7OOFmSBbs+oov4/X/H2nXAVCcq5IWOWR/FqjbDBqMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS4xMBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEBSaICGO9kEzlriB+NW38fUwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAPv6j3z0q4HJXj34E0N1aS2jbAa/oYy4YtOC4c0MYkRlsGEvrwdUzoj13i7EECMG5qkFOdXaFWwk2lxizSK9c72ywMIZy1h+4vZuGoQqmgs6MLU7wkO1QVBj+U9TOHmJ6KPNyAwlY0I/6WRvEGIDhjooM7RqFgH+QlnFBegtFMhWzjcFHKiRJdkC06Gv+xPFUY5uFuOiAFJY2JDg1WQEr/Id8C0TsfaeU0gZUsprcHbpcUHvwym3zUrzN3nQNLqfhCCSizjlPkE0dmUFeOnxFtf4oepvL3GmOi9zVtHmKXO013oo1CQIKFLcmv785p0QHnLmPW53KCbfD67y9oq9pA2hhdXRoRGF0YVjExGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7dBAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD3Zt06R0Mb5mDHTSnGN0eovDx0XGarb0khbLCadDkGsHITDmAZ6T0OxPewj8v3Gk8TzWFSS/hO3E/xwZuLCLjSlAQIDJiABIVggiSfmVgOyesk2SDOaPhShPbnahfrl3Vs0iQUW6QF4IHUiWCDi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==',
          clientDataJSON:
            'eyJjaGFsbGVuZ2UiOiJBcEZqVmZSVFF3NV9OUjRZNXBvVHo4a3RkM2dhNGpJNUx5NjJfZzk3b0ZrIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0='
        },
        // // front end demo
        // id: atob('vwWPva1iiTJIk_c7n9a49spEtJZBqrn4SECerci0b-Ue-6Jv9_DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ'),
        // rawId: atob('vwWPva1iiTJIk/c7n9a49spEtJZBqrn4SECerci0b+Ue+6Jv9/DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ=='),
        // response: {
        //   attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIhAJEFVHrzmq90fdBVy4nOPc48vtvJVAyQleGVcp+nQ8lUAiB67XFnGhC7q7WI3NdcrCdqnewSjCfhqEvO+sbWKC60c2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAABFJogIY72QTOWuIH41bfx9QBAvwWPva1iiTJIk/c7n9a49spEtJZBqrn4SECerci0b+Ue+6Jv9/DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWaUBAgMmIAEhWCAITUwire20kCqzl0A3Fbpwx2cnSqwFfTgbA2b8+a/aUiJYIHRMWJlb4Lud02oWTdQ+fejwkVo17qD0KvrwwrZZxWIg'
        //   clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiTXpnd056QTFZMkU1TlRaaFlUZzBOMlE0T1dVMFlUUTBOR1JoT1dKbFpXUmpOR1EzTlRZNU1XSTBNV0l3WldNeE9EVTJZalJoWW1Sa05EbGhORE0yTUEiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjQyMTgxIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ==',
        // },
        type: 'public-key'
      }
    }

    const verificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
      verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
      // not a 'real' challenge from mojaloop, but taken from a demo credential here
      // https://demo.yubico.com/webauthn-technical/login
      challenge: 'quFYNCTWwfM6VDKmrxTT12zbSOhWJyWglzKoqF0PjMU=',
      consentId: '8d34f91d-d078-4077-8263-2c0498dhbjr',
      signedPayloadType: 'FIDO',
      fidoSignedPayload: {
        id: atob('Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA'),
        rawId: atob('Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA'),
        response: {
          authenticatorData: 'xGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7cBAAAABA==',
          clientDataJSON:
            'eyJjaGFsbGVuZ2UiOiJxdUZZTkNUV3dmTTZWREttcnhUVDEyemJTT2hXSnlXZ2x6S29xRjBQak1VIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uZ2V0In0=',
          signature: 'MEUCIQCb/nwG57/d8lWXfbBA7HtgIf8wM6A1XJ+LgZlEnClJBAIgKV8FAGkE9B8UXenmp589uTPgkDCJh5jiNMs+Tx2GQG8='
        },
        type: 'public-key'
      }
    }

    it('performs the attestation', async () => {
      // Arrange

      // A random challenge generated by yubikey demo site
      const challenge = 'ApFjVfRTQw5_NR4Y5poTz8ktd3ga4jI5Ly62_g97oFk'
      const attestationExpectations: ExpectedAttestationResult = {
        challenge,
        origin: 'https://demo.yubico.com',
        factor: 'either'
      }

      const f2l = new Fido2Lib()
      const clientAttestationResponse: AttestationResult = {
        id: str2ab(credential.fidoPayload!.id),
        rawId: str2ab(credential.fidoPayload!.rawId),
        response: {
          clientDataJSON: credential.fidoPayload!.response.clientDataJSON,
          attestationObject: credential.fidoPayload!.response.attestationObject
        }
      }

      // Act
      const result = await f2l.attestationResult(clientAttestationResponse, attestationExpectations)
      console.log('credentialPublicKeyPem:', result.authnrData.get('credentialPublicKeyPem'))

      // Assert
      // nothing threw!
    })

    it('performs the assertion', async () => {
      // Arrange
      const f2l = new Fido2Lib()
      const assertionExpectations: ExpectedAssertionResult = {
        challenge: verificationRequest.challenge,
        origin: 'https://demo.yubico.com',
        factor: 'either',
        // Get this from the log statement in the previous request
        publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEiSfmVgOyesk2SDOaPhShPbnahfrl
3Vs0iQUW6QF4IHXi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==
-----END PUBLIC KEY-----`,
        prevCounter: 0,
        userHandle: null
      }
      const authenticatorData = FidoUtils.stringToArrayBuffer(
        verificationRequest.fidoSignedPayload.response.authenticatorData
      )
      console.log('authenticatorData.length', authenticatorData.byteLength)
      const assertionResult: AssertionResult = {
        // fido2lib requires an ArrayBuffer, not just any old Buffer!
        id: FidoUtils.stringToArrayBuffer(verificationRequest.fidoSignedPayload.id),
        response: {
          clientDataJSON: verificationRequest.fidoSignedPayload.response.clientDataJSON,
          authenticatorData,
          signature: verificationRequest.fidoSignedPayload.response.signature,
          userHandle: verificationRequest.fidoSignedPayload.response.userHandle
        }
      }

      // Act
      await f2l.assertionResult(assertionResult, assertionExpectations) // will throw on error

      // Assert
    })
  })
})
