const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

async function dbInit() {
    try {
        console.log("Checking if the database is accessible...")
        await pool.query(`CREATE TABLE IF NOT EXISTS authentication (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userid INT NOT NULL,
                username VARCHAR(255) NOT NULL,
                globalname VARCHAR(255) NOT NULL,
                avatar VARCHAR(255) NOT NULL
            )
        `);
        console.log("Database seems to be accessible.");
    } catch(error) {
        console.log(`Database seems to be unaccessible,`, error);
    }
}

const poolQuery = async (...args) => {
    try {
        return await pool.query(...args);
    } catch (err) {
        console.error(err);
        throw new Error('Error querying the database: ' + err);
    }
};

module.exports = {
    dbInit,
    poolQuery
};