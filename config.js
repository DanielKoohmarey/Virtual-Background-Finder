const { Pool, Client } = require('pg')
const connectionString = 'postgresql://postgres:postgres@localhost:5432/cache'
const pool = new Pool({
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: process.env.DATABASE_URL ?  { rejectUnauthorized: false } : false
})

module.exports = {pool}