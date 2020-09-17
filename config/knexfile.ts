import config from '../src/shared/config'
// const config = require('')
import path from 'path'
const migrationsDirectory = path.join(__dirname, '../migrations')
const seedsDirectory = path.join(__dirname, '../seeds')

console.log('config.DATABASE', config.DATABASE)

const Config = {
  development: {
    client: 'mysql',
    version: '5.5',
    connection: config.DATABASE?.connection,
    pool: config.DATABASE?.pool,
    migrations: {
      directory: migrationsDirectory,
      tableName: 'migration',
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
      tableName: 'migration',
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
