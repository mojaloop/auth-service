import * as Knex from 'knex'

export async function up (knex: Knex): Promise<void | Knex.SchemaBuilder> {
  return knex.schema.hasTable('Consent')
    .then(async (exists: boolean): Promise<Knex.SchemaBuilder | void> => {
      if (exists) {
        // credentials are verified and registered upfront
        // this shouldn't be nullable anymore
        // sqlite doesn't seem to like `alter()`
        // NOTE: maybe we leave as is or start the database anew
        //       since has not been deployed in any production setting
        knex.raw('ALTER TABLE Consent ALTER COLUMN credentialId STRING NOT NULL')
        knex.raw('ALTER TABLE Consent ALTER COLUMN credentialType STRING NOT NULL')
        knex.raw('ALTER TABLE Consent ALTER COLUMN credentialStatus STRING NOT NULL')
        knex.raw('ALTER TABLE Consent ALTER COLUMN credentialPayload STRING NOT NULL')
        knex.raw('ALTER TABLE Consent ALTER COLUMN credentialChallenge STRING NOT NULL')

        return await knex.schema.table('Consent', table => {
          // api relic that shouldn't be needed
          table.dropColumn('initiatorId')

          // fido2-lib says to store this counter
          table.integer('credentialCounter').notNullable()

          // auth-service shouldn't need to store these
          table.dropColumn('clientDataJSON')
          table.dropColumn('attestationObject')
        })
      }
    })
}

export async function down (knex: Knex): Promise<Knex.SchemaBuilder> {
  knex.raw('ALTER TABLE Consent ALTER COLUMN credentialId STRING NULL')
  knex.raw('ALTER TABLE Consent ALTER COLUMN credentialType STRING NULL')
  knex.raw('ALTER TABLE Consent ALTER COLUMN credentialStatus STRING NULL')
  knex.raw('ALTER TABLE Consent ALTER COLUMN credentialPayload STRING NULL')
  knex.raw('ALTER TABLE Consent ALTER COLUMN credentialChallenge STRING NULL')

  return await knex.schema.table('Consent', table => {
    table.string('initiatorId', 32).notNullable()
    table.dropColumn('credentialCounter')
    table.string('clientDataJSON', 512).nullable()
    table.string('attestationObject', 2048).nullable()
  })
}
