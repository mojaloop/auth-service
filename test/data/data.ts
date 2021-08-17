import { Consent } from '~/model/consent'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { ModelScope } from '~/model/scope'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets';

/*
 * Mock Request Resources
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const request: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    ID: 'b51ec534-ee48-4575-b6a9-ead2955b8069'
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const requestWithPayloadScopes: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    ID: 'b51ec534-ee48-4575-b6a9-ead2955b8069'
  },
  payload: {
    consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
    consentRequestId: 'dfsp-3333-2123',
    scopes: [{
      accountId: 'as2342',
      actions: ['accounts.getBalance', 'accounts.transfer']
    },
    {
      accountId: 'as22',
      actions: ['accounts.getBalance']
    }
    ]
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const requestWithPayloadCredentialAndScope: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    ID: 'b51ec534-ee48-4575-b6a9-ead2955b8069'
  },
  payload: {
    id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
    requestId: '475234',
    initiatorId: 'pispa',
    participantId: 'sfsfdf23',
    scopes: [
      {
        accountId: '3423',
        actions: ['acc.getMoney', 'acc.sendMoney']
      },
      {
        accountId: '232345',
        actions: ['acc.accessSaving']
      }
    ],
    credential: {
      id: '9876',
      credentialType: 'FIDO',
      status: 'PENDING',
      challenge: {
        payload: 'string_representing_challenge_payload',
        signature: 'string_representing_challenge_signature'
      },
      payload: 'string_representing_credential_payload'
    }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const requestNoHeaders: Request = {
  params: {
    ID: 'b51ec534-ee48-4575-b6a9-ead2955b8069'
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const h: ResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (num: number): ResponseObject => {
        return {
          statusCode: num
        } as unknown as ResponseObject
      }
    } as unknown as ResponseObject
  }
}

/*
 * Mock Consent Resources
 */
export const completeConsentRevoked: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  participantId: 'dfsp-3333-2123',
  status: 'REVOKED',
  revokedAt: '2020-08-19T05:44:18.843Z',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialChallenge: 'xyhdushsoa82w92mzs=',
  credentialPayload: '-----BEGIN PUBLIC KEY-----\n' +
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWM/klen0su2Yxc3Y/klsWjG32sOG\n' +
  'U/sGIApTd7/d5FVks2ONQzS64dY16eCed6gp6uPm/R2F7nf9FBLGarg3lQ==\n' +
  '-----END PUBLIC KEY-----\n',
  credentialCounter: 4
}

export const completeConsentActive: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  status: 'VERIFIED',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialChallenge: 'xyhdushsoa82w92mzs=',
  credentialPayload: '-----BEGIN PUBLIC KEY-----\n' +
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWM/klen0su2Yxc3Y/klsWjG32sOG\n' +
  'U/sGIApTd7/d5FVks2ONQzS64dY16eCed6gp6uPm/R2F7nf9FBLGarg3lQ==\n' +
  '-----END PUBLIC KEY-----\n',
  credentialCounter: 4
}


/*
 * Mock Scope Resources
*/
export const externalScopes: tpAPI.Schemas.Scope[] = [{
  accountId: 'as2342',
  actions: ['accounts.getBalance', 'accounts.transfer']
},
{
  accountId: 'as22',
  actions: ['accounts.getBalance']
}
]

export const scopes: ModelScope[] = [{
  id: 123234,
  consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  accountId: 'as2342',
  action: 'accounts.getBalance'
},
{
  id: 232234,
  consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  accountId: 'as2342',
  action: 'accounts.transfer'
},
{
  id: 234,
  consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  accountId: 'as22',
  action: 'accounts.getBalance'
}
]

/*
 * Mock Credential Resources
*/
export const challenge = 'xyhdushsoa82w92mzs='

export const completeConsentActiveCredential: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  status: 'VERIFIED',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialChallenge: 'xyhdushsoa82w92mzs=',
  credentialPayload: '-----BEGIN PUBLIC KEY-----\n' +
    'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEWM/klen0su2Yxc3Y/klsWjG32sOG\n' +
    'U/sGIApTd7/d5FVks2ONQzS64dY16eCed6gp6uPm/R2F7nf9FBLGarg3lQ==\n' +
    '-----END PUBLIC KEY-----\n',
  credentialCounter: 4
}


/* Verifications request variations */
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
