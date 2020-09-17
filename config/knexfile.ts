import { DatabaseConfig } from '../src/shared/config'
import path from 'path'
require('ts-node/register')
const migrationsDirectory = path.join(__dirname, '../migrations')
const seedsDirectory = path.join(__dirname, '../seeds')

interface KnexConfig {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
}

const mySQLConfig: DatabaseConfig = {
  client: 'mysql',
  version: '5.5',
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'auth-service',
    password: 'password',
    database: 'auth-service',
    timezone: 'UTC'
  },
  pool: {
    min: 10,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
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
}

const Config: KnexConfig = {
  development: mySQLConfig,
  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations: {
      directory: migrationsDirectory,
      tableName: 'auth-service',
      loadExtensions: ['.ts']
    },
    seeds: {
      directory: seedsDirectory,
      loadExtensions: ['.ts']
    }
  },
  production: mySQLConfig
}

export default Config
module.exports = Config
