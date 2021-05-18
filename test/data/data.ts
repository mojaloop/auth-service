import { Consent, ConsentCredential } from '~/model/consent'
import { ExternalScope } from '~/lib/scopes'
import { Request, ResponseObject } from '@hapi/hapi'
import { Scope } from '~/model/scope'
import { CredentialStatusEnum } from '~/model/consent/consent'
import { StateResponseToolkit } from '~/server/plugins/state'

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
      actions: ['account.getAccess', 'account.transferMoney']
    },
    {
      accountId: 'as22',
      actions: ['account.getAccess']
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

export const h: StateResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (num: number): ResponseObject => {
        return {
          statusCode: num
        } as unknown as ResponseObject
      }
    } as unknown as ResponseObject
  },
  getLogger: jest.fn(),
  getMojaloopRequests: jest.fn(),
  getThirdpartyRequests: jest.fn(),
  getWSO2Auth: jest.fn(),
  getDFSPId: jest.fn()
} as unknown as StateResponseToolkit

/*
 * Mock Consent Resources
 */
export const partialConsentActive: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'ACTIVE'
}

export const partialConsentActiveConflictingInitiatorId: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  initiatorId: 'pi2-2233',
  participantId: 'dfs333-2123',
  status: 'ACTIVE'
}

export const partialConsentRevoked: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  revokedAt: '2020-08-19T05:44:18.843Z',
  status: 'REVOKED'
}

export const completeConsentRevoked: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'REVOKED',
  revokedAt: '2020-08-19T05:44:18.843Z',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

export const completeConsentActive: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

export const completeConsentActiveNoCredentialID: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

/*
 * Mock Scope Resources
*/
export const externalScopes: ExternalScope[] = [{
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

export const scopes: Scope[] = [{
  id: 123234,
  consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  accountId: 'as2342',
  action: 'account.getAccess'
},
{
  id: 232234,
  consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  accountId: 'as2342',
  action: 'account.transferMoney'
},
{
  id: 234,
  consentId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  accountId: 'as22',
  action: 'account.getAccess'
}
]

/*
 * Mock Credential Resources
*/

export const credentialPending: ConsentCredential = {
  credentialType: 'FIDO',
  credentialStatus: CredentialStatusEnum.PENDING,
  credentialChallenge: 'xyhdushsoa82w92mzs=',
  credentialPayload: null
}

export const challenge = 'xyhdushsoa82w92mzs='

export const completeConsentActiveCredential: Consent = {
  id: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'ACTIVE',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}
