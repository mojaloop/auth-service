
import axios from 'axios'
import headers from '~/../test/data/headers.json'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { closeKnexConnection } from '~/model/db'
import { deriveChallenge } from '~/domain/challenge'
// import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'
const atob = require('atob')

/*
deriving challenge from consent: {id: XaMf7DEevYScf3EgEfQp,
consentId: 11a91835-cdda-418b-9c0a-e8de62fbc84c, party:
{partyIdInfo: {partyIdType: OPAQUE, partyIdentifier: asd,
fspId: applebank}}, status: CONSENT_GRANTED, userId:
VQLEyvz9zYVucLbjJMErpwSFCVD2, consentRequestId:
c51ec534-ee48-4575-b6a9-ead2955b8069, accounts: [{id:
504b0404-1343-489e-b8a1-3aa9588ae403, currency: USD}, {id:
b4a33e4f-5a71-4fe0-9b78-4eb7e652b885, currency: USD}],
authChannels: [OTP], authUri: https://dfspAuth.com,
authToken: 111222, initiatorId: pispa, participantId: dfsp,
scopes: [{actions: [accounts.getBalance, accounts.transfer],
accountId: a84cd5b8-5883-4deb-9dec-2e86a9603922}, {actions:
[accounts.getBalance], accountId:
b7b40dd7-ae6b-4904-9654-82d02544b327}]}
Canonical string is:

{"consentId":"11a91835-cdda-418b-9c0a-e8de62fbc84c","scopes":[{"accountId":"a84cd5b8-5883-4deb-9dec-2e86a9603922","actions":["accounts.getBalance","accounts.transfer"]},{"accountId":"b7b40dd7-ae6b-4904-9654-82d02544b327","actions":["accounts.getBalance"]}]}

bytes are: [123, 34, 99, 111, 110, 115, 101, 110, 116, 73,
100, 34, 58, 34, 49, 49, 97, 57, 49, 56, 51, 53, 45, 99,
100, 100, 97, 45, 52, 49, 56, 98, 45, 57, 99, 48, 97, 45,
101, 56, 100, 101, 54, 50, 102, 98, 99, 56, 52, 99, 34, 44,
34, 115, 99, 111, 112, 101, 115, 34, 58, 91, 123, 34, 97,
99, 99, 111, 117, 110, 116, 73, 100, 34, 58, 34, 97, 56, 52,
99, 100, 53, 98, 56, 45, 53, 56, 56, 51, 45, 52, 100, 101,
98, 45, 57, 100, 101, 99, 45, 50, 101, 56, 54, 97, 57, 54,
48, 51, 57, 50, 50, 34, 44, 34, 97, 99, 116, 105, 111, 110,
115, 34, 58, 91, 34, 97, 99, 99, 111, 117, 110, 116, 115,
46, 103, 101, 116, 66, 97, 108, 97, 110, 99, 101, 34, 44,
34, 97, 99, 99, 111, 117, 110, 116, 115, 46, 116, 114, 97,
110, 115, 102, 101, 114, 34, 93, 125, 44, 123, 34, 97, 99,
99, 111, 117, 110, 116, 73, 100, 34, 58, 34, 98, 55, 98, 52,
48, 100, 100, 55, 45, 97, 101, 54, 98, 45, 52, 57, 48, 52,
45, 57, 54, 53, 52, 45, 56, 50, 100, 48, 50, 53, 52, 52, 98,
51, 50, 55, 34, 44, 34, 97, 99, 116, 105, 111, 110, 115, 34,
58, 91, 34, 97, 99, 99, 111, 117, 110, 116, 115, 46, 103,
101, 116, 66, 97, 108, 97, 110, 99, 101, 34, 93, 125, 93,
125]
digest
is 
1eaebe5036a2aa862d7e16c7893b78f3c8db9ac8ca965d8c0d994e071857b5ce
⚠️  AccountLinkingFlowController - signChallenge, signing
challenge

MWVhZWJlNTAzNmEyYWE4NjJkN2UxNmM3ODkzYjc4ZjNjOGRiOWFjOGNhOTY1ZDhjMGQ5OTRlMDcxODU3YjVjZQ==

calling window.navigator.credentials.create with options:
 {"challenge":{"0":77,"1":87,"2":86,"3":104,"4":90,"5":87,"6
 ":74,"7":108,"8":78,"9":84,"10":65,"11":122,"12":78,"13":10
 9,"14":69,"15":121,"16":89,"17":87,"18":69,"19":52,"20":78,
 "21":106,"22":74,"23":107,"24":78,"25":50,"26":85,"27":120,
 "28":78,"29":109,"30":77,"31":51,"32":79,"33":68,"34":107,"
 35":122,"36":89,"37":106,"38":99,"39":52,"40":90,"41":106,"
 42":78,"43":106,"44":79,"45":71,"46":82,"47":105,"48":79,"4
 9":87,"50":70,"51":106,"52":79,"53":71,"54":78,"55":104,"56
 ":79,"57":84,"58":89,"59":49,"60":90,"61":68,"62":104,"63":
 106,"64":77,"65":71,"66":81,"67":53,"68":79,"69":84,"70":82
 ,"71":108,"72":77,"73":68,"74":99,"75":120,"76":79,"77":68,
 "78":85,"79":51,"80":89,"81":106,"82":86,"83":106,"84":90,"
 85":81,"86":61,"87":61},"rp":{"name":"Pineapple
 Pay","id":"localhost"},"user":{"id":{},"name":"test@example
 .com","displayName":"Example
 User"},"pubKeyCredParams":[{"alg":-7,"type":"public-key"}],
 "timeout":60000,"attestation":"direct"}
⚠️  AccountLinkingFlowController - signChallenge, credential
is: {
  id: PTz3k-1eqsfgrlaKOTDtkLIPo7ClIbHBiepEWjT5GoIwdY3MANp-q6hEDZJGrzgakgcJwZZBI9_6dQANaTAIfg, 
rawId: [61, 60, 247, 147, 237,
94, 170, 199, 224, 174, 86, 138, 57, 48, 237, 144, 178, 15,
163, 176, 165, 33, 177, 193, 137, 234, 68, 90, 52, 249, 26,
130, 48, 117, 141, 204, 0, 218, 126, 171, 168, 68, 13, 146,
70, 175, 56, 26, 146, 7, 9, 193, 150, 65, 35, 223, 250, 117,
0, 13, 105, 48, 8, 126], response: {attestationObject: [163,
99, 102, 109, 116, 102, 112, 97, 99, 107, 101, 100, 103, 97,
116, 116, 83, 116, 109, 116, 163, 99, 97, 108, 103, 38, 99,
115, 105, 103, 88, 71, 48, 69, 2, 32, 83, 42, 237, 145, 89,
140, 30, 100, 35, 161, 167, 211, 239, 192, 61, 220, 19, 149,
25, 196, 23, 217, 86, 78, 139, 244, 147, 60, 220, 254, 165,
40, 2, 33, 0, 177, 61, 175, 167, 252, 215, 77, 164, 100,
136, 15, 154, 175, 195, 96, 150, 53, 61, 58, 18, 63, 66,
252, 113, 107, 7, 195, 59, 24, 170, 109, 173, 99, 120, 53,
99, 129, 89, 2, 193, 48, 130, 2, 189, 48, 130, 1, 165, 160,
3, 2, 1, 2, 2, 4, 11, 5, 205, 83, 48, 13, 6, 9, 42, 134, 72,
134, 247, 13, 1, 1, 11, 5, 0, 48, 46, 49, 44, 48, 42, 6, 3,
85, 4, 3, 19, 35, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70,
32, 82, 111, 111, 116, 32, 67, 65, 32, 83, 101, 114, 105,
97, 108, 32, 52, 53, 55, 50, 48, 48, 54, 51, 49, 48, 32, 23,
13, 49, 52, 48, 56, 48, 49, 48, 48, 48, 48, 48, 48, 90, 24,
15, 50, 48, 53, 48, 48, 57, 48, 52, 48, 48, 48, 48, 48, 48,
90, 48, 110, 49, 11, 48, 9, 6, 3, 85, 4, 6, 19, 2, 83, 69,
49, 18, 48, 16, 6, 3, 85, 4, 10, 12, 9, 89, 117, 98, 105,
99, 111, 32, 65, 66, 49, 34, 48, 32, 6, 3, 85, 4, 11, 12,
25, 65, 117, 116, 104, 101, 110, 116, 105, 99, 97, 116, 111,
114, 32, 65, 116, 116, 101, 115, 116, 97, 116, 105, 111,
110, 49, 39, 48, 37, 6, 3, 85, 4, 3, 12, 30, 89, 117, 98,
105, 99, 111, 32, 85, 50, 70, 32, 69, 69, 32, 83, 101, 114,
105, 97, 108, 32, 49, 56, 52, 57, 50, 57, 54, 49, 57, 48,
89, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134,
72, 206, 61, 3, 1, 7, 3, 66, 0, 4, 33, 26, 111, 177, 181,
137, 37, 203, 10, 193, 24, 95, 124, 42, 227, 168, 180, 136,
16, 20, 121, 177, 30, 255, 245, 85, 224, 125, 151, 81, 189,
43, 23, 106, 37, 45, 238, 89, 236, 227, 133, 153, 32, 91,
179, 234, 40, 191, 143, 215, 252, 125, 167, 92, 5, 66, 114,
174, 72, 88, 229, 145, 252, 90, 163, 108, 48, 106, 48, 34,
6, 9, 43, 6, 1, 4, 1, 130, 196, 10, 2, 4, 21, 49, 46, 51,
46, 54, 46, 49, 46, 52, 46, 49, 46, 52, 49, 52, 56, 50, 46,
49, 46, 49, 48, 19, 6, 11, 43, 6, 1, 4, 1, 130, 229, 28, 2,
1, 1, 4, 4, 3, 2, 4, 48, 48, 33, 6, 11, 43, 6, 1, 4, 1, 130,
229, 28, 1, 1, 4, 4, 18, 4, 16, 20, 154, 32, 33, 142, 246,
65, 51, 150, 184, 129, 248, 213, 183, 241, 245, 48, 12, 6,
3, 85, 29, 19, 1, 1, 255, 4, 2, 48, 0, 48, 13, 6, 9, 42,
134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 3, 130, 1, 1, 0, 62,
254, 163, 223, 61, 42, 224, 114, 87, 143, 126, 4, 208, 221,
90, 75, 104, 219, 1, 175, 232, 99, 46, 24, 180, 224, 184,
115, 67, 24, 145, 25, 108, 24, 75, 235, 193, 213, 51, 162,
61, 119, 139, 177, 4, 8, 193, 185, 170, 65, 78, 117, 118,
133, 91, 9, 54, 151, 24, 179, 72, 175, 92, 239, 108, 176,
48, 134, 114, 214, 31, 184, 189, 155, 134, 161, 10, 166,
130, 206, 140, 45, 78, 240, 144, 237, 80, 84, 24, 254, 83,
212, 206, 30, 98, 122, 40, 243, 114, 3, 9, 88, 208, 143,
250, 89, 27, 196, 24, 128, 225, 142, 138, 12, 237, 26, 133,
128, 127, 144, 150, 113, 65, 122, 11, 69, 50, 21, 179, 141,
193, 71, 42, 36, 73, 118, 64, 180, 232, 107, 254, 196, 241,
84, 99, 155, 133, 184, 232, 128, 20, 150, 54, 36, 56, 53,
89, 1, 43, 252, 135, 124, 11, 68, 236, 125, 167, 148, 210,
6, 84, 178, 154, 220, 29, 186, 92, 80, 123, 240, 202, 109,
243, 82, 188, 205, 222, 116, 13, 46, 167, 225, 8, 36, 162,
206, 57, 79, 144, 77, 29, 153, 65, 94, 58, 124, 69, 181,
254, 40, 122, 155, 203, 220, 105, 142, 139, 220, 213, 180,
121, 138, 92, 237, 53, 222, 138, 53, 9, 2, 10, 20, 183, 38,
191, 191, 57, 167, 68, 7, 156, 185, 143, 91, 157, 202, 9,
183, 195, 235, 188, 189, 162, 175, 105, 3, 104, 97, 117,
116, 104, 68, 97, 116, 97, 88, 196, 73, 150, 13, 229, 136,
14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228,
174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29,
151, 99, 65, 0, 0, 0, 1, 20, 154, 32, 33, 142, 246, 65, 51,
150, 184, 129, 248, 213, 183, 241, 245, 0, 64, 61, 60, 247,
147, 237, 94, 170, 199, 224, 174, 86, 138, 57, 48, 237, 144,
178, 15, 163, 176, 165, 33, 177, 193, 137, 234, 68, 90, 52,
249, 26, 130, 48, 117, 141, 204, 0, 218, 126, 171, 168, 68,
13, 146, 70, 175, 56, 26, 146, 7, 9, 193, 150, 65, 35, 223,
250, 117, 0, 13, 105, 48, 8, 126, 165, 1, 2, 3, 38, 32, 1,
33, 88, 32, 85, 102, 194, 109, 23, 133, 47, 255, 95, 170,
43, 205, 251, 18, 236, 106, 216, 169, 19, 27, 79, 109, 232,
252, 22, 231, 186, 188, 102, 40, 88, 252, 34, 88, 32, 223,
2, 108, 151, 193, 193, 90, 156, 41, 210, 20, 166, 105, 253,
193, 243, 251, 214, 32, 178, 133, 43, 123, 238, 34, 29, 238,
49, 90, 234, 166, 253], clientDataJSON: [123, 34, 116, 121,
112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110,
46, 99, 114, 101, 97, 116, 101, 34, 44, 34, 99, 104, 97,
108, 108, 101, 110, 103, 101, 34, 58, 34, 84, 86, 100, 87,
97, 70, 112, 88, 83, 109, 120, 79, 86, 69, 70, 54, 84, 109,
49, 70, 101, 86, 108, 88, 82, 84, 82, 79, 97, 107, 112, 114,
84, 106, 74, 86, 101, 69, 53, 116, 84, 84, 78, 80, 82, 71,
116, 54, 87, 87, 112, 106, 78, 70, 112, 113, 84, 109, 112,
80, 82, 49, 74, 112, 84, 49, 100, 71, 97, 107, 57, 72, 84,
109, 104, 80, 86, 70, 107, 120, 87, 107, 82, 111, 97, 107,
49, 72, 85, 84, 86, 80, 86, 70, 74, 115, 84, 85, 82, 106,
101, 69, 57, 69, 86, 84, 78, 90, 97, 108, 90, 113, 87, 108,
69, 57, 80, 81, 34, 44, 34, 111, 114, 105, 103, 105, 110,
34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, 111, 99,
97, 108, 104, 111, 115, 116, 58, 52, 50, 49, 56, 49, 34, 44,
34, 99, 114, 111, 115, 115, 79, 114, 105, 103, 105, 110, 34,
58, 102, 97, 108, 115, 101, 125]}}
*/

const validConsentId = '11a91835-cdda-418b-9c0a-e8de62fbc84c'
// const consent = { 
//   "consentId": "11a91835-cdda-418b-9c0a-e8de62fbc84c", 
//   "scopes": [{ "accountId": "a84cd5b8-5883-4deb-9dec-2e86a9603922", "actions": ["accounts.getBalance", "accounts.transfer"] }, { "accountId": "b7b40dd7-ae6b-4904-9654-82d02544b327", "actions": ["accounts.getBalance"] }] }
// const expected = 'MWVhZWJlNTAzNmEyYWE4NjJkN2UxNmM3ODkzYjc4ZjNjOGRiOWFjOGNhOTY1ZDhjMGQ5OTRlMDcxODU3YjVjZQ=='



const validConsentsPostRequestAuth: tpAPI.Schemas.ConsentsPostRequestAUTH = {
  consentId: validConsentId,
  scopes: [{ 
    "accountId": "a84cd5b8-5883-4deb-9dec-2e86a9603922", 
    "actions": ["accounts.getBalance", "accounts.transfer"] 
  }, { 
    "accountId": "b7b40dd7-ae6b-4904-9654-82d02544b327", 
    "actions": ["accounts.getBalance"] }
  ],
  credential: {
    credentialType: 'FIDO',
    status: 'PENDING',
    payload: {
      id: atob('PTz3k-1eqsfgrlaKOTDtkLIPo7ClIbHBiepEWjT5GoIwdY3MANp-q6hEDZJGrzgakgcJwZZBI9_6dQANaTAIfg'),
      rawId: atob('PTz3k+1eqsfgrlaKOTDtkLIPo7ClIbHBiepEWjT5GoIwdY3MANp+q6hEDZJGrzgakgcJwZZBI9/6dQANaTAIfg=='),
      response: {
        clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiVFZkV2FGcFhTbXhPVkVGNlRtMUZlVmxYUlRST2FrcHJUakpWZUU1dFRUTlBSR3Q2V1dwak5GcHFUbXBQUjFKcFQxZEdhazlIVG1oUFZGa3hXa1JvYWsxSFVUVlBWRkpzVFVSamVFOUVWVE5aYWxacVdsRTlQUSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIxODEiLCJjcm9zc09yaWdpbiI6ZmFsc2V9',
        attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIgUyrtkVmMHmQjoafT78A93BOVGcQX2VZOi/STPNz+pSgCIQCxPa+n/NdNpGSID5qvw2CWNT06Ej9C/HFrB8M7GKptrWN4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAABFJogIY72QTOWuIH41bfx9QBAPTz3k+1eqsfgrlaKOTDtkLIPo7ClIbHBiepEWjT5GoIwdY3MANp+q6hEDZJGrzgakgcJwZZBI9/6dQANaTAIfqUBAgMmIAEhWCBVZsJtF4Uv/1+qK837Euxq2KkTG09t6PwW57q8ZihY/CJYIN8CbJfBwVqcKdIUpmn9wfP71iCyhSt77iId7jFa6qb9'
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

// const axiosConfig = {
//   headers: {
//     'Content-Type': 'application/vnd.interoperability.participants+json;version=1.1',
//     'Accept': 'application/vnd.interoperability.participants+json;version=1.1',
//     'FSPIOP-Source': 'als',
//     Date: 'Thu, 24 Jan 2019 10:23:12 GMT',
//     'FSPIOP-Destination': 'centralAuth'
//   }
// }
// const ttkRequestsHistoryUri = `http://localhost:5050/api/history/requests`



describe('POST /thirdpartyRequests/verifications', () => {

  afterAll(async (): Promise<void> => {
    await closeKnexConnection()
  })

  describe('happy flow', () => {
    it('creates a consent, and verifies a transaction', async () => {
      // check that the derivation lines up with our mock data
      const derivedChallenge = deriveChallenge(validConsentsPostRequestAuth)
      const preloadedChallengeFromUI = 'MWVhZWJlNTAzNmEyYWE4NjJkN2UxNmM3ODkzYjc4ZjNjOGRiOWFjOGNhOTY1ZDhjMGQ5OTRlMDcxODU3YjVjZQ=='
      expect(derivedChallenge).toStrictEqual(preloadedChallengeFromUI)

      // Arrange
      const consentsURI = 'http://localhost:4004/consents'
      
      // register the consent
      const response = await axios.post(consentsURI, validConsentsPostRequestAuth, {headers})
      
      // auth-service should return Accepted code
      expect(response.status).toEqual(202)
      
      // // wait a bit for the auth-service to process the request
      // // takes a bit since attestation takes a bit of time
      // await new Promise(resolve => setTimeout(resolve, 2000))
      // const putParticipantsTypeIdFromALS = {
      //   fspId: 'centralAuth'
      // }
      // const mockAlsParticipantsURI = `http://localhost:4004/participants/CONSENT/${validConsentId}`
      
      // // mock the ALS callback to the auth-service
      // const responseToPutParticipantsTypeId = await axios.put(mockAlsParticipantsURI, putParticipantsTypeIdFromALS, axiosConfig)
      // expect(responseToPutParticipantsTypeId.status).toEqual(200)

      // // we have a registered credential - now let's try verifying a transaction 
      // const verifyURI = 'http://localhost:4004/thirdpartyRequests/verifications'

      // // Act
      // const result = await axios.post(verifyURI, validVerificationRequest, { headers })
      
      // // Assert
      // expect(result.status).toBe(202)

      // // wait a bit for the auth-service to process the request and call the ttk
      // await new Promise(resolve => setTimeout(resolve, 2000))

      // // check that the auth-service has sent a PUT /thirdpartyRequests/verifications/{ID} to the DFSP (TTK)
      // const requestsHistory: MLTestingToolkitRequest[] = (await axios.get(ttkRequestsHistoryUri, axiosConfig)).data
      // const asyncCallback = requestsHistory.filter(req => {
      //   return req.method === 'put' && req.path === `/thirdpartyRequests/verifications/${validVerificationRequest.verificationRequestId}`
      // })

      // expect(asyncCallback.length).toEqual(1)

      // // check the payload
      // const asyncCallbackPayload = asyncCallback[0].body as tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse
      // expect(asyncCallbackPayload).toStrictEqual({
      //   authenticationResonse: 'VERIFIED'
      // })
    })
  })

  describe('unhappy flow', () => {
    it.todo('tries to verify a transaction signed with the wrong private key')
  })
})