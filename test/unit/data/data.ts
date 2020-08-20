import { Consent, ConsentCredential } from '~/model/consent'
import { ExternalScope } from '~/lib/scopes'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import { Scope } from '~/model/scope'

/*
 * Mock Request Resources
 */
// @ts-ignore
export const request: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    id: '1234'
  }
}

// @ts-ignore
export const requestWithPayloadScopes: Request = {
  headers: {
    fspiopsource: 'pisp-2342-2233',
    fspiopdestination: 'dfsp-3333-2123'
  },
  params: {
    id: '1234'
  },
  payload: {
    id: '1234',
    participantId: 'auth121',
    initiatorId: 'pispa',
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

// @ts-ignore
export const requestNoHeaders: Request = {
  params: {
    id: '1234'
  }
}

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
export const partialConsentActive: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'ACTIVE'
}

export const partialConsentActiveConflictingInitiatorId: Consent = {
  id: '1234',
  initiatorId: 'pi2-2233',
  participantId: 'dfs333-2123',
  status: 'ACTIVE'
}

export const partialConsentRevoked: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  revokedAt: '2020-08-19T05:44:18.843Z',
  status: 'REVOKED'
}

export const completeConsentRevoked: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'REVOKED',
  revokedAt: '2020-08-19T05:44:18.843Z',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

export const completeConsentActive: Consent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

export const completeConsentActiveNoCredentialID: Consent = {
  id: '1234',
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
  consentId: '1234',
  accountId: 'as2342',
  action: 'account.getAccess'
},
{
  id: 232234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'account.transferMoney'
},
{
  id: 234,
  consentId: '1234',
  accountId: 'as22',
  action: 'account.getAccess'
}
]

/*
 * Mock Credential Resources
*/

export const credential = {
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs=',
  credentialPayload: null
}

export const challenge = 'xyhdushsoa82w92mzs='

export const completeConsentActiveCredential: Consent = {
  id: '1234',
  status: 'ACTIVE',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'ACTIVE',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}
