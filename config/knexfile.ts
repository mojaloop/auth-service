const migrationsDirectory = "../migrations"
const seedsDirectory = "../seeds"
import {config} from "../src/lib/config"

export const Config = {
  development : {
    client: 'mysql',
    version: '5.5',
    connection: config.DATABASE.connection,
    pool: config.DATABASE.pool,
    migrations: {
      directory: migrationsDirectory,
      tableName: 'auth-service',
      stub: `${migrationsDirectory}/migration.template`,
      loadExtensions: ['.ts']
    },
    seeds: {
      directory: seedsDirectory,
      loadExtensions: ['.ts']
    } 
  },
  test: {
    client: "sqlite3",
    connection: ":memory:",
    useNullAsDefault: true,
    migrations: {
      directory: migrationsDirectory
    },
    seeds: {
      directory: seedsDirectory
    }
  }
}

module.exports = Config