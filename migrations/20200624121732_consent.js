'use strict'

exports.up = async (knex, Promise) => {
    return await knex.schema.hasTable('consent').then(function(exists) {
        if (!exists) {
          return knex.schema.createTable('consent', (t) => {
            t.increments('id').primary().notNullable()
            t.string('initiatorid', 32).notNullable()
            t.string('participantid', 32).notNullable()
            t.integer('credentialid').notNullable()
            t.string('credentialtype', 16).notNullable()
            t.string('credentialstatus', 10).notNullable()
            t.string('credentialpayload').nullable()
            t.string('credentialchallenge', 128).notNullable()
          })
        }
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('consent')
}
