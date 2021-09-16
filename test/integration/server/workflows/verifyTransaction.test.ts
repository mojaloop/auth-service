
import axios from 'axios'
import headers from '~/../test/data/headers.json'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { closeKnexConnection, testCleanupConsents } from '~/model/db'
import { deriveChallenge } from '~/domain/challenge'
import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'
// import { MLTestingToolkitRequest } from 'test/integration/ttkHelpers'
const atob = require('atob')
const btoa = require('btoa')

/*


deriving challenge from consent: {id: ojw9f1gu80K4AygWyDS8, consentId: 1b6a6c5e-f442-4fa3-ac7c-37b6286745a3, party: {partyIdInfo: {partyIdType: OPAQUE, partyIdentifier: asd, fspId: applebank}}, status: CONSENT_GRANTED, userId: VQLEyvz9zYVucLbjJMErpwSFCVD2, consentRequestId:
c51ec534-ee48-4575-b6a9-ead2955b8069, accounts: [{id: 70ec27cd-e924-4a30-bff7-4d1a35eafe41, currency: USD}], authChannels: [OTP], authUri: https://dfspAuth.com, authToken: 111222, initiatorId: pispa, participantId: dfsp, scopes: [{actions: [accounts.getBalance, accounts.transfer],
accountId: 15156944-2090-4c90-8842-55d08ada7489}, {actions: [accounts.getBalance], accountId: 630214db-7fc8-4b25-852d-e860887a2fe5}]}
Canonical string is: {"consentId":"1b6a6c5e-f442-4fa3-ac7c-37b6286745a3","scopes":[{"accountId":"15156944-2090-4c90-8842-55d08ada7489","actions":["accounts.getBalance","accounts.transfer"]},{"accountId":"630214db-7fc8-4b25-852d-e860887a2fe5","actions":["accounts.getBalance"]}]}
bytes are: [123, 34, 99, 111, 110, 115, 101, 110, 116, 73, 100, 34, 58, 34, 49, 98, 54, 97, 54, 99, 53, 101, 45, 102, 52, 52, 50, 45, 52, 102, 97, 51, 45, 97, 99, 55, 99, 45, 51, 55, 98, 54, 50, 56, 54, 55, 52, 53, 97, 51, 34, 44, 34, 115, 99, 111, 112, 101, 115, 34, 58, 91, 123,
34, 97, 99, 99, 111, 117, 110, 116, 73, 100, 34, 58, 34, 49, 53, 49, 53, 54, 57, 52, 52, 45, 50, 48, 57, 48, 45, 52, 99, 57, 48, 45, 56, 56, 52, 50, 45, 53, 53, 100, 48, 56, 97, 100, 97, 55, 52, 56, 57, 34, 44, 34, 97, 99, 116, 105, 111, 110, 115, 34, 58, 91, 34, 97, 99, 99, 111,
117, 110, 116, 115, 46, 103, 101, 116, 66, 97, 108, 97, 110, 99, 101, 34, 44, 34, 97, 99, 99, 111, 117, 110, 116, 115, 46, 116, 114, 97, 110, 115, 102, 101, 114, 34, 93, 125, 44, 123, 34, 97, 99, 99, 111, 117, 110, 116, 73, 100, 34, 58, 34, 54, 51, 48, 50, 49, 52, 100, 98, 45, 55,
102, 99, 56, 45, 52, 98, 50, 53, 45, 56, 53, 50, 100, 45, 101, 56, 54, 48, 56, 56, 55, 97, 50, 102, 101, 53, 34, 44, 34, 97, 99, 116, 105, 111, 110, 115, 34, 58, 91, 34, 97, 99, 99, 111, 117, 110, 116, 115, 46, 103, 101, 116, 66, 97, 108, 97, 110, 99, 101, 34, 93, 125, 93, 125]
digest isa75a3c2fc893c75127ba114b9abe77757d0982aa3c8ae37aa7c7fb0eeb453a8a
⚠️  AccountLinkingFlowController - signChallenge, signing challenge a75a3c2fc893c75127ba114b9abe77757d0982aa3c8ae37aa7c7fb0eeb453a8a
calling window.navigator.credentials.create with options:
 {"challenge":{"0":97,"1":55,"2":53,"3":97,"4":51,"5":99,"6":50,"7":102,"8":99,"9":56,"10":57,"11":51,"12":99,"13":55,"14":53,"15":49,"16":50,"17":55,"18":98,"19":97,"20":49,"21":49,"22":52,"23":98,"24":57,"25":97,"26":98,"27":101,"28":55,"29":55,"30":55,"31":53,"32":55,"33":100,"
 34":48,"35":57,"36":56,"37":50,"38":97,"39":97,"40":51,"41":99,"42":56,"43":97,"44":101,"45":51,"46":55,"47":97,"48":97,"49":55,"50":99,"51":55,"52":102,"53":98,"54":48,"55":101,"56":101,"57":98,"58":52,"59":53,"60":51,"61":97,"62":56,"63":97},"rp":{"name":"Pineapple
 Pay","id":"localhost"},"user":{"id":{},"name":"test@example.com","displayName":"Example User"},"pubKeyCredParams":[{"alg":-7,"type":"public-key"}],"timeout":60000,"attestation":"direct"}
⚠️  AccountLinkingFlowController - signChallenge, credential is: {id: 4yGzY_utOB9mtwEXKOamlxOCkYJXNJF8S8lZ2-EpvEFwWSVLqx9OBkcWPDVvpBml5BTatEOjYZYG0M2WMLfW5w, rawId: [227, 33, 179, 99, 251, 173, 56, 31, 102, 183, 1, 23, 40, 230, 166, 151, 19, 130, 145, 130, 87, 52, 145, 124, 75,
201, 89, 219, 225, 41, 188, 65, 112, 89, 37, 75, 171, 31, 78, 6, 71, 22, 60, 53, 111, 164, 25, 165, 228, 20, 218, 180, 67, 163, 97, 150, 6, 208, 205, 150, 48, 183, 214, 231], response: {attestationObject: [163, 99, 102, 109, 116, 102, 112, 97, 99, 107, 101, 100, 103, 97, 116, 116,
83, 116, 109, 116, 163, 99, 97, 108, 103, 38, 99, 115, 105, 103, 88, 70, 48, 68, 2, 32, 120, 235, 130, 67, 174, 6, 140, 81, 238, 10, 0, 117, 3, 59, 177, 168, 155, 20, 242, 86, 1, 113, 69, 65, 231, 214, 239, 198, 34, 61, 125, 152, 2, 32, 109, 8, 74, 101, 148, 203, 49, 138, 240,
229, 130, 36, 88, 76, 84, 121, 73, 69, 103, 38, 115, 206, 123, 28, 158, 47, 155, 68, 3, 165, 12, 253, 99, 120, 53, 99, 129, 89, 2, 193, 48, 130, 2, 189, 48, 130, 1, 165, 160, 3, 2, 1, 2, 2, 4, 11, 5, 205, 83, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 48, 46, 49, 44,
48, 42, 6, 3, 85, 4, 3, 19, 35, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 82, 111, 111, 116, 32, 67, 65, 32, 83, 101, 114, 105, 97, 108, 32, 52, 53, 55, 50, 48, 48, 54, 51, 49, 48, 32, 23, 13, 49, 52, 48, 56, 48, 49, 48, 48, 48, 48, 48, 48, 90, 24, 15, 50, 48, 53, 48, 48, 57,
48, 52, 48, 48, 48, 48, 48, 48, 90, 48, 110, 49, 11, 48, 9, 6, 3, 85, 4, 6, 19, 2, 83, 69, 49, 18, 48, 16, 6, 3, 85, 4, 10, 12, 9, 89, 117, 98, 105, 99, 111, 32, 65, 66, 49, 34, 48, 32, 6, 3, 85, 4, 11, 12, 25, 65, 117, 116, 104, 101, 110, 116, 105, 99, 97, 116, 111, 114, 32, 65,
116, 116, 101, 115, 116, 97, 116, 105, 111, 110, 49, 39, 48, 37, 6, 3, 85, 4, 3, 12, 30, 89, 117, 98, 105, 99, 111, 32, 85, 50, 70, 32, 69, 69, 32, 83, 101, 114, 105, 97, 108, 32, 49, 56, 52, 57, 50, 57, 54, 49, 57, 48, 89, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134,
72, 206, 61, 3, 1, 7, 3, 66, 0, 4, 33, 26, 111, 177, 181, 137, 37, 203, 10, 193, 24, 95, 124, 42, 227, 168, 180, 136, 16, 20, 121, 177, 30, 255, 245, 85, 224, 125, 151, 81, 189, 43, 23, 106, 37, 45, 238, 89, 236, 227, 133, 153, 32, 91, 179, 234, 40, 191, 143, 215, 252, 125, 167,
92, 5, 66, 114, 174, 72, 88, 229, 145, 252, 90, 163, 108, 48, 106, 48, 34, 6, 9, 43, 6, 1, 4, 1, 130, 196, 10, 2, 4, 21, 49, 46, 51, 46, 54, 46, 49, 46, 52, 46, 49, 46, 52, 49, 52, 56, 50, 46, 49, 46, 49, 48, 19, 6, 11, 43, 6, 1, 4, 1, 130, 229, 28, 2, 1, 1, 4, 4, 3, 2, 4, 48, 48,
33, 6, 11, 43, 6, 1, 4, 1, 130, 229, 28, 1, 1, 4, 4, 18, 4, 16, 20, 154, 32, 33, 142, 246, 65, 51, 150, 184, 129, 248, 213, 183, 241, 245, 48, 12, 6, 3, 85, 29, 19, 1, 1, 255, 4, 2, 48, 0, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 11, 5, 0, 3, 130, 1, 1, 0, 62, 254, 163, 223,
61, 42, 224, 114, 87, 143, 126, 4, 208, 221, 90, 75, 104, 219, 1, 175, 232, 99, 46, 24, 180, 224, 184, 115, 67, 24, 145, 25, 108, 24, 75, 235, 193, 213, 51, 162, 61, 119, 139, 177, 4, 8, 193, 185, 170, 65, 78, 117, 118, 133, 91, 9, 54, 151, 24, 179, 72, 175, 92, 239, 108, 176, 48,
134, 114, 214, 31, 184, 189, 155, 134, 161, 10, 166, 130, 206, 140, 45, 78, 240, 144, 237, 80, 84, 24, 254, 83, 212, 206, 30, 98, 122, 40, 243, 114, 3, 9, 88, 208, 143, 250, 89, 27, 196, 24, 128, 225, 142, 138, 12, 237, 26, 133, 128, 127, 144, 150, 113, 65, 122, 11, 69, 50, 21,
179, 141, 193, 71, 42, 36, 73, 118, 64, 180, 232, 107, 254, 196, 241, 84, 99, 155, 133, 184, 232, 128, 20, 150, 54, 36, 56, 53, 89, 1, 43, 252, 135, 124, 11, 68, 236, 125, 167, 148, 210, 6, 84, 178, 154, 220, 29, 186, 92, 80, 123, 240, 202, 109, 243, 82, 188, 205, 222, 116, 13,
46, 167, 225, 8, 36, 162, 206, 57, 79, 144, 77, 29, 153, 65, 94, 58, 124, 69, 181, 254, 40, 122, 155, 203, 220, 105, 142, 139, 220, 213, 180, 121, 138, 92, 237, 53, 222, 138, 53, 9, 2, 10, 20, 183, 38, 191, 191, 57, 167, 68, 7, 156, 185, 143, 91, 157, 202, 9, 183, 195, 235, 188,
189, 162, 175, 105, 3, 104, 97, 117, 116, 104, 68, 97, 116, 97, 88, 196, 73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 65, 0, 0, 0, 4, 20, 154, 32, 33, 142, 246, 65, 51, 150, 184,
129, 248, 213, 183, 241, 245, 0, 64, 227, 33, 179, 99, 251, 173, 56, 31, 102, 183, 1, 23, 40, 230, 166, 151, 19, 130, 145, 130, 87, 52, 145, 124, 75, 201, 89, 219, 225, 41, 188, 65, 112, 89, 37, 75, 171, 31, 78, 6, 71, 22, 60, 53, 111, 164, 25, 165, 228, 20, 218, 180, 67, 163, 97,
150, 6, 208, 205, 150, 48, 183, 214, 231, 165, 1, 2, 3, 38, 32, 1, 33, 88, 32, 220, 80, 45, 204, 157, 161, 176, 75, 31, 135, 68, 108, 5, 8, 96, 180, 14, 216, 180, 67, 150, 153, 124, 114, 75, 54, 196, 197, 27, 231, 95, 126, 34, 88, 32, 218, 153, 96, 245, 241, 110, 110, 93, 179,
123, 44, 31, 252, 21, 212, 17, 52, 35, 209, 61, 115, 9, 202, 51, 138, 19, 112, 142, 75, 224, 161, 5], clientDataJSON: [123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 99, 114, 101, 97, 116, 101, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103,
101, 34, 58, 34, 89, 84, 99, 49, 89, 84, 78, 106, 77, 109, 90, 106, 79, 68, 107, 122, 89, 122, 99, 49, 77, 84, 73, 51, 89, 109, 69, 120, 77, 84, 82, 105, 79, 87, 70, 105, 90, 84, 99, 51, 78, 122, 85, 51, 90, 68, 65, 53, 79, 68, 74, 104, 89, 84, 78, 106, 79, 71, 70, 108, 77, 122,
100, 104, 89, 84, 100, 106, 78, 50, 90, 105, 77, 71, 86, 108, 89, 106, 81, 49, 77, 50, 69, 52, 89, 81, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 52, 50, 49, 56, 49, 34, 44, 34, 99, 114, 111,
115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 125]}}
⚠️  AccountLinkingFlowController - account_linking_flow_controller - _onValue called
⚠️  AccountLinkingFlowController - Consent has status: ConsentStatus.challengeSigned
⚠️  AccountLinkingFlowController - The consent had an unexpected status: ConsentStatus.challengeSigned
⚠️  AccountLinkingFlowController - account_linking_flow_controller - _onValue called
⚠️  AccountLinkingFlowController - Consent has status: ConsentStatus.active
 AccountLookupScreen - _buildActionSection


*/


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

/*

 {"challenge":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":1,"14":2,"15":3},"allowCredentials":[{"id":{"0":227,"1":33,"2":17
 9,"3":99,"4":251,"5":173,"6":56,"7":31,"8":102,"9":183,"10":1,"11":23,"12":40,"13":230,"14":166,"15":151,"16":19,"17":130,"18":145,"19":130,"20":87,"21":52,"22":145,
 "23":124,"24":75,"25":201,"26":89,"27":219,"28":225,"29":41,"30":188,"31":65,"32":112,"33":89,"34":37,"35":75,"36":171,"37":31,"38":78,"39":6,"40":71,"41":22,"42":60
 ,"43":53,"44":111,"45":164,"46":25,"47":165,"48":228,"49":20,"50":218,"51":180,"52":67,"53":163,"54":97,"55":150,"56":6,"57":208,"58":205,"59":150,"60":48,"61":183,"
 62":214,"63":231},"type":"public-key"}],"timeout":60000}
⚠️  main - Signed credential is: {
  id: 4yGzY_utOB9mtwEXKOamlxOCkYJXNJF8S8lZ2-EpvEFwWSVLqx9OBkcWPDVvpBml5BTatEOjYZYG0M2WMLfW5w, 
  rawId: [227, 33, 179, 99, 251, 173, 56,
31, 102, 183, 1, 23, 40, 230, 166, 151, 19, 130, 145, 130, 87, 52, 145, 124, 75, 201, 89, 219, 225, 41, 188, 65, 112, 89, 37, 75, 171, 31, 78, 6, 71, 22, 60, 53, 111,
164, 25, 165, 228, 20, 218, 180, 67, 163, 97, 150, 6, 208, 205, 150, 48, 183, 214, 231], response: {
  authenticatorData: [73, 150, 13, 229, 136, 14, 140, 104, 116, 52,
23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131, 29, 151, 99, 1, 0, 0, 0, 6], 
clientDataJSON: [123, 34, 116, 121, 112, 101,
34, 58, 34, 119, 101, 98, 97, 117, 116, 104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108, 101, 110, 103, 101, 34, 58, 34, 65, 65, 65, 65, 65, 65, 65,
65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 69, 67, 65, 119, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97,
108, 104, 111, 115, 116, 58, 52, 50, 49, 56, 49, 34, 44, 34, 99, 114, 111, 115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 44, 34, 111, 116,
104, 101, 114, 95, 107, 101, 121, 115, 95, 99, 97, 110, 95, 98, 101, 95, 97, 100, 100, 101, 100, 95, 104, 101, 114, 101, 34, 58, 34, 100, 111, 32, 110, 111, 116, 32,
99, 111, 109, 112, 97, 114, 101, 32, 99, 108, 105, 101, 110, 116, 68, 97, 116, 97, 74, 83, 79, 78, 32, 97, 103, 97, 105, 110, 115, 116, 32, 97, 32, 116, 101, 109,
112, 108, 97, 116, 101, 46, 32, 83, 101, 101, 32, 104, 116, 116, 112, 115, 58, 47, 47, 103, 111, 111, 46, 103, 108, 47, 121, 97, 98, 80, 101, 120, 34, 125],
signature: [48, 69, 2, 32, 21, 248, 27, 123, 219, 254, 255, 163, 211, 45, 20, 250, 78, 59, 76, 28, 219, 100, 188, 170, 81, 122, 127, 183, 230, 204, 67, 252, 151, 111,
88, 155, 2, 33, 0, 247, 41, 64, 159, 168, 234, 29, 193, 212, 43, 104, 254, 69, 12, 39, 175, 189, 240, 167, 116, 106, 132, 167, 26, 169, 59, 33, 219, 192, 36, 156,
94], userHandle: []}}

*/
export const validVerificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest = {
  verificationRequestId: '835a8444-8cdc-41ef-bf18-ca4916c2e005',
  // This is stubbed out for pisp-demo-svc
  challenge: 'AAAAAAAAAAAAAAAAAAECAw',
  consentId: validConsentId,
  signedPayloadType: 'FIDO',
  signedPayload: {
    id: atob('4yGzY_utOB9mtwEXKOamlxOCkYJXNJF8S8lZ2-EpvEFwWSVLqx9OBkcWPDVvpBml5BTatEOjYZYG0M2WMLfW5w'),
    rawId: '4yGzY/utOB9mtwEXKOamlxOCkYJXNJF8S8lZ2+EpvEFwWSVLqx9OBkcWPDVvpBml5BTatEOjYZYG0M2WMLfW5w==',
    response: {
      authenticatorData: 'SZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2MBAAAABg==',
      clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiQUFBQUFBQUFBQUFBQUFBQUFBRUNBdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NDIxODEiLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQ==',
      signature: atob('MEUCIBX4G3vb/v+j0y0U+k47TBzbZLyqUXp/t+b MQ/yXb1ibAiEA9ylAn6jqHcHUK2j+RQwnr73wp3RqhKcaqTsh28AknF4=')
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
    await testCleanupConsents([
      validConsentId
    ])
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