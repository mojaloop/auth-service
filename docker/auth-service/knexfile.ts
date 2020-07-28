import { config } from '../src/lib/config'
import path from 'path'
const migrationsDirectory = path.join(__dirname, '../migrations')
const seedsDirectory = path.join(__dirname, '../seeds')

const Config = {
  development: {
    client: 'mysql',
    version: '5.5',
    connection: config.get('DATABASE').connection,
    pool: config.get('DATABASE').pool,
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
  production: {
    /* For now, the production environment is the same as the development environment. */
    client: 'mysql',
    version: '5.5',
    connection: config.get('DATABASE').connection,
    pool: config.get('DATABASE').pool,
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
}

export default Config
/* Export is required to expose config to knex to seed and migrate containerised local mysql instance */
module.exports = Config
