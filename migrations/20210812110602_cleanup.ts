import * as Knex from 'knex'

export async function up (knex: Knex): Promise<void | Knex.SchemaBuilder> {
  return knex.schema.hasTable('Consent')
    .then(async (exists: boolean): Promise<Knex.SchemaBuilder | void> => {
      if (exists) {
        return await knex.schema.table('Consent', table => {
          // api relic that shouldn't be needed
          table.dropColumn('initiatorId')

          // fido2-lib says to store this counter
          table.integer('credentialCounter').notNullable()

          // auth-service shouldn't need to store these
          table.dropColumn('clientDataJSON')
          table.dropColumn('attestationObject')

          // credentials are verified and registered upfront
          // this shouldn't be nullable anymore
          table.string('credentialId').notNullable().alter()
          table.string('credentialType').notNullable().alter()
          table.string('credentialStatus').notNullable().alter()
          table.string('credentialPayload').notNullable().alter()
          table.string('credentialChallenge').notNullable().alter()
        })
      }
    })
}

export async function down (knex: Knex): Promise<Knex.SchemaBuilder> {
  return await knex.schema.table('Consent', table => {
    table.string('initiatorId', 32).notNullable()
    table.dropColumn('credentialCounter')
    table.string('clientDataJSON', 512).nullable()
    table.string('attestationObject', 2048).nullable()
    table.string('credentialId').nullable().alter()
    table.string('credentialType').nullable().alter()
    table.string('credentialStatus').nullable().alter()
    table.string('credentialPayload').nullable().alter()
    table.string('credentialChallenge').nullable().alter()
  })
}
