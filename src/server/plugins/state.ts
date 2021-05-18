/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License")
 and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed
 on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
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

 - Paweł Marzec <pawel.marzec@modusbox.com>

 --------------
 ******/
import {
  WSO2Auth,
  MojaloopRequests,
  ThirdpartyRequests,
  Logger as SDKLogger
} from '@mojaloop/sdk-standard-components'
import { ResponseToolkit, Server } from '@hapi/hapi'
import { logger } from '~/shared/logger'

import config from '~/shared/config'

export interface StateResponseToolkit extends ResponseToolkit {
  getLogger: () => SDKLogger.Logger
  getMojaloopRequests: () => MojaloopRequests
  getThirdpartyRequests: () => ThirdpartyRequests
  getWSO2Auth: () => WSO2Auth
  getDFSPId: () => string
}

export const StatePlugin = {
  version: '1.0.0',
  name: 'StatePlugin',
  once: true,

  register: async (server: Server): Promise<void> => {
    // interface to help casting
    interface TLSCreds {
      ca: string
      cert: string
      key: string
    }
    try {
      // prepare WSO2Auth
      const wso2Auth = new WSO2Auth({
        ...config.SHARED.WSO2_AUTH,
        logger,
        tlsCreds: config.SHARED.TLS.mutualTLS.enabled
          ? config.SHARED.TLS.creds as TLSCreds
          : undefined
      })

      // prepare Requests instances
      const mojaloopRequests = new MojaloopRequests({
        logger,
        peerEndpoint: config.SHARED.PEER_ENDPOINT,
        alsEndpoint: config.SHARED.ALS_ENDPOINT,
        quotesEndpoint: config.SHARED.QUOTES_ENDPOINT,
        transfersEndpoint: config.SHARED.TRANSFERS_ENDPOINT,
        bulkTransfersEndpoint: config.SHARED.BULK_TRANSFERS_ENDPOINT,
        thirdpartyRequestsEndpoint: config.SHARED.THIRDPARTY_REQUESTS_ENDPOINT,
        transactionRequestsEndpoint: config.SHARED.TRANSACTION_REQUEST_ENDPOINT,
        dfspId: config.SHARED.DFSP_ID,
        tls: config.SHARED.TLS,
        jwsSign: config.SHARED.JWS_SIGN,
        jwsSigningKey: <Buffer>config.SHARED.JWS_SIGNING_KEY
      })

      const thirdpartyRequest = new ThirdpartyRequests({
        logger,
        peerEndpoint: config.SHARED.PEER_ENDPOINT,
        alsEndpoint: config.SHARED.ALS_ENDPOINT,
        quotesEndpoint: config.SHARED.QUOTES_ENDPOINT,
        transfersEndpoint: config.SHARED.TRANSFERS_ENDPOINT,
        bulkTransfersEndpoint: config.SHARED.BULK_TRANSFERS_ENDPOINT,
        thirdpartyRequestsEndpoint: config.SHARED.THIRDPARTY_REQUESTS_ENDPOINT,
        transactionRequestsEndpoint: config.SHARED.TRANSACTION_REQUEST_ENDPOINT,
        dfspId: config.SHARED.DFSP_ID,
        tls: config.SHARED.TLS,
        jwsSign: config.SHARED.JWS_SIGN,
        jwsSigningKey: <Buffer>config.SHARED.JWS_SIGNING_KEY
      })

      // prepare toolkit accessors
      server.decorate('toolkit', 'getLogger', (): SDKLogger.Logger => logger)
      server.decorate('toolkit', 'getMojaloopRequests', (): MojaloopRequests => mojaloopRequests)
      server.decorate('toolkit', 'getThirdpartyRequests', (): ThirdpartyRequests => thirdpartyRequest)
      server.decorate('toolkit', 'getWSO2Auth', (): WSO2Auth => wso2Auth)
      server.decorate('toolkit', 'getDFSPId', (): string => config.SHARED.DFSP_ID)
    } catch (err) {
      logger.error('StatePlugin: unexpected exception during plugin registration')
      logger.error(err)
      logger.error('StatePlugin: exiting process')
      process.exit(1)
    }
  }
}
