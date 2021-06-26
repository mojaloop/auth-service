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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Ahan Gupta <ahangupta.96@gmail.com>
 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Kenneth Zeng <kkzeng@google.com>

 --------------
 ******/

'use strict'
import * as Knex from 'knex'

export const consents = [
  {
    id: '123',
    status: 'ACTIVE',
    initiatorId: 'PISPA',
    participantId: 'DFSPA',
    credentialId: null,
    credentialType: null,
    credentialStatus: null,
    credentialPayload: null,
    credentialChallenge: null,
    revokedAt: null,
    attestationObject: null,
    clientDataJSON: null
  },
  {
    id: '124',
    status: 'ACTIVE',
    initiatorId: 'PISPB',
    participantId: 'DFSPA',
    credentialId: '9876',
    credentialType: 'FIDO',
    credentialStatus: 'PENDING',
    credentialPayload: null,
    credentialChallenge: 'string_representing_challenge_a',
    attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIgHq9' +
      'JKpi/bFnnu0uVV+k6JjHfBcFwWRRCXJWlejgzJLUCIQD2iOONGXebOCxq37UqvumxC/d' +
      'Jz1a3U9F1DaxVMFnzf2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0' +
      'BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDY' +
      'zMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0U' +
      'xEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3R' +
      'hdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwY' +
      'HKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZd' +
      'RvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAo' +
      'CBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwY' +
      'BBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb' +
      '3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TO' +
      'iPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5' +
      'T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7' +
      'E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+E' +
      'IJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9' +
      'bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO' +
      '6gx2XY0EAAAAEFJogIY72QTOWuIH41bfx9QBAX8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3' +
      'ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3aUBAgMmIAEhWCB' +
      '0Zo9xAj7V50Tu7Hj8F5Wo0A3AloIpsVDSY2icW9eSwiJYIH79t0O2hnPDguuloYn2eSd' +
      'R7caaZd/Ffnmk4vyOATab',
    clientDataJSON: '{"type":"webauthn.create","challenge":"MgA3ADgANQBjADIAZ' +
      'AA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiA' +
      'DUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZ' +
      'gA2ADcAOAAzADQAMAA","origin":"http://localhost:5000","crossOrigin":false}'
  },
  {
    id: '125',
    status: 'ACTIVE',
    initiatorId: 'PISPC',
    participantId: 'DFSPA',
    credentialId: '9875',
    credentialType: 'FIDO',
    credentialStatus: 'VERIFIED',
    credentialPayload: 'string_representing_public_key_a',
    credentialChallenge: 'string_representing_challenge_b',
    attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIgHq9' +
      'JKpi/bFnnu0uVV+k6JjHfBcFwWRRCXJWlejgzJLUCIQD2iOONGXebOCxq37UqvumxC/d' +
      'Jz1a3U9F1DaxVMFnzf2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0' +
      'BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDY' +
      'zMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0U' +
      'xEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3R' +
      'hdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwY' +
      'HKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZd' +
      'RvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAo' +
      'CBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwY' +
      'BBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb' +
      '3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TO' +
      'iPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5' +
      'T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7' +
      'E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+E' +
      'IJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9' +
      'bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO' +
      '6gx2XY0EAAAAEFJogIY72QTOWuIH41bfx9QBAX8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3' +
      'ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3aUBAgMmIAEhWCB' +
      '0Zo9xAj7V50Tu7Hj8F5Wo0A3AloIpsVDSY2icW9eSwiJYIH79t0O2hnPDguuloYn2eSd' +
      'R7caaZd/Ffnmk4vyOATab',
    clientDataJSON: '{"type":"webauthn.create","challenge":"MgA3ADgANQBjADIAZ' +
      'AA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiA' +
      'DUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZ' +
      'gA2ADcAOAAzADQAMAA","origin":"http://localhost:5000","crossOrigin":false}'
  },
  {
    id: '126',
    status: 'REVOKED',
    initiatorId: 'PISPC',
    participantId: 'DFSPA',
    credentialId: '9875',
    credentialType: 'FIDO',
    credentialStatus: 'VERIFIED',
    credentialPayload: 'string_representing_public_key_a',
    credentialChallenge: 'string_representing_challenge_b',
    revokedAt: '2011-10-05T14:48:00.000Z',
    attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIgHq9' +
    'JKpi/bFnnu0uVV+k6JjHfBcFwWRRCXJWlejgzJLUCIQD2iOONGXebOCxq37UqvumxC/d' +
    'Jz1a3U9F1DaxVMFnzf2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0' +
    'BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDY' +
    'zMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0U' +
    'xEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3R' +
    'hdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwY' +
    'HKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZd' +
    'RvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAo' +
    'CBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwY' +
    'BBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb' +
    '3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TO' +
    'iPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5' +
    'T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7' +
    'E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+E' +
    'IJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9' +
    'bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO' +
    '6gx2XY0EAAAAEFJogIY72QTOWuIH41bfx9QBAX8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3' +
    'ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3aUBAgMmIAEhWCB' +
    '0Zo9xAj7V50Tu7Hj8F5Wo0A3AloIpsVDSY2icW9eSwiJYIH79t0O2hnPDguuloYn2eSd' +
    'R7caaZd/Ffnmk4vyOATab',
    clientDataJSON: '{"type":"webauthn.create","challenge":"MgA3ADgANQBjADIAZ' +
    'AA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiA' +
    'DUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZ' +
    'gA2ADcAOAAzADQAMAA","origin":"http://localhost:5000","crossOrigin":false}'
  },
  {
    id: '127',
    status: 'REVOKED',
    initiatorId: 'PISPA',
    participantId: 'DFSPA',
    credentialId: null,
    credentialType: null,
    credentialStatus: null,
    credentialPayload: null,
    credentialChallenge: null,
    revokedAt: '2020-08-19T05:44:18.843Z',
    attestationObject: null,
    clientDataJSON: null
  }
]

export function seed (knex: Knex): Promise<Knex.QueryBuilder<number[]>> {
  return knex('Consent').del()
    .then(() => knex('Consent').insert(consents))
}
