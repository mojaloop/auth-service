import { DbConnection } from './knexfile'
// Needed since connection could be a string or an object
export const DbConnectionFormat = {
    name: 'db-connection',
    validate: function (val: any) {
        // String check
        if (typeof val === 'string' || val instanceof String) return true;

        //  Object check
        if (typeof val === 'object' && val !== null) {
            const connection = val as DbConnection;
            
            // Check that object is DbConnection and has DbConnection fields
            if(connection.host == null || connection.port == null || connection.database == null) return false;

            return true;
        }

        return false;
    },
    coerce: function (val: any) {
        if (typeof val === 'string' || val instanceof String) return val as String;
        else return val as DbConnection;
    }
}