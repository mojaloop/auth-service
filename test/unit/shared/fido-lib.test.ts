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
import { AttestationResult, ExpectedAttestationResult, Fido2Lib } from 'fido2-lib'
import str2ab from 'string-to-arraybuffer'
import { deriveChallenge } from '~/domain/challenge'
import { decodeBase64String, encodeBase64String } from '~/domain/buffer'

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

const consentsPostRequestAUTH = {
  headers: {
    'fspiop-source': 'dfspA',
    'fspiop-destination': 'centralAuth'
  },
  params: {},
  payload: {
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
        id: 'HskU2gw4np09IUtYNHnxMM696jJHqvccUdBmd0xP6XEWwH0xLei1PUzDJCM19SZ3A2Ex0fNLw0nc2hrIlFnAtw',
        rawId: Buffer.from([30, 201, 20, 218, 12, 56, 158, 157, 61, 33, 75, 88, 52, 121, 241, 48, 206, 189,
          234, 50, 71, 170, 247, 28, 81, 208, 102, 119, 76, 79, 233, 113, 22, 192, 125, 49, 45,
          232, 181, 61, 76, 195, 36, 35, 53, 245, 38, 119, 3, 97, 49, 209, 243, 75, 195, 73, 220,
          218, 26, 200, 148, 89, 192, 183]).toString('base64'),
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
}

// test the fido2-lib for peace of mind
describe('fido-lib', (): void => {
  it('should derive the challenge correctly', () => {
    // Arrange
    const expected = 'c4adabb33e9306b038088132affcde556c50d82f603f47711a9510bf3beef6d6'

    // Act
    const challenge = deriveChallenge(consentsPostRequestAUTH.payload as tpAPI.Schemas.ConsentsPostRequestAUTH)

    // Assert
    expect(challenge).toStrictEqual(expected)
  })

  it('should decode the clientDataJSON', () => {
    // Arrange
    const expected = {
      "type": "webauthn.create",
      "challenge": "YzRhZGFiYjMzZTkzMDZiMDM4MDg4MTMyYWZmY2RlNTU2YzUwZDgyZjYwM2Y0NzcxMWE5NTEwYmYzYmVlZjZkNg",
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
    const inputChallenge = 'c4adabb33e9306b038088132affcde556c50d82f603f47711a9510bf3beef6d6'
    // encode to a utf-8 base64 format for Fido2Lib to like it:
    const encodedInputChallenge = encodeBase64String(inputChallenge)
    const attestationExpectations: ExpectedAttestationResult = {
      challenge: encodedInputChallenge,
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
      var regResult = await f2l.attestationResult(
        clientAttestationResponse,
        attestationExpectations
      )
      console.log(regResult)
    } catch (error){
      console.log(error)
      throw error
    }
  })
})
