/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 - Lewis Daly <lewisd@crosslaketech.com>
 --------------
 ******/
import { ControlledStateMachine, PersistentModelConfig, StateData } from './persistent.model'
import { Method } from 'javascript-state-machine'
import { ThirdpartyRequests, MojaloopRequests } from '@mojaloop/sdk-standard-components'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { PubSub } from '~/shared/pub-sub'
import { Consent } from '../consents'

export interface VerifyTransactionStateMachine extends ControlledStateMachine {
  retrieveConsent: Method
  onRetrieveConsent: Method
  verifyTransaction: Method
  onVerifyTransaction: Method
  sendCallbackToDFSP: Method
  onSendCallbackToDFSP: Method
}

export interface VerifyTransactionModelConfig extends PersistentModelConfig {
  subscriber: PubSub
  thirdpartyRequests: ThirdpartyRequests
  mojaloopRequests: MojaloopRequests
  requestProcessingTimeoutSeconds: number
  authServiceParticipantFSPId: string
}

export interface VerifyTransactionData extends StateData {
  // the DFSP requesting the verification of the transaction
  participantDFSPId: string

  // initial POST /thirdpartyRequests/verifications request
  verificationRequest: tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest

  verificationResponse?: tpAPI.Schemas.ThirdpartyRequestsVerificationsIDPutResponse
  // // metadata related to the verification request (for now just the origin)
  // verificationRequestMetadata: { origin: string }

  errorInformation?: tpAPI.Schemas.ErrorInformation

  consent?: Consent
}
