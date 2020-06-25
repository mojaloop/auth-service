'use strict'

exports.up = async (knex, Promise) => {
    return await knex.schema.hasTable('Scope').then(function(exists) {
        if (!exists) {
          return knex.schema.createTable('Scope', (t) => {
            t.increments('id').primary().notNullable()
            t.string('consentid', 32).notNullable()
            t.string('action', 36).notNullable()
            t.string('accountid', 36).notNullable()

            t.foreign('consentid').references('id').inTable('Consent')
          })
        }
    })
}

exports.down = function(knex, Promise) {
    knex.schema.dropTableIfExists('Scope')
}
