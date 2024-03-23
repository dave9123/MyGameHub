const database = require('./database');
const { verifyUser } = require('./authentication');

async function gameActivity(token, userid, game, provider, gameid) {
    try {
        await verifyUser(token);
        await database.poolQuery('INSERT INTO gameactivity (userid, gamename, provider, gameid) VALUES (?, ?, ?, ?)', [userid, game, provider, gameid]);
        console.log(`Logged game activity for ${userid} playing ${game} from ${provider} with ID ${gameid}`);
    } catch (error) {
        throw new Error('Error logging game activity: ' + error);
    }
};

module.exports = {
    gameActivity
}