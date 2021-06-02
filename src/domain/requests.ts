/* eslint-disable max-len */
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

 - Raman Mangla <ramanmangla@google.com>
 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
/* istanbul ignore file */
// Testing will be covered in #354

import Config from '~/shared/config'
import {
  ThirdpartyRequests,
  BaseRequestConfigType
} from '@mojaloop/sdk-standard-components'
import { logger } from '~/shared/logger'

// Config file to instantiate ThirdPartyRequest object
const configRequest: BaseRequestConfigType = {
  dfspId: Config.PARTICIPANT_ID,
  logger: logger,
  peerEndpoint: Config.SHARED.PEER_ENDPOINT,
  alsEndpoint: Config.SHARED.ALS_ENDPOINT,
  quotesEndpoint: Config.SHARED.QUOTES_ENDPOINT,
  transfersEndpoint: Config.SHARED.TRANSFERS_ENDPOINT,
  bulkTransfersEndpoint: Config.SHARED.BULK_TRANSFERS_ENDPOINT,
  thirdpartyRequestsEndpoint: Config.SHARED.THIRDPARTY_REQUESTS_ENDPOINT,
  transactionRequestsEndpoint: Config.SHARED.TRANSACTION_REQUEST_ENDPOINT,
  tls: Config.SHARED.TLS,
  jwsSign: Config.SHARED.JWS_SIGN,
  jwsSigningKey: Config.SHARED.JWS_SIGNING_KEY as unknown as Buffer
}

const thirdPartyRequest: ThirdpartyRequests = new ThirdpartyRequests(configRequest)

export {
  thirdPartyRequest
}
