import { DbConnection, DbPool } from './knexfile'
// Needed since connection could be a string or an object
export const DbConnectionFormat = {
    name: 'db-connection',
    validate: function (val: any) {
        // String check - i.e. SQLite will use a string to specify connection in memory
        if (typeof val === 'string' || val instanceof String) return true;

        //  Object check
        if (typeof val === 'object' && val) {
            const connection = val as DbConnection;

            // Check that object is DbConnection and has DbConnection fields - 
            // i.e. PG and MySQL use a DbConnection object to configure
            // Verify that all fields are filled AND they are the right format - presence + format check
            if (typeof connection.host !== 'string') {
                throw new Error("Mandatory field: 'host' is missing or is in the wrong format")
            }
            
            if (typeof connection.port !== 'number') {
                throw new Error("Mandatory field: 'port' is missing or is in the wrong format")
            }

            if (typeof connection.database !== 'string') {
                throw new Error("Mandatory field: 'database' is missing or is in the wrong format")
            }

            if (typeof connection.user !== 'string') {
                throw new Error("Mandatory field: 'user' is missing or is in the wrong format")
            }

            if (typeof connection.user !== 'string') {
                throw new Error("Mandatory field: 'password' is missing or is in the wrong format")
            }

            return true;
        }

        throw new Error('Connection is not a string or a object conforming to the DbConnection interface')
    },
    coerce: function (val: any) {
        if (typeof val === 'string' || val instanceof String) return val as String;
        else return val as DbConnection;
    }
}

export const DbPoolFormat = {
    name: 'db-pool',
    validate: function (val: any) {
        if (val == null) {
            return true
        }
        else if(typeof val === 'object') {
            const pool = val as DbPool

            // Fields are allowed to be missing so only validate their format if the field is not undefined or null
            if(pool.min != null && typeof pool.min !== 'number') {
                throw new Error('min is not a number')
            }

            if(pool.max != null && typeof pool.max !== 'number') {
                throw new Error('max is not a number')
            }

            if(pool.acquireTimeoutMillis != null && typeof pool.acquireTimeoutMillis !== 'number') {
                throw new Error('acquireTimeoutMillis is not a number')
            }

            if(pool.createRetryIntervalMillis != null && typeof pool.createRetryIntervalMillis !== 'number') {
                throw new Error('createRetryIntervalMillis is not a number')
            }

            if(pool.createTimeoutMillis != null && typeof pool.createTimeoutMillis !== 'number') {
                throw new Error('createTimeoutMillis is not a number')
            }

            if(pool.reapIntervalMillis != null && typeof pool.reapIntervalMillis !== 'number') {
                throw new Error('reapIntervalMillis is not a number')
            }

            if(pool.destroyTimeoutMillis != null && typeof pool.destroyTimeoutMillis !== 'number') {
                throw new Error('destroyTimeoutMillis is not a number')
            }

            if(pool.idleTimeoutMillis != null && typeof pool.idleTimeoutMillis !== 'number') {
                throw new Error('idleTimeoutMillis is not a number')
            }

            return true
        }
        throw new Error('Pool is not null or an object conforming to the DbPool interface.')
    },
    coerce: function (val: any) {
        if (val == null) {
            return null;
        }
        return val as DbPool
    }
}