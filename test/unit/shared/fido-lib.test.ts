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
import { createHash } from 'crypto';
// import { TextDecoder } from 'util';


// function decodeBase64String(str: string): string {
//   const base64Buffer = Buffer.from(str, 'base64')
//   return base64Buffer.toString('utf-8')
// }

// function encodeBase64String(str: string, encoding: BufferEncoding = 'utf-8'): string {
//   let buff = Buffer.from(str, encoding)
//   return buff.toString('base64');
// }

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
    consentId: 'ecd2f34c-ef5a-436c-a85f-9f483ad95447',
    scopes: [
      {
        accountId: '7c2c14e6-723f-4aa3-bb04-51c94ed43618',
        // TODO: missing in payload for some reason...
        // actions: [
        //   'accounts.transfer',
        //   'accounts.getBalance'
        // ]
      },
      {
        accountId: 'bad3a96f-a663-4b22-893f-b5422fe7a530',
        // TODO: missing in payload for some reason...
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
        id: 'X8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3Q',
        rawId: Buffer.from([
          95, 198, 144, 115, 197, 160, 32, 232, 152, 206, 132, 72, 41, 180, 216, 37, 217, 115, 49, 159, 252, 206,
          141, 217, 136, 130, 247, 70, 248, 127, 56, 215, 235, 246, 70, 109, 185, 208, 176, 96, 238, 61, 181,
          101, 100, 142, 2, 70, 200, 148, 169, 162, 142, 154, 157, 16, 85, 36, 103, 90, 208, 186, 226, 221]
        ).toString('base64'),
        response: {
          // clientDataJSON needs to be utf-8 not base64
          clientDataJSON: Buffer.from(
            [123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98,
              97, 117, 116, 104, 110, 46, 99, 114, 101, 97, 116, 101, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110,
              103, 101, 34, 58, 34, 77, 103, 65, 51, 65, 68, 103, 65, 78, 81, 66, 106, 65, 68, 73, 65, 90, 65, 65,
              53, 65, 68, 107, 65, 89, 81, 65, 48, 65, 71, 77, 65, 77, 81, 65, 53, 65, 71, 81, 65, 77, 81, 66, 104,
              65, 68, 103, 65, 78, 119, 66, 107, 65, 68, 77, 65, 78, 65, 66, 109, 65, 71, 81, 65, 77, 65, 66, 106,
              65, 68, 69, 65, 77, 65, 66, 104, 65, 71, 81, 65, 77, 65, 66, 105, 65, 68, 85, 65, 77, 103, 65, 51,
              65, 68, 73, 65, 77, 81, 66, 106, 65, 71, 89, 65, 77, 119, 66, 106, 65, 68, 103, 65, 77, 65, 65, 121,
              65, 68, 103, 65, 79, 65, 66, 106, 65, 68, 73, 65, 79, 81, 66, 107, 65, 71, 69, 65, 78, 81, 66, 105,
              65, 68, 65, 65, 90, 81, 66, 105, 65, 71, 85, 65, 90, 103, 65, 50, 65, 68, 99, 65, 79, 65, 65, 122,
              65, 68, 81, 65, 77, 65, 65, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112,
              58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 53, 48, 48, 48, 34, 44, 34, 99, 114, 111,
              115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 125]
          ).toString('base64'),
          attestationObject: Buffer.from(
            [163, 99, 102, 109, 116, 102, 112, 97, 99, 107, 101, 100, 103, 97, 116,
              116, 83, 116, 109, 116, 163, 99, 97, 108, 103, 38, 99, 115, 105, 103, 88, 71, 48, 69, 2, 32, 30, 175,
              73, 42, 152, 191, 108, 89, 231, 187, 75, 149, 87, 233, 58, 38, 49, 223, 5, 193, 112, 89, 20, 66, 92,
              149, 165, 122, 56, 51, 36, 181, 2, 33, 0, 246, 136, 227, 141, 25, 119, 155, 56, 44, 106, 223, 181,
              42, 190, 233, 177, 11, 247, 73, 207, 86, 183, 83, 209, 117, 13, 172, 85, 48, 89, 243, 127, 99, 120,
              53, 99, 129, 89, 2, 193, 48, 130, 2, 189, 48, 130, 1, 165, 160, 3, 2, 1, 2, 2, 4, 11, 5, 205, 83, 48,
              13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 48, 46, 49, 44, 48, 42, 6, 3, 85, 4, 3, 19, 35,
              89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 82, 111, 111, 116, 32, 67, 65, 32, 83, 101, 114, 105,
              97, 108, 32, 52, 53, 55, 50, 48, 48, 54, 51, 49, 48, 32, 23, 13, 49, 52, 48, 56, 48, 49, 48, 48, 48,
              48, 48, 48, 90, 24, 15, 50, 48, 53, 48, 48, 57, 48, 52, 48, 48, 48, 48, 48, 48, 90, 48, 110, 49, 11,
              48, 9, 6, 3, 85, 4, 6, 19, 2, 83, 69, 49, 18, 48, 16, 6, 3, 85, 4, 10, 12, 9, 89, 117, 98, 105, 99,
              111, 32, 65, 66, 49, 34, 48, 32, 6, 3, 85, 4, 11, 12, 25, 65, 117, 116, 104, 101, 110, 116, 105, 99,
              97, 116, 111, 114, 32, 65, 116, 116, 101, 115, 116, 97, 116, 105, 111, 110, 49, 39, 48, 37, 6, 3, 85,
              4, 3, 12, 30, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 69, 69, 32, 83, 101, 114, 105, 97, 108,
              32, 49, 56, 52, 57, 50, 57, 54, 49, 57, 48, 89, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42,
              134, 72, 206, 61, 3, 1, 7, 3, 66, 0, 4, 33, 26, 111, 177, 181, 137, 37, 203, 10, 193, 24, 95, 124,
              42, 227, 168, 180, 136, 16, 20, 121, 177, 30, 255, 245, 85, 224, 125, 151, 81, 189, 43, 23, 106, 37,
              45, 238, 89, 236, 227, 133, 153, 32, 91, 179, 234, 40, 191, 143, 215, 252, 125, 167, 92, 5, 66, 114,
              174, 72, 88, 229, 145, 252, 90, 163, 108, 48, 106, 48, 34, 6, 9, 43, 6, 1, 4, 1, 130, 196, 10, 2, 4,
              21, 49, 46, 51, 46, 54, 46, 49, 46, 52, 46, 49, 46, 52, 49, 52, 56, 50, 46, 49, 46, 49, 48, 19, 6,
              11, 43, 6, 1, 4, 1, 130, 229, 28, 2, 1, 1, 4, 4, 3, 2, 4, 48, 48, 33, 6, 11, 43, 6, 1, 4, 1, 130,
              229, 28, 1, 1, 4, 4, 18, 4, 16, 20, 154, 32, 33, 142, 246, 65, 51, 150, 184, 129, 248, 213, 183, 241,
              245, 48, 12, 6, 3, 85, 29, 19, 1, 1, 255, 4, 2, 48, 0, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1,
              11, 5, 0, 3, 130, 1, 1, 0, 62, 254, 163, 223, 61, 42, 224, 114, 87, 143, 126, 4, 208, 221, 90, 75,
              104, 219, 1, 175, 232, 99, 46, 24, 180, 224, 184, 115, 67, 24, 145, 25, 108, 24, 75, 235, 193, 213,
              51, 162, 61, 119, 139, 177, 4, 8, 193, 185, 170, 65, 78, 117, 118, 133, 91, 9, 54, 151, 24, 179, 72,
              175, 92, 239, 108, 176, 48, 134, 114, 214, 31, 184, 189, 155, 134, 161, 10, 166, 130, 206, 140, 45,
              78, 240, 144, 237, 80, 84, 24, 254, 83, 212, 206, 30, 98, 122, 40, 243, 114, 3, 9, 88, 208, 143, 250,
              89, 27, 196, 24, 128, 225, 142, 138, 12, 237, 26, 133, 128, 127, 144, 150, 113, 65, 122, 11, 69, 50,
              21, 179, 141, 193, 71, 42, 36, 73, 118, 64, 180, 232, 107, 254, 196, 241, 84, 99, 155, 133, 184, 232,
              128, 20, 150, 54, 36, 56, 53, 89, 1, 43, 252, 135, 124, 11, 68, 236, 125, 167, 148, 210, 6, 84, 178,
              154, 220, 29, 186, 92, 80, 123, 240, 202, 109, 243, 82, 188, 205, 222, 116, 13, 46, 167, 225, 8, 36,
              162, 206, 57, 79, 144, 77, 29, 153, 65, 94, 58, 124, 69, 181, 254, 40, 122, 155, 203, 220, 105, 142,
              139, 220, 213, 180, 121, 138, 92, 237, 53, 222, 138, 53, 9, 2, 10, 20, 183, 38, 191, 191, 57, 167,
              68, 7, 156, 185, 143, 91, 157, 202, 9, 183, 195, 235, 188, 189, 162, 175, 105, 3, 104, 97, 117, 116,
              104, 68, 97, 116, 97, 88, 196, 73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96,
              91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 65, 0, 0, 0, 4, 20,
              154, 32, 33, 142, 246, 65, 51, 150, 184, 129, 248, 213, 183, 241, 245, 0, 64, 95, 198, 144, 115, 197,
              160, 32, 232, 152, 206, 132, 72, 41, 180, 216, 37, 217, 115, 49, 159, 252, 206, 141, 217, 136, 130,
              247, 70, 248, 127, 56, 215, 235, 246, 70, 109, 185, 208, 176, 96, 238, 61, 181, 101, 100, 142, 2, 70,
              200, 148, 169, 162, 142, 154, 157, 16, 85, 36, 103, 90, 208, 186, 226, 221, 165, 1, 2, 3, 38, 32, 1,
              33, 88, 32, 116, 102, 143, 113, 2, 62, 213, 231, 68, 238, 236, 120, 252, 23, 149, 168, 208, 13, 192,
              150, 130, 41, 177, 80, 210, 99, 104, 156, 91, 215, 146, 194, 34, 88, 32, 126, 253, 183, 67, 182, 134,
              115, 195, 130, 235, 165, 161, 137, 246, 121, 39, 81, 237, 198, 154, 101, 223, 197, 126, 121, 164,
              226, 252, 142, 1, 54, 155]
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
    const expected = '70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6'
    
    // Act
    const challenge = deriveChallenge(consentsPostRequestAUTH.payload as tpAPI.Schemas.ConsentsPostRequestAUTH)
    
    // Assert
    expect(challenge).toStrictEqual(expected)
  })

  it('should decode the clientDataJSON', () => {
    // Arrange
    const expected = { 
      "type": "webauthn.create", 
      "challenge": "MgA3ADgANQBjADIAZAA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiADUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZgA2ADcAOAAzADQAMAA", 
      "origin": "http://localhost:5000", 
      "crossOrigin": false 
    }

    // Act
  
    // We have to do a bit of fussing around here - convert from a base64 encoded string back to a buffer, back to a JSON string...
    const base64Buffer = Buffer.from(
      consentsPostRequestAUTH.payload.credential.payload.response.clientDataJSON, 
      'base64'
    )
    const decodedJsonString = base64Buffer.toString('utf-8')    
    const parsedClientData = JSON.parse(decodedJsonString);
    
    // Assert
    expect(parsedClientData).toStrictEqual(expected)
  })


  it('attestation should succeed', async (): Promise<void> => {

    // Figure out collectedClientData:
    const collectedClientData = {
      type: 'webauthn.create',
      challenge: "MgA3ADgANQBjADIAZAA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiADUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZgA2ADcAOAAzADQAMAA",
      origin: "http://localhost:5000",
      crossOrigin: false
    }
    const collectedClientDataHash = createHash('sha256')
      .update(JSON.stringify(collectedClientData))
      .digest('base64')
    console.log('collectedClientData hash', collectedClientDataHash)


    const attestationExpectations: ExpectedAttestationResult = {
      // challenge: deriveChallenge(consentsPostRequestAUTH.payload as tpAPI.Schemas.ConsentsPostRequestAUTH),
      challenge: '70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6',
      origin: "http://localhost:5000",
      factor: "either"
    }

    // question: how do we get from 
    // challenge A:  70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6
    // to challenge B: MgA3ADgANQBjADIAZAA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiADUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZgA2ADcAOAAzADQAMAA
    // ?                          2785c2d99a4c19d1a87d34fd0c10ad0b52721cf3c80288c29da5b0ebef678340
    const challengeAAB = str2ab2('70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6')
    console.log('strToAB challengeA:', str2ab('70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6'))
    console.log('strToAB2 challengeA:', challengeAAB)
    console.log('strToAB3 challengeA:', str2ab3('70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6'))
    const challengeAUtf = Buffer.from(challengeAAB)
    console.log('challengeAUtf8 challengeA:', challengeAUtf.toString('base64')) 

    // Hmm, this isn't right, but it is the correct length.
    // That's promising

    // console.log('encoded challengeA:', encodeBase64String('70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6', 'utf16le'))
    // console.log('decoded final challenge: ', decodeBase64String('MgA3ADgANQBjADIAZAA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiADUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZgA2ADcAOAAzADQAMAA'))

    // console.log('strToAB challengeA:', str2ab('70099874da2bb3251147bd8f18a405de855bb9fc25325a07f61ecbf48846e5d6'))


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
