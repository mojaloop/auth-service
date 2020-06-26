import knex from 'knex'

// const config = require('../../config/knexfile.js')
// @ts-ignore
import config from '../../config/knexfile'
const db = knex(config)

export default db
