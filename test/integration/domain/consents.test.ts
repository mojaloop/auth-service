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

 - Kenneth Zeng <kkzeng@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import { createAndStoreConsent } from '~/domain/consents'
import * as DB from '~/model/db'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { requestWithPayloadScopes } from 'test/data/data'
import { deriveChallenge } from '~/domain/challenge'

describe('server/domain/consents', (): void => {
  const consentIdsToCleanup: Array<string> = []

  const consentId = requestWithPayloadScopes.params.ID
  const participantId = requestWithPayloadScopes.headers['fspiop-destination']
  const payload: tpAPI.Schemas.ConsentsPostRequestAUTH = {
    consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
    scopes: [
      {
        address: 'dfsp.username.5678',
        actions: [
          'ACCOUNTS_TRANSFER',
          'ACCOUNTS_GET_BALANCE'
        ]
      }
    ],
    credential: {
      credentialType: 'FIDO',
      status: 'PENDING',
      payload: {
        id: 'X8aQc8WgIOiYzoRIKbTYJdlzMZ_8zo3ZiIL3Rvh_ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3Q',
        rawId: 'X8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3Q==',
        response: {
          // clientDataJSON needs to be utf-8 not base64
          clientDataJSON: '{"type":"webauthn.create","challenge":"MgA3ADgANQBjADIAZAA5ADkAYQA0AGMAMQA5AGQAMQBhADgANwBkADMANABmAGQAMABjADEAMABhAGQAMABiADUAMgA3ADIAMQBjAGYAMwBjADgAMAAyADgAOABjADIAOQBkAGEANQBiADAAZQBiAGUAZgA2ADcAOAAzADQAMAA","origin":"http://localhost:5000","crossOrigin":false}',
          attestationObject: 'o2NmbXRmcGFja2VkZ2F0dFN0bXSjY2FsZyZjc2lnWEcwRQIgHq9JKpi/bFnnu0uVV+k6JjHfBcFwWRRCXJWlejgzJLUCIQD2iOONGXebOCxq37UqvumxC/dJz1a3U9F1DaxVMFnzf2N4NWOBWQLBMIICvTCCAaWgAwIBAgIECwXNUzANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgMTg0OTI5NjE5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIRpvsbWJJcsKwRhffCrjqLSIEBR5sR7/9VXgfZdRvSsXaiUt7lns44WZIFuz6ii/j9f8fadcBUJyrkhY5ZH8WqNsMGowIgYJKwYBBAGCxAoCBBUxLjMuNi4xLjQuMS40MTQ4Mi4xLjEwEwYLKwYBBAGC5RwCAQEEBAMCBDAwIQYLKwYBBAGC5RwBAQQEEgQQFJogIY72QTOWuIH41bfx9TAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQA+/qPfPSrgclePfgTQ3VpLaNsBr+hjLhi04LhzQxiRGWwYS+vB1TOiPXeLsQQIwbmqQU51doVbCTaXGLNIr1zvbLAwhnLWH7i9m4ahCqaCzowtTvCQ7VBUGP5T1M4eYnoo83IDCVjQj/pZG8QYgOGOigztGoWAf5CWcUF6C0UyFbONwUcqJEl2QLToa/7E8VRjm4W46IAUljYkODVZASv8h3wLROx9p5TSBlSymtwdulxQe/DKbfNSvM3edA0up+EIJKLOOU+QTR2ZQV46fEW1/ih6m8vcaY6L3NW0eYpc7TXeijUJAgoUtya/vzmnRAecuY9bncoJt8PrvL2ir2kDaGF1dGhEYXRhWMRJlg3liA6MaHQ0Fw9kdmBbj+SuuaKGMseZXPO6gx2XY0EAAAAEFJogIY72QTOWuIH41bfx9QBAX8aQc8WgIOiYzoRIKbTYJdlzMZ/8zo3ZiIL3Rvh/ONfr9kZtudCwYO49tWVkjgJGyJSpoo6anRBVJGda0Lri3aUBAgMmIAEhWCB0Zo9xAj7V50Tu7Hj8F5Wo0A3AloIpsVDSY2icW9eSwiJYIH79t0O2hnPDguuloYn2eSdR7caaZd/Ffnmk4vyOATab'
        },
        type: 'public-key'
      }
    }
  }

  const scopesExternal: tpAPI.Schemas.Scope[] = payload.scopes as tpAPI.Schemas.Scope[]

  afterAll(async (): Promise<void> => {
    await DB.testCleanupConsents(consentIdsToCleanup)
    await DB.closeKnexConnection()
  })

  it('Should resolve successfully', async (): Promise<void> => {
    // Arrange
    consentIdsToCleanup.push(consentId)

    // Act
    const response = await createAndStoreConsent(
      consentId,
      participantId,
      scopesExternal,
      payload.credential,
      '-----BEGIN PUBLIC KEY-----\n' +
      'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWM/klen0su2Yxc3Y/klsWjG32sOG\n' +
      'U/sGIApTd7/d5FVks2ONQzS64dY16eCed6gp6uPm/R2F7nf9FBLGarg3lQ==\n' +
      '-----END PUBLIC KEY-----\n',
      deriveChallenge(payload),
      0
    )

    // Assert
    // We're mainly testing that nothing threw!
    expect(response).toBe(undefined)
  })
})
