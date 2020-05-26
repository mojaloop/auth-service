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
