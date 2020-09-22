import { DbConnection } from './knexfile'
// Needed since connection could be a string or an object
export const DbConnectionFormat = {
    name: 'db-connection',
    validate: function (val: any) {
        // String check - i.e. SQLite will use a string to specify connection in memory
        if (typeof val === 'string' || val instanceof String) return true;

        //  Object check
        if (typeof val === 'object' && val !== null) {
            const connection = val as DbConnection;

            // Check that object is DbConnection and has DbConnection fields - 
            // i.e. PG and MySQL use a DbConnection object to configure
            if (connection.host == null ||
                connection.port == null ||
                connection.database == null ||
                connection.user == null ||
                connection.password == null) {
                    throw new Error('Connection object missing a mandatory field');
                }

            return true;
        }

        throw new Error('Connection is not a string or a object conforming to the DbConnection interface');
    },
    coerce: function (val: any) {
        if (typeof val === 'string' || val instanceof String) return val as String;
        else return val as DbConnection;
    }
}