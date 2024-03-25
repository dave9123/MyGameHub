require('dotenv').config();
const database = require('./handler/database');

async() => {
    console.log("Bonking tables...")
    try {
        await database.poolQuery(`DROP TABLE IF EXISTS authentication`);
        console.log("Bonked table authentication");
        await database.poolQuery(`DROP TABLE IF EXISTS gameactivity`);
        console.log("Bonked table gameactivity");
    } catch (error) {
        console.error(error);
    }
}