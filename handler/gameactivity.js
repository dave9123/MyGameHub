const database = require('./database');
const { verifyUser } = require('./authentication');

async function storeGameActivity(token, game, provider, gameid) {
    try {
        userid = await verifyUser(token).id;
        await database.poolQuery('INSERT INTO gameactivity (userid, gamename, provider, gameid) VALUES (?, ?, ?, ?)', [userid, game, provider, gameid]);
        console.log(`Logged game activity for ${userid} playing ${game} from ${provider} with ID ${gameid}`);
    } catch (error) {
        throw new Error('Error logging game activity: ' + error);
    }
};

async function fetchGameActivity(token) {
    try {
        userid = await verifyUser(token).id;
        const games = await database.poolQuery('SELECT * FROM gameactivity WHERE userid = ?', [userid]);
        console.log(`Fetched game activity for ${userid}:`, games);
        return games;
    } catch (error) {
        throw new Error('Error fetching game activity: ' + error);
    }
}

module.exports = {
    storeGameActivity,
    fetchGameActivity
}