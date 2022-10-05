require('dotenv').config();
const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host:process.env.host,
    user:process.env.user,
    password:process.env.password,
    database:process.env.database,
    connectionLimit:process.env.connectionLimit,
})
module.exports = pool;