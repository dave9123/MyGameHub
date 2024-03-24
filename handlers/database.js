const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
var isDBOnline = false;

async function dbInit() {
    try {
        console.log("Checking if the database is accessible...")
        await pool.query(`CREATE TABLE IF NOT EXISTS authentication (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userid BIGINT NOT NULL,
                username VARCHAR(255) NOT NULL,
                globalname VARCHAR(255) NOT NULL,
                avatar VARCHAR(255) NOT NULL
            )
        `);
        await pool.query(`CREATE TABLE IF NOT EXISTS gameactivity (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userid BIGINT NOT NULL,
                gamename VARCHAR(255) NOT NULL,
                provider VARCHAR(255) NOT NULL,
                gameid VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("Database seems to be accessible.");
        isDBOnline = true;
    } catch(error) {
        console.log(`Database seems to be inaccessible,`, error);
        isDBOnline = false;
    }
}

const poolQuery = async (...args) => {
    try {
        return await pool.query(...args);
    } catch (err) {
        console.error(err);
        dbInit();
        throw new Error('Error querying the database: ' + err);
    }
};

module.exports = {
    dbInit,
    poolQuery,
    isDBOnline
};