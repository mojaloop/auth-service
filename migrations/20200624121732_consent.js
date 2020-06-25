'use strict'

exports.up = async (knex, Promise) => {
    return await knex.schema.hasTable('Consent').then(function(exists) {
        if (!exists) {
          return knex.schema.createTable('Consent', (t) => {
            t.string('id', 32).primary().notNullable()
            t.string('initiatorid', 32).notNullable()
            t.string('participantid', 32).notNullable()
            t.integer('credentialid').unsigned().nullable()
            t.string('credentialtype', 16).nullable()
            t.string('credentialstatus', 10).nullable()
            t.string('credentialpayload').nullable()
            t.string('credentialchallenge', 128).nullable()
          })
        }
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('Consent')
}
