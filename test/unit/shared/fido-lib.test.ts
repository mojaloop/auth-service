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
import { thirdparty as tpAPI } from '@mojaloop/api-snippets';
import { canonicalize } from 'json-canonicalize'
import sha256 from 'crypto-js/sha256'
import { AttestationResult, ExpectedAttestationResult, Fido2Lib } from 'fido2-lib'
// @ts-ignore
import str2ab from 'string-to-arraybuffer'
// import { createHash } from 'crypto';
// import { TextDecoder } from 'util';


function decodeBase64String(str: string): string {
  const base64Buffer = Buffer.from(str, 'base64')
  return base64Buffer.toString('utf-8')
}

function encodeBase64String(str: string, encoding: BufferEncoding = 'utf-8'): string {
  let buff = Buffer.from(str, encoding)
  return buff.toString('base64');
}

/**
 * @function str2ab
 * @description Converts an string to an ArrayBuffer with UTF-16
 * @param {String} str
 */
function str2ab2(str: string): ArrayBuffer {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

const consentsPostRequestAUTH = {
  headers: {
    'fspiop-source': 'dfspA',
    'fspiop-destination': 'centralAuth'
  },
  params: {},
  payload: {
    consentId: 'ee54e4b1-180e-40a5-b9fd-d44b62587b89',
    scopes: [
      {
        accountId: 'f67170bc-3702-4786-90cd-023466b575ca',
        // TODO: missing in payload for some reason on front end client...
        // This isn't a big deal, as long as we derive the challenge in the same way.
        // actions: [
        //   'accounts.transfer',
        //   'accounts.getBalance'
        // ]
      },
    ],
  
    credential: {
      credentialType: 'FIDO',
      status: 'PENDING',
      payload: {
        id: 'bc4sVCF6pG6pZIrcqf10VRVnO7zlPLoz-QBtwGT3lWYlofe7C8ql8e1cIVac4uLBTtZRkFuufIkUI0ZRtmZlLA',
        rawId: Buffer.from([109, 206, 44, 84, 33, 122, 164, 110, 169, 100, 138, 220, 169, 253, 116, 85, 21, 103, 59, 188,
          229, 60, 186, 51, 249, 0, 109, 192, 100, 247, 149, 102, 37, 161, 247, 187, 11, 202, 165, 241,
          237, 92, 33, 86, 156, 226, 226, 193, 78, 214, 81, 144, 91, 174, 124, 137, 20, 35, 70, 81, 182,
          102, 101, 44]
        ).toString('base64'),
        response: {
          // clientDataJSON needs to be utf-8 not base64
          clientDataJSON: Buffer.from(
            [123, 34, 116, 121, 112, 101, 34,
              58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 99, 114, 101, 97, 116, 101, 34, 44, 34, 99,
              104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 77, 87, 73, 121, 77, 106, 107, 120, 78, 68,
              74, 107, 77, 84, 82, 107, 78, 122, 81, 121, 89, 122, 89, 50, 79, 84, 107, 51, 89, 106, 104,
              109, 89, 84, 104, 108, 79, 87, 78, 109, 79, 71, 82, 106, 78, 50, 70, 106, 78, 87, 74, 108, 89,
              84, 70, 105, 78, 84, 107, 53, 77, 84, 77, 121, 79, 84, 70, 106, 89, 109, 85, 49, 89, 50, 77,
              49, 77, 50, 81, 50, 89, 84, 77, 119, 77, 81, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58,
              34, 104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 52, 50, 49,
              56, 49, 34, 44, 34, 99, 114, 111, 115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108,
              115, 101, 125]
          ).toString('base64'),
          attestationObject: Buffer.from([163, 99, 102, 109, 116, 102, 112, 97, 99, 107,
            101, 100, 103, 97, 116, 116, 83, 116, 109, 116, 163, 99, 97, 108, 103, 38, 99, 115, 105, 103,
            88, 71, 48, 69, 2, 33, 0, 237, 32, 147, 105, 169, 186, 93, 64, 231, 25, 97, 216, 64, 138, 164,
            241, 137, 126, 232, 222, 125, 201, 102, 215, 154, 77, 148, 3, 130, 8, 71, 182, 2, 32, 113, 230,
            105, 161, 194, 118, 114, 109, 78, 121, 155, 41, 115, 118, 24, 8, 28, 60, 141, 151, 188, 208, 6,
            78, 146, 216, 162, 254, 122, 77, 219, 165, 99, 120, 53, 99, 129, 89, 2, 193, 48, 130, 2, 189,
            48, 130, 1, 165, 160, 3, 2, 1, 2, 2, 4, 11, 5, 205, 83, 48, 13, 6, 9, 42, 134, 72, 134, 247,
            13, 1, 1, 11, 5, 0, 48, 46, 49, 44, 48, 42, 6, 3, 85, 4, 3, 19, 35, 89, 117, 98, 105, 99, 111,
            32, 85, 50, 70, 32, 82, 111, 111, 116, 32, 67, 65, 32, 83, 101, 114, 105, 97, 108, 32, 52, 53,
            55, 50, 48, 48, 54, 51, 49, 48, 32, 23, 13, 49, 52, 48, 56, 48, 49, 48, 48, 48, 48, 48, 48, 90,
            24, 15, 50, 48, 53, 48, 48, 57, 48, 52, 48, 48, 48, 48, 48, 48, 90, 48, 110, 49, 11, 48, 9, 6,
            3, 85, 4, 6, 19, 2, 83, 69, 49, 18, 48, 16, 6, 3, 85, 4, 10, 12, 9, 89, 117, 98, 105, 99, 111,
            32, 65, 66, 49, 34, 48, 32, 6, 3, 85, 4, 11, 12, 25, 65, 117, 116, 104, 101, 110, 116, 105, 99,
            97, 116, 111, 114, 32, 65, 116, 116, 101, 115, 116, 97, 116, 105, 111, 110, 49, 39, 48, 37, 6,
            3, 85, 4, 3, 12, 30, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 69, 69, 32, 83, 101, 114,
            105, 97, 108, 32, 49, 56, 52, 57, 50, 57, 54, 49, 57, 48, 89, 48, 19, 6, 7, 42, 134, 72, 206,
            61, 2, 1, 6, 8, 42, 134, 72, 206, 61, 3, 1, 7, 3, 66, 0, 4, 33, 26, 111, 177, 181, 137, 37,
            203, 10, 193, 24, 95, 124, 42, 227, 168, 180, 136, 16, 20, 121, 177, 30, 255, 245, 85, 224,
            125, 151, 81, 189, 43, 23, 106, 37, 45, 238, 89, 236, 227, 133, 153, 32, 91, 179, 234, 40, 191,
            143, 215, 252, 125, 167, 92, 5, 66, 114, 174, 72, 88, 229, 145, 252, 90, 163, 108, 48, 106, 48,
            34, 6, 9, 43, 6, 1, 4, 1, 130, 196, 10, 2, 4, 21, 49, 46, 51, 46, 54, 46, 49, 46, 52, 46, 49,
            46, 52, 49, 52, 56, 50, 46, 49, 46, 49, 48, 19, 6, 11, 43, 6, 1, 4, 1, 130, 229, 28, 2, 1, 1,
            4, 4, 3, 2, 4, 48, 48, 33, 6, 11, 43, 6, 1, 4, 1, 130, 229, 28, 1, 1, 4, 4, 18, 4, 16, 20, 154,
            32, 33, 142, 246, 65, 51, 150, 184, 129, 248, 213, 183, 241, 245, 48, 12, 6, 3, 85, 29, 19, 1,
            1, 255, 4, 2, 48, 0, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 3, 130, 1, 1, 0,
            62, 254, 163, 223, 61, 42, 224, 114, 87, 143, 126, 4, 208, 221, 90, 75, 104, 219, 1, 175, 232,
            99, 46, 24, 180, 224, 184, 115, 67, 24, 145, 25, 108, 24, 75, 235, 193, 213, 51, 162, 61, 119,
            139, 177, 4, 8, 193, 185, 170, 65, 78, 117, 118, 133, 91, 9, 54, 151, 24, 179, 72, 175, 92,
            239, 108, 176, 48, 134, 114, 214, 31, 184, 189, 155, 134, 161, 10, 166, 130, 206, 140, 45, 78,
            240, 144, 237, 80, 84, 24, 254, 83, 212, 206, 30, 98, 122, 40, 243, 114, 3, 9, 88, 208, 143,
            250, 89, 27, 196, 24, 128, 225, 142, 138, 12, 237, 26, 133, 128, 127, 144, 150, 113, 65, 122,
            11, 69, 50, 21, 179, 141, 193, 71, 42, 36, 73, 118, 64, 180, 232, 107, 254, 196, 241, 84, 99,
            155, 133, 184, 232, 128, 20, 150, 54, 36, 56, 53, 89, 1, 43, 252, 135, 124, 11, 68, 236, 125,
            167, 148, 210, 6, 84, 178, 154, 220, 29, 186, 92, 80, 123, 240, 202, 109, 243, 82, 188, 205,
            222, 116, 13, 46, 167, 225, 8, 36, 162, 206, 57, 79, 144, 77, 29, 153, 65, 94, 58, 124, 69,
            181, 254, 40, 122, 155, 203, 220, 105, 142, 139, 220, 213, 180, 121, 138, 92, 237, 53, 222,
            138, 53, 9, 2, 10, 20, 183, 38, 191, 191, 57, 167, 68, 7, 156, 185, 143, 91, 157, 202, 9, 183,
            195, 235, 188, 189, 162, 175, 105, 3, 104, 97, 117, 116, 104, 68, 97, 116, 97, 88, 196, 73,
            150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162,
            134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 65, 0, 0, 0, 1, 20, 154, 32, 33, 142, 246,
            65, 51, 150, 184, 129, 248, 213, 183, 241, 245, 0, 64, 109, 206, 44, 84, 33, 122, 164, 110,
            169, 100, 138, 220, 169, 253, 116, 85, 21, 103, 59, 188, 229, 60, 186, 51, 249, 0, 109, 192,
            100, 247, 149, 102, 37, 161, 247, 187, 11, 202, 165, 241, 237, 92, 33, 86, 156, 226, 226, 193,
            78, 214, 81, 144, 91, 174, 124, 137, 20, 35, 70, 81, 182, 102, 101, 44, 165, 1, 2, 3, 38, 32,
            1, 33, 88, 32, 34, 215, 20, 203, 108, 103, 229, 193, 183, 110, 158, 204, 226, 7, 40, 245, 119,
            202, 255, 194, 142, 92, 163, 245, 26, 87, 247, 199, 242, 67, 10, 209, 34, 88, 32, 145, 146, 55,
            158, 147, 213, 55, 132, 16, 82, 94, 134, 211, 205, 160, 253, 43, 116, 27, 173, 37, 250, 216,
            192, 115, 215, 68, 191, 225, 193, 221, 46]
          ).toString('base64')
        },
        type: 'public-key'
      }
    }
  }
}

function deriveChallenge(consentsPostRequest: tpAPI.Schemas.ConsentsPostRequestAUTH): string {
  if (!consentsPostRequest) {
    throw new Error('PISPLinkingModel.deriveChallenge: \'consentRequestsPostRequest\' parameter is required')
  }

  const rawChallenge = {
    consentId: consentsPostRequest.consentId,
    scopes: consentsPostRequest.scopes
  }

  const RFC8785String = canonicalize(rawChallenge)
  return sha256(RFC8785String).toString()
}


// test the fido2-lib for peace of mind
describe('fido-lib', (): void => {
  it('should derive the challenge correctly', () => {
    // Arrange
    const expected = '1b229142d14d742c66997b8fa8e9cf8dc7ac5bea1b59913291cbe5cc53d6a301'
    
    // Act
    const challenge = deriveChallenge(consentsPostRequestAUTH.payload as tpAPI.Schemas.ConsentsPostRequestAUTH)
    
    // Assert
    expect(challenge).toStrictEqual(expected)
  })

  it('should decode the clientDataJSON', () => {
    // Arrange
    const expected = { 
      "type": "webauthn.create", 
      "challenge": "MWIyMjkxNDJkMTRkNzQyYzY2OTk3YjhmYThlOWNmOGRjN2FjNWJlYTFiNTk5MTMyOTFjYmU1Y2M1M2Q2YTMwMQ",
      "origin": "http://localhost:42181", 
      "crossOrigin": false 
    }

    // Act
  
    // We have to do a bit of fussing around here - convert from a base64 encoded string to a JSON string...
    const decodedJsonString = decodeBase64String(consentsPostRequestAUTH.payload.credential.payload.response.clientDataJSON)
    const parsedClientData = JSON.parse(decodedJsonString);
    console.log('parsed client data', expected)
    
    // Assert
    expect(parsedClientData).toStrictEqual(expected)
  })

  it('attestation should succeed', async (): Promise<void> => {
    // The base challenge that was derived
    const inputChallenge = '1b229142d14d742c66997b8fa8e9cf8dc7ac5bea1b59913291cbe5cc53d6a301'
    // encode to a utf-8 base64 format for Fido2Lib to like it:
    const encodedInputChallenge = encodeBase64String(inputChallenge)
    const attestationExpectations: ExpectedAttestationResult = {
      challenge: encodedInputChallenge,
      origin: "http://localhost:42181",
      factor: "either"
    }

    
    const f2l = new Fido2Lib();
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
      ); // will throw on error
      console.log(regResult)
    } catch (error){
      console.log(error)
      throw error
    }
  })
})
