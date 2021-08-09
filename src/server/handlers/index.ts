/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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
 --------------
 ******/
import { Util } from '@mojaloop/central-services-shared'
import Health from './health'
import Metrics from './metrics'
import Consents from './consents'
import ParticipantsTypeID from './participants/{Type}/{ID}'
import ParticipantsTypeIDError from './participants/{Type}/{ID}/error'
import thirdpartyRequestsVerifications from './thirdpartyRequestsVerifications'
const OpenapiBackend = Util.OpenapiBackend

export default {
  HealthGet: Health.get,
  MetricsGet: Metrics.get,
  PostConsents: Consents.post,
  ParticipantsByTypeAndID3: ParticipantsTypeID.put,
  ParticipantsErrorByTypeAndID: ParticipantsTypeIDError.put,
  // TODO: this should be PostThirdpartyRequestsVerifications
  // waiting for PR: https://github.com/mojaloop/api-snippets/pull/101
  PutThirdpartyRequestsVerifications: thirdpartyRequestsVerifications.post,
  validationFail: OpenapiBackend.validationFail,
  notFound: OpenapiBackend.notFound,
  methodNotAllowed: OpenapiBackend.methodNotAllowed
}
