const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'HAS',
    password: 'adminadmin',
    port: 5432,
});

module.exports = pool;
