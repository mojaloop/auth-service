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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

// import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
// import { post } from '~/server/handlers/consents'
// import * as Domain from '~/domain/consents'
// import Logger from '@mojaloop/central-services-logger'
import axios from 'axios'
// import { Consent } from '~/model/consent'

// const mockStoreConsent = jest.spyOn(Domain, 'createAndStoreConsent')
// const mockIsPostRequestValid = jest.spyOn(Domain, 'isPostConsentRequestValid')
// const mockLoggerPush = jest.spyOn(Logger, 'push')
// const mockLoggerError = jest.spyOn(Logger, 'error')

/*
 * Mock Request Resources
 */
// @ts-ignore
// const request: Request = {
//   headers: {
//     fspiopsource: 'pisp-2342-2233',
//     fspiopdestination: 'dfsp-3333-2123'
//   },
//   params: {
//     id: '1234'
//   },
//   payload: {
//     id: '1234',
//     requestId: '475234',
//     initiatorId: 'pispa',
//     participantId: 'sfsfdf23',
//     scopes: [
//       {
//         accountId: '3423',
//         actions: ['acc.getMoney', 'acc.sendMoney']
//       },
//       {
//         accountId: '232345',
//         actions: ['acc.accessSaving']
//       }
//     ],
//     credential: null
//   }
// }

// @ts-ignore
// const h: ResponseToolkit = {
//   response: (): ResponseObject => {
//     return {
//       code: (num: number): ResponseObject => {
//         return num as unknown as ResponseObject
//       }
//     } as unknown as ResponseObject
//   }
// }

describe('server/handlers/consents', (): void => {
// beforeAll((): void => {
//   mockIsPostRequestValid.mockReturnValue(true)
//   mockStoreConsent.mockResolvedValue()
//   mockLoggerError.mockReturnValue(null)
//   mockLoggerPush.mockReturnValue(null)
//   jest.useFakeTimers()
// })

  // beforeEach((): void => {
  //   jest.clearAllTimers()
  //   jest.clearAllMocks()
  // })

  it('Should return 202 (Accepted) status code',
    async (): Promise<void> => {
      // const consent: Consent = {
      //   id: '123'
      // }

      // Arrange
      const scenariosURI = 'http://0.0.0.0:4004/consents'
      const body = {
        id: 'e3488c3a-a4f3-25a7-aa7a-fdc3994bb3ec',
        requestId: '179395e8-8dd7-16a0-99f9-0da8f0c51c7f',
        initiatorId: 'pispa',
        participantId: 'dfspa',
        scopes: [
          {
            scope: 'accounts.getBalance',
            accountId: 'dfspa.alice.1234'
          },
          {
            scope: 'accounts.transfer',
            accountId: 'dfspa.alice.1234'
          }
        ]
      }

      const headers = {
        date: new Date(),
        'fspiop-source': 'third-party API',
        'fspiop-destination': 'auth-service'
      }

      // let response: AxiosResponse

      // try {
      const response = await axios.post(scenariosURI, body, {
        headers: headers
      })

      expect(response.status).toEqual(202)
      // } catch (err) {
      // console.log(err.response)
      // }
    }
  )

  // it('Should return 400 code due to invalid request',
  //   async (): Promise<void> => {
  //     mockIsPostRequestValid.mockReturnValueOnce(false)

  //     const response = await post(
  //       request as Request,
  //       h as ResponseToolkit
  //     )
  //     expect(response).toBe(400)
  //     expect(mockIsPostRequestValid).toHaveBeenCalledWith(request)

  //     expect(setImmediate).not.toHaveBeenCalled()
  //     expect(mockStoreConsent).not.toHaveBeenCalled()
  //   })

  // it('Should throw an error due to error in creating/storing consent & scopes',
  //   async (): Promise<void> => {
  //     mockStoreConsent.mockRejectedValueOnce(
  //       new Error('Error Registering Consent'))

  //     const response = await post(request as Request, h as ResponseToolkit)
  //     expect(response).toBe(202)
  //     jest.runAllImmediates()

//     expect(setImmediate).toHaveBeenCalled()
//     expect(mockStoreConsent).toHaveBeenLastCalledWith(request)
//     expect(mockStoreConsent).not.toHaveLastReturnedWith('')
//   })
})

// {
//   '$ref': '#/parameters/Content-Length'
// },
// {
//   '$ref': '#/parameters/Content-Type'
// },
// {
//   '$ref': '#/parameters/Date'
// },
// {
//   '$ref': '#/parameters/X-Forwarded-For'
// },
// {
//   '$ref': '#/parameters/FSPIOP-Source'
// },
// {
//   '$ref': '#/parameters/FSPIOP-Destination'
// },
// {
//   '$ref': '#/parameters/FSPIOP-Encryption'
// },
// {
//   '$ref': '#/parameters/FSPIOP-Signature'
// },
// {
//   '$ref': '#/parameters/FSPIOP-URI'
// },
// {
//   '$ref': '#/parameters/FSPIOP-HTTP-Method'
// }
