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

 - Kevin Leyow <kevin.leyow@modusbox.com>
 --------------
 ******/
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { AssertionResult, AttestationResult, ExpectedAssertionResult, ExpectedAttestationResult, Fido2Lib } from 'fido2-lib'
import str2ab from 'string-to-arraybuffer'
import { deriveChallenge } from '~/domain/challenge'
import { decodeBase64String } from '~/domain/buffer'
import FidoUtils from '~/shared/fido-utils'

function ab2str(buf: ArrayBuffer) {
  var str = "";
  new Uint8Array(buf).forEach((ch) => {
    str += String.fromCharCode(ch);
  });
  return str;
}

const btoa = require('btoa')

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
const atob = require('atob')


const consentsPostRequestAUTH = {
  headers: {
    'fspiop-source': 'dfspA',
    'fspiop-destination': 'centralAuth'
  },
  params: {},
  payload: {
    consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
    scopes: [
      { actions: ['accounts.getBalance', 'accounts.transfer'], accountId: '412ddd18-07a0-490d-814d-27d0e9af9982' },
      { actions: ['accounts.getBalance'], accountId: '10e88508-e542-4630-be7f-bc0076029ea7' }
    ],
    credential: {
      credentialType: 'FIDO',
      status: 'VERIFIED',
      payload: {
        id: atob('vwWPva1iiTJIk_c7n9a49spEtJZBqrn4SECerci0b-Ue-6Jv9_DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ'),
        rawId: atob('vwWPva1iiTJIk/c7n9a49spEtJZBqrn4SECerci0b+Ue+6Jv9/DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWQ=='),
        response: {
          clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiTXpnd056QTFZMkU1TlRaaFlUZzBOMlE0T1dVMFlUUTBOR1JoT1dKbFpXUmpOR1EzTlRZNU1XSTBNV0l3WldNeE9EVTJZalJoWW1Sa05EbGhORE0yTUEiLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjQyMTgxIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ==',
          attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIhAJEFVHrzmq90fdBVy4nOPc48vtvJVAyQleGVcp+nQ8lUAiB67XFnGhC7q7WI3NdcrCdqnewSjCfhqEvO+sbWKC60c2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAABFJogIY72QTOWuIH41bfx9QBAvwWPva1iiTJIk/c7n9a49spEtJZBqrn4SECerci0b+Ue+6Jv9/DZo3rNX02Lq5PU4N5kGlkEPAkIoZ3499AzWaUBAgMmIAEhWCAITUwire20kCqzl0A3Fbpwx2cnSqwFfTgbA2b8+a/aUiJYIHRMWJlb4Lud02oWTdQ+fejwkVo17qD0KvrwwrZZxWIg',
        },
        type: 'public-key'
      }
    }
  }
}

const verificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  // This is stubbed out for pisp-demo-svc
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

// test the fido2-lib for peace of mind
describe('fido-lib', (): void => {
  it('should derive the challenge correctly', () => {
    // Arrange
    const expected = 'MzgwNzA1Y2E5NTZhYTg0N2Q4OWU0YTQ0NGRhOWJlZWRjNGQ3NTY5MWI0MWIwZWMxODU2YjRhYmRkNDlhNDM2MA=='

    // Act
    const challenge = deriveChallenge(consentsPostRequestAUTH.payload as tpAPI.Schemas.ConsentsPostRequestAUTH)

    // Assert
    expect(challenge).toStrictEqual(expected)
  })

  it('should decode the clientDataJSON', () => {
    // Arrange
    const expected = {
      "type": "webauthn.create",
      "challenge": "MzgwNzA1Y2E5NTZhYTg0N2Q4OWU0YTQ0NGRhOWJlZWRjNGQ3NTY5MWI0MWIwZWMxODU2YjRhYmRkNDlhNDM2MA",
      "origin": "http://localhost:42181",
      "crossOrigin": false,
    }

    // Act

    // We have to do a bit of fussing around here - convert from a base64 encoded string to a JSON string...
    const decodedJsonString = decodeBase64String(consentsPostRequestAUTH.payload.credential.payload.response.clientDataJSON)
    const parsedClientData = JSON.parse(decodedJsonString)

    // Assert
    expect(parsedClientData).toStrictEqual(expected)
  })

  it('attestation should succeed', async (): Promise<void> => {
    // The base challenge that was derived
    const challenge = 'MzgwNzA1Y2E5NTZhYTg0N2Q4OWU0YTQ0NGRhOWJlZWRjNGQ3NTY5MWI0MWIwZWMxODU2YjRhYmRkNDlhNDM2MA=='
    const attestationExpectations: ExpectedAttestationResult = {
      challenge,
      origin: "http://localhost:42181",
      factor: "either"
    }

    const f2l = new Fido2Lib()
    const clientAttestationResponse: AttestationResult = {
      id: str2ab(consentsPostRequestAUTH.payload.credential.payload.id),
      rawId: str2ab(consentsPostRequestAUTH.payload.credential.payload.rawId),
      response: {
        clientDataJSON: consentsPostRequestAUTH.payload.credential.payload.response.clientDataJSON,
        attestationObject: consentsPostRequestAUTH.payload.credential.payload.response.attestationObject,
      }
    }
    try {
      const result = await f2l.attestationResult(
        clientAttestationResponse,
        attestationExpectations
      )
      console.log('credentialPublicKeyPem:', result.authnrData.get('credentialPublicKeyPem'))
      
      const credIdAB = result.authnrData.get('credId')
      const credId = btoa(ab2str(credIdAB))
      console.log('credId:', credId)
    } catch (error){
      throw error
    }
  })

  it('assertion should succeed', async () => {
    // Arrange
    const f2l = new Fido2Lib()
    const assertionExpectations: ExpectedAssertionResult = {
      challenge: verificationRequest.challenge,
      origin: 'http://localhost:42181',
      // fido2lib infers this from origin, so we don't need to set it
      // rpId: 'localhost',
      factor: "either",
      // Get this from the log statement in the previous request
      publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAECE1MIq3ttJAqs5dANxW6cMdnJ0qs
BX04GwNm/Pmv2lJ0TFiZW+C7ndNqFk3UPn3o8JFaNe6g9Cr68MK2WcViIA==
-----END PUBLIC KEY-----`,
      prevCounter: 0,
      userHandle: null,
    };
    const authenticatorData = FidoUtils.stringToArrayBuffer(verificationRequest.signedPayload.response.authenticatorData)
    console.log('authenticatorData.length', authenticatorData.byteLength)
    const assertionResult: AssertionResult = {
      // fido2lib requires an ArrayBuffer, not just any old Buffer!
      id: FidoUtils.stringToArrayBuffer(verificationRequest.signedPayload.id),
      response: {
        clientDataJSON: verificationRequest.signedPayload.response.clientDataJSON,
        authenticatorData,
        signature: verificationRequest.signedPayload.response.signature,
        userHandle: verificationRequest.signedPayload.response.userHandle
      }
    }
    
    // Act
    await f2l.assertionResult(assertionResult, assertionExpectations); // will throw on error

    // Assert
  })

  
  describe('custom site based attestation and assertion', () => {
    const consent = { "consentId": "46876aac-5db8-4353-bb3c-a6a905843ce7", "consentRequestId": "c51ec534-ee48-4575-b6a9-ead2955b8069", "scopes": [{ "accountId": "dfspa.username.5678", "actions": ["accounts.transfer"] }] }
    const challenge = deriveChallenge(consent as unknown as tpAPI.Schemas.ConsentsPostRequestAUTH)
    const credential: tpAPI.Schemas.VerifiedCredential = {
      credentialType: 'FIDO',
      status: 'VERIFIED',
      payload: {
        "id": "iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6_U00NfDa_Wxyti0uVwPzragBrzw",
        "rawId": "iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6/U00NfDa/Wxyti0uVwPzragBrzw==",
        "response": {
          "attestationObject": "o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEcwRQIgC8d5Y5Tfs4nNybpZT97j5ZVuTNFu1AWWwqpR8em4LJcCIQDDzayDA6lzgrbB3jDMM2/NI70TtZux2T3lIWMK8IGxr2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMTLX5kZhaUsGGUVJvPd6efRKHVvWMqnrf4u23AvlzDddEEAAAAAAAAAAAAAAAAAAAAAAAAAAABAiehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6/U00NfDa/Wxyti0uVwPzragBrz6UBAgMmIAEhWCDAVRRKKW4qj4bWykF+8L4FI49plPv1i7yD+ef0ATwwlyJYIO7sxbQE+9J1LAY6lLMMh+jiSU0/Rf9j0MXiqC2/b7Cq",
          "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJORGxqT1RjeFltWXdZVFExWm1Ka1pUa3pOek13Tm1SalpUazNZVFl6TURjM01HSmtZamMzWW1FellqWm1OemcwWkRJMU5HWTJPR0UwTm1Sa05EQmhNZyIsImNsaWVudEV4dGVuc2lvbnMiOnt9LCJoYXNoQWxnb3JpdGhtIjoiU0hBLTI1NiIsIm9yaWdpbiI6Imh0dHBzOi8vc2FuZGJveC5tb2phbG9vcC5pbyIsInR5cGUiOiJ3ZWJhdXRobi5jcmVhdGUifQ=="
        },
        "type": "public-key"
      }
    }

    const customSiteVR: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
      verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
      // FIDO library actually signs the base64 hash of this challenge
      challenge: 'OWZhYjAxZTcwYjU4YzRhMzRmOWQwNzBmZjllZDFiNjc2NWVhMzA1NGI1MWZjZThjZGFjNDEyZDBmNmM2MWFhMQ',
      consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
      signedPayloadType: 'FIDO',
      signedPayload: {
        "id": "iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6_U00NfDa_Wxyti0uVwPzragBrzw",
        "rawId": "iehRZTiFY7bRoBOKSAZDOgLkHKmLA3O90Aq1WZBlqjQjDmemdSjlFUvB2g6/U00NfDa/Wxyti0uVwPzragBrzw==",
        "response": {
          "authenticatorData": "y1+ZGYWlLBhlFSbz3enn0Sh1b1jKp63+LttwL5cw3XQBAAAAAg==",
          "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJUMWRhYUZscVFYaGFWR04zV1dwVk5GbDZVbWhOZWxKdFQxZFJkMDU2UW0xYWFteHNXa1JHYVU1cVl6Sk9WMVpvVFhwQk1VNUhTVEZOVjFwcVdsUm9hbHBIUm1wT1JFVjVXa1JDYlU1dFRUSk5WMFpvVFZFIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9zYW5kYm94Lm1vamFsb29wLmlvIiwidHlwZSI6IndlYmF1dGhuLmdldCJ9",
          "signature": "MEYCIQC3Igm0I4uFjJydEYIcDPn6Wq39fY0QyQdZu2pEwaaMoAIhAKb2B6XaVXKO+ORsUgP5Riw22rkvIhS6eb3KadyFfaos"
        },
        "type": "public-key"
      }
    }

    it('performs the attestation', async () => {
      // Arrange
      const attestationExpectations: ExpectedAttestationResult = {
        challenge,
        origin: "https://sandbox.mojaloop.io",
        factor: "either"
      }

      const f2l = new Fido2Lib()
      const clientAttestationResponse: AttestationResult = {
        id: str2ab(credential.payload.id),
        rawId: str2ab(credential.payload.rawId),
        response: {
          clientDataJSON: credential.payload.response.clientDataJSON,
          attestationObject: credential.payload.response.attestationObject,
        }
      }

      // Act
      const result = await f2l.attestationResult(
        clientAttestationResponse,
        attestationExpectations
      )
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
        origin: "https://sandbox.mojaloop.io",
        factor: "either",
        // Get this from the log statement in the previous request
        publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEwFUUSiluKo+G1spBfvC+BSOPaZT7
9Yu8g/nn9AE8MJfu7MW0BPvSdSwGOpSzDIfo4klNP0X/Y9DF4qgtv2+wqg==
-----END PUBLIC KEY-----`,
        prevCounter: 0,
        userHandle: null,
      };
      const authenticatorData = FidoUtils.stringToArrayBuffer(customSiteVR.signedPayload.response.authenticatorData)
      console.log('authenticatorData.length', authenticatorData.byteLength)
      const assertionResult: AssertionResult = {
        // fido2lib requires an ArrayBuffer, not just any old Buffer!
        id: FidoUtils.stringToArrayBuffer(customSiteVR.signedPayload.id),
        response: {
          clientDataJSON: customSiteVR.signedPayload.response.clientDataJSON,
          authenticatorData,
          signature: customSiteVR.signedPayload.response.signature,
          userHandle: customSiteVR.signedPayload.response.userHandle
        }
      }

      // Act
      await f2l.assertionResult(assertionResult, assertionExpectations); // will throw on error

      // Assert
    })
  })


  describe('yubikey site based attestation and assertion', () => {
    const credential: tpAPI.Schemas.VerifiedCredential = {
      credentialType: 'FIDO',
      status: 'VERIFIED',
      payload: {
        "id": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA"),
        "rawId": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA=="),
        "response": {
          "attestationObject": "o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEgwRgIhAOrrUscl/GRHvjoAtJE6KbgQxUSj3vwp3Ztmh9nQEvuSAiEAgDjZEL8PKFvgJnX7JCk260lOeeht5Ffe/kmA9At17a9jeDVjgVkCwTCCAr0wggGloAMCAQICBAsFzVMwDQYJKoZIhvcNAQELBQAwLjEsMCoGA1UEAxMjWXViaWNvIFUyRiBSb290IENBIFNlcmlhbCA0NTcyMDA2MzEwIBcNMTQwODAxMDAwMDAwWhgPMjA1MDA5MDQwMDAwMDBaMG4xCzAJBgNVBAYTAlNFMRIwEAYDVQQKDAlZdWJpY28gQUIxIjAgBgNVBAsMGUF1dGhlbnRpY2F0b3IgQXR0ZXN0YXRpb24xJzAlBgNVBAMMHll1YmljbyBVMkYgRUUgU2VyaWFsIDE4NDkyOTYxOTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCEab7G1iSXLCsEYX3wq46i0iBAUebEe//VV4H2XUb0rF2olLe5Z7OOFmSBbs+oov4/X/H2nXAVCcq5IWOWR/FqjbDBqMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS4xMBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEBSaICGO9kEzlriB+NW38fUwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAPv6j3z0q4HJXj34E0N1aS2jbAa/oYy4YtOC4c0MYkRlsGEvrwdUzoj13i7EECMG5qkFOdXaFWwk2lxizSK9c72ywMIZy1h+4vZuGoQqmgs6MLU7wkO1QVBj+U9TOHmJ6KPNyAwlY0I/6WRvEGIDhjooM7RqFgH+QlnFBegtFMhWzjcFHKiRJdkC06Gv+xPFUY5uFuOiAFJY2JDg1WQEr/Id8C0TsfaeU0gZUsprcHbpcUHvwym3zUrzN3nQNLqfhCCSizjlPkE0dmUFeOnxFtf4oepvL3GmOi9zVtHmKXO013oo1CQIKFLcmv785p0QHnLmPW53KCbfD67y9oq9pA2hhdXRoRGF0YVjExGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7dBAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD3Zt06R0Mb5mDHTSnGN0eovDx0XGarb0khbLCadDkGsHITDmAZ6T0OxPewj8v3Gk8TzWFSS/hO3E/xwZuLCLjSlAQIDJiABIVggiSfmVgOyesk2SDOaPhShPbnahfrl3Vs0iQUW6QF4IHUiWCDi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==",
          "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJBcEZqVmZSVFF3NV9OUjRZNXBvVHo4a3RkM2dhNGpJNUx5NjJfZzk3b0ZrIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0="
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
      signedPayload: {
        "id": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA"),
        "rawId": atob("Pdm3TpHQxvmYMdNKcY3R6i8PHRcZqtvSSFssJp0OQawchMOYBnpPQ7E97CPy_caTxPNYVJL-E7cT_HBm4sIuNA"),
        "response": {
          "authenticatorData": "xGzvgq0bVGR3WR0Aiwh1nsPm0uy085R0v+ppaZJdA7cBAAAABA==",
          "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJxdUZZTkNUV3dmTTZWREttcnhUVDEyemJTT2hXSnlXZ2x6S29xRjBQak1VIiwiY2xpZW50RXh0ZW5zaW9ucyI6e30sImhhc2hBbGdvcml0aG0iOiJTSEEtMjU2Iiwib3JpZ2luIjoiaHR0cHM6Ly9kZW1vLnl1Ymljby5jb20iLCJ0eXBlIjoid2ViYXV0aG4uZ2V0In0=",
          "signature": "MEUCIQCb/nwG57/d8lWXfbBA7HtgIf8wM6A1XJ+LgZlEnClJBAIgKV8FAGkE9B8UXenmp589uTPgkDCJh5jiNMs+Tx2GQG8="
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
        origin: "https://demo.yubico.com",
        factor: "either"
      }

      const f2l = new Fido2Lib()
      const clientAttestationResponse: AttestationResult = {
        id: str2ab(credential.payload.id),
        rawId: str2ab(credential.payload.rawId),
        response: {
          clientDataJSON: credential.payload.response.clientDataJSON,
          attestationObject: credential.payload.response.attestationObject,
        }
      }
      
      // Act
      const result = await f2l.attestationResult(
        clientAttestationResponse,
        attestationExpectations
      )
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
        factor: "either",
        // Get this from the log statement in the previous request
        publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEiSfmVgOyesk2SDOaPhShPbnahfrl
3Vs0iQUW6QF4IHXi6beycQU49cvsW32MNlAqXxGJ7uaXY06NOKGq1HraxQ==
-----END PUBLIC KEY-----`,
        prevCounter: 0,
        userHandle: null,
      };
      const authenticatorData = FidoUtils.stringToArrayBuffer(verificationRequest.signedPayload.response.authenticatorData)
      console.log('authenticatorData.length', authenticatorData.byteLength)
      const assertionResult: AssertionResult = {
        // fido2lib requires an ArrayBuffer, not just any old Buffer!
        id: FidoUtils.stringToArrayBuffer(verificationRequest.signedPayload.id),
        response: {
          clientDataJSON: verificationRequest.signedPayload.response.clientDataJSON,
          authenticatorData,
          signature: verificationRequest.signedPayload.response.signature,
          userHandle: verificationRequest.signedPayload.response.userHandle
        }
      }

      // Act
      await f2l.assertionResult(assertionResult, assertionExpectations); // will throw on error

      // Assert
    })
  })
})
