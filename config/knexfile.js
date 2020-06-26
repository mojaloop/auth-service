// const path = require('path')

import path from 'path'

// const { knexSnakeCaseMappers } = require('objection')

const BASE_PATH = path.join(__dirname, '../')

const connectionString = `${process.env.DATABASE_URL}${process.env.DATABASE_URL_SSL || ''}`

const config = {
  // TODO: update me for mojaloop config
  client: 'postgresql',
  connection: `${connectionString}`,
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, cb) => {
      conn.query('SET timezone="UTC";', err => {
        cb(err, conn)
      })
    }
  },
  migrations: {
    directory: path.join(BASE_PATH, 'migrations'),
    schemaName: 'public',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: path.join(BASE_PATH, 'seeds')
  }
  // ...knexSnakeCaseMappers()
}

export default config
