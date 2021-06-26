import * as Knex from 'knex'

export async function up (knex: Knex): Promise<void | Knex.SchemaBuilder> {
  return knex.schema.hasTable('Consent')
    .then(async (exists: boolean): Promise<Knex.SchemaBuilder | void> => {
      if (exists) {
        return await knex.schema.table('Consent', table => {
          table.string('clientDataJSON', 512).nullable()
          table.string('attestationObject', 2048).nullable()
        })
      }
    })
}

export async function down (knex: Knex): Promise<Knex.SchemaBuilder> {
  return await knex.schema.table('Consent', table => {
    table.dropColumn('clientDataJSON')
    table.dropColumn('attestationObject')
  })
}
