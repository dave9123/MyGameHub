require('dotenv').config();
const database = require('./handler/database');

async() => {
    try {
        await database.poolQuery(`DROP TABLE IF EXISTS authentication`);
        console.log("Bonked table authentication")
    } catch (error) {
        console.error(error);
    }
}