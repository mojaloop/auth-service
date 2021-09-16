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
  challenge: 'AAAAAAAAAAAAAAAAAAECAw',
  consentId: 'be433b9e-9473-4b7d-bdd5-ac5b42463afb',
  signedPayloadType: 'FIDO',
  signedPayload: {
    id: atob('4yGzY_utOB9mtwEXKOamlxOCkYJXNJF8S8lZ2-EpvEFwWSVLqx9OBkcWPDVvpBml5BTatEOjYZYG0M2WMLfW5w'),
    rawId: '4yGzY/utOB9mtwEXKOamlxOCkYJXNJF8S8lZ2+EpvEFwWSVLqx9OBkcWPDVvpBml5BTatEOjYZYG0M2WMLfW5w==',
    response: {
      authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAABg==',
      clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQUFBQUFBQUFBQUFBQUFBQUFBRUNBdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIxODEiLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ==',
      signature: 'MEUCIBX4G3vb/v+j0y0U+k47TBzbZLyqUXp/t+b MQ/yXb1ibAiEA9ylAn6jqHcHUK2j+RQwnr73wp3RqhKcaqTsh28AknF4='
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
    } catch (error){
      throw error
    }
  })

  it.only('assertion should succeed', async () => {
    // Arrange
    const f2l = new Fido2Lib()
    const assertionExpectations: ExpectedAssertionResult = {
      challenge: verificationRequest.challenge,
      origin: 'http://localhost:42181',
      factor: "either",
      // Get this from the log statement in the previous request
      publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAECE1MIq3ttJAqs5dANxW6cMdnJ0qs
BX04GwNm/Pmv2lJ0TFiZW+C7ndNqFk3UPn3o8JFaNe6g9Cr68MK2WcViIA==
-----END PUBLIC KEY-----`,
      prevCounter: 0,
      userHandle: null,
      // userHandle: request.signedPayload.response.userHandle || null
    };
    const assertionResult: AssertionResult = {
      // fido2lib requires an ArrayBuffer, not just any old Buffer!
      id: FidoUtils.stringToArrayBuffer(verificationRequest.signedPayload.id),
      response: {
        clientDataJSON: verificationRequest.signedPayload.response.clientDataJSON,
        authenticatorData: FidoUtils.stringToArrayBuffer(verificationRequest.signedPayload.response.authenticatorData),
        signature: verificationRequest.signedPayload.response.signature,
        userHandle: verificationRequest.signedPayload.response.userHandle
      }
    }
    
    // Act
    await f2l.assertionResult(assertionResult, assertionExpectations); // will throw on error

    // Assert
  })
})
