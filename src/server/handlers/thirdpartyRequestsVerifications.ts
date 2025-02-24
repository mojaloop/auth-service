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

import { Request, ResponseObject } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'

import { logger } from '~/shared/logger'
import inspect from '~/shared/inspect'
import { create, VerifyTransactionModel } from '~/domain/stateMachine/verifyTransaction.model'
import { StateResponseToolkit } from '../plugins/state'
import config from '~/shared/config'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { VerifyTransactionData, VerifyTransactionModelConfig } from '~/domain/stateMachine/verifyTransaction.interface'

// shortcut
type VerificationsPostRequest = tpAPI.Schemas.ThirdpartyRequestsVerificationsPostRequest

/**
 * The HTTP request `POST /thirdpartyRequests/verifications` is used by the DFSP to verify a
 * signed 3rd party transaction
 *
 */
export async function post(_context: unknown, request: Request, h: StateResponseToolkit): Promise<ResponseObject> {
  const payload: VerificationsPostRequest = request.payload as VerificationsPostRequest
  const consentId = payload.consentId
  const initiatorId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]

  const data: VerifyTransactionData = {
    participantDFSPId: initiatorId,
    dfspId: h.getDFSPId(),
    currentState: 'start',
    verificationRequest: payload
  }

  // if the request is valid then DFSP returns response via PUT /thirdpartyRequests/verifications/{ID} call.
  const modelConfig: VerifyTransactionModelConfig = {
    kvs: h.getKVS(),
    subscriber: h.getSubscriber(),
    key: consentId,
    logger: logger,
    thirdpartyRequests: h.getThirdpartyRequests(),
    mojaloopRequests: h.getMojaloopRequests(),
    authServiceParticipantFSPId: config.PARTICIPANT_ID,
    requestProcessingTimeoutSeconds: config.REQUEST_PROCESSING_TIMEOUT_SECONDS
  }

  setImmediate(async (): Promise<void> => {
    try {
      const model: VerifyTransactionModel = await create(data, modelConfig)
      await model.run()
    } catch (error) {
      // the model catches all planned, catches unplanned errors,
      // handles callbacks and also rethrows the error to stop the state machine
      logger.info(`Error running VerifyTransactionModel : ${inspect(error)}`)
    }
  })

  // safe to return a 202 response
  return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
}

export default {
  post
}
