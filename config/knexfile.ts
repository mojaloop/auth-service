const migrationsDirectory = "../migrations"
const seedsDirectory = "../seeds"
import {config} from "../src/lib/config"
import path from "path"

const Config = {
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
      directory: path.join(__dirname, "../migrations/"),
      tableName: 'auth-service',
      loadExtensions: ['.ts']
    },
    seeds: {
      directory: path.join(__dirname, "../seeds/"),
      loadExtensions: ['.ts']
    }
  }
}

export default Config;
module.exports = Config