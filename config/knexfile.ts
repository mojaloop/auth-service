const migrationsDirectory = "../migrations"
const seedsDirectory = "../seeds"
import {config} from "../src/lib/config"

module.exports = {
  client: 'mysql',
  version: '5.5',
  connection: config.DATABASE.connection,
  pool: config.DATABASE.pool,
  migrations: {
    directory: migrationsDirectory,
    tableName: 'auth-service',
    stub: `${migrationsDirectory}/migration.template`
  },
  seeds: {
    directory: seedsDirectory,
    loadExtensions: ['.js']
  }
}
