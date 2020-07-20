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

// interface AuthPayload {
//   consentId: string;
//   sourceAccountId: string;
//   status: string;
//   challenge: string;
//   value: string;
// }

// @ts-ignore
// export async function post (request: Request, h: ResponseToolkit): Promise<ResponseObject> {
// TODO: request validation for headers and
// payload structure (non existent/extra fields)

// const payload: AuthPayload = request.payload
// let consent: Consent

// Validate against null fields
// for (const key in payload) {
//   if (payload[key as keyof AuthPayload] == null) {
// Incorrect payload - return error?
//   }
// }

// Validate incoming status
// if (payload.status !== 'PENDING') {
// Incorrect payload - return error?
// }

// try {
//   consent = await consentDB.retrieve(id)
// } catch (error) {
//   Logger.push(error).error('Error in retrieving consent')
//   throw error
// }
// Check if consent exists and retrieve consent data
// Check for presence of key, verified key status

// Check if scope exists and matches out for the consent

// validate signature

// Return Success code informing source: request received
// return h.response().code(202)

// Using setImmediate
// error handling

// PUT request to switch
// }
