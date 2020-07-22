/* To ignore from integration and BDD testing, addressed in #354 and #368 */
/* istanbul ignore file */

import Path from 'path'
import HapiOpenAPI from 'hapi-openapi'

const openAPIOptions = {
  api: Path.resolve(__dirname, '../../interface/swagger.json'),
  handlers: Path.resolve(__dirname, '../handlers'),
  extensions: ['ts']
}

export default {
  plugin: HapiOpenAPI,
  options: openAPIOptions
}
