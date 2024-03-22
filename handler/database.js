const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const poolQuery = async (...args) => {
    try {
        return await pool.query(...args);
    } catch (err) {
        console.error(err);
        throw new Error('Error querying the database: ' + err);
    }
};

module.exports = {
    poolQuery
};