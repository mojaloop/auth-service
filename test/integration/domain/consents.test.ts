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
    status: 'ISSUED',
    consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
    scopes: [
      {
        address: 'dfspa.username.5678',
        actions: ['ACCOUNTS_TRANSFER', 'ACCOUNTS_GET_BALANCE']
      }
    ],
    credential: {
      credentialType: 'FIDO',
      status: 'PENDING',
      fidoPayload: {
        id: '0bxBqxgf0iV62tNEXnM22nkXybhsRHM2VrR7n-iGP4J6PcZr_dsL7NtjrBqReTXNsQXHIhJlYZ7qz8VCsf4qXw',
        rawId: '0bxBqxgf0iV62tNEXnM22nkXybhsRHM2VrR7n+iGP4J6PcZr/dsL7NtjrBqReTXNsQXHIhJlYZ7qz8VCsf4qXw==',
        response: {
          attestationObject:
            'o2NmbXRoZmlkby11MmZnYXR0U3RtdKJjc2lnWEgwRgIhALQ8cff27oNd/pmIlLg+8LjoIngh/e6A2w5VAtDNgGa2AiEArZvywfWPjc0/YBWO1o4dweyV9Ye6Vg/4le6r0lN7y4ZjeDVjgVkC3DCCAtgwggHAoAMCAQICCQCwOSo3Xzii6zANBgkqhkiG9w0BAQsFADAuMSwwKgYDVQQDEyNZdWJpY28gVTJGIFJvb3QgQ0EgU2VyaWFsIDQ1NzIwMDYzMTAgFw0xNDA4MDEwMDAwMDBaGA8yMDUwMDkwNDAwMDAwMFowbjELMAkGA1UEBhMCU0UxEjAQBgNVBAoMCVl1YmljbyBBQjEiMCAGA1UECwwZQXV0aGVudGljYXRvciBBdHRlc3RhdGlvbjEnMCUGA1UEAwweWXViaWNvIFUyRiBFRSBTZXJpYWwgOTI1NTE0MTYwMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEwVMw28cO1cij64vzXAeaMv3lVgZMJF30DVNYC3Ppy0eRD+8XFfd5eWhw6atcF4zrmQOYwSaFqW+p24YVjiPZwqOBgTB/MBMGCisGAQQBgsQKDQEEBQQDBQQDMCIGCSsGAQQBgsQKAgQVMS4zLjYuMS40LjEuNDE0ODIuMS43MBMGCysGAQQBguUcAgEBBAQDAgQwMCEGCysGAQQBguUcAQEEBBIEEC/AV5+BE0fqsRa7Wo25ICowDAYDVR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAQEAAWkxZOSY9oijO0kPqyEvWCxI+McciZSfXxjqInQ5Zc4+M+1KXQtiUPrnDgT2PNSTuoSU8HBJCHcKED0WTuWQEnJgQzbiIsycaokHLe7xeCekiR8BHsVqReF87SB7VhJnfCW55bzMNZTMMflLg9OpddS8ZH4Svyzetd0vdRQAXH/1Yh+q6pkqR7viCNuo1nmBJbZNFn+47zrURSpEThQZdlj3Ng4NXkUWDikiTKkIUJ9gbnfN7jxcU9R+ck9vTCrY8ugycsz+P1EI4S5rsvTQ7frZW7b36126yIrVTEROqEXq7dI7rzPDzzG+rb1WEH4jNiGmCygoZ+chQssL0fV2vmhhdXRoRGF0YVjESZYN5YgOjGh0NBcPZHZgW4/krrmihjLHmVzzuoMdl2NBAAAAAAAAAAAAAAAAAAAAAAAAAAAAQNG8QasYH9IletrTRF5zNtp5F8m4bERzNla0e5/ohj+Cej3Ga/3bC+zbY6wakXk1zbEFxyISZWGe6s/FQrH+Kl+lAQIDJiABIVggiE7qZLU2eP0J44rHBHk+VBjM2zRdMiGh8unZi5mr+m0iWCBl+iwg3Vix6omFdl+x8S1RC5SGSuoUWe9/B1DzOEDIeA==',
          clientDataJSON:
            'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiTnpaa1kySXhabUZoWW1Ka1ltSmtNRGRpTkRRNVkySXpOekk0WlRNNE9EUTVaakprT0dVMFpXSTFaVGt6TWpWa056SXdOV0ZrTm1ZelkyTXpaakkzTXciLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJjcm9zc09yaWdpbiI6ZmFsc2V9'
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
