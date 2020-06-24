'use strict'

exports.up = async (knex, Promise) => {
    return await knex.schema.hasTable('scope').then(function(exists) {
        if (!exists) {
          return knex.schema.createTable('consent', (t) => {
            t.increments('id').primary().notNullable()
            t.string('consentid', 32).references('id').inTable('consent')
            t.string('action', 36).notNullable()
            t.string('accountnumber', 36).notNullable()
          })
        }
    })
}

exports.down = function(knex, Promise) {
    knex.schema.dropTableIfExists('Scope')
}
