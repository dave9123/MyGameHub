const database = require('./database');
const authentication = require('./authentication');

async function storeGameActivity(token, gamename, provider, gameid) {
    try {
        user = await authentication.verifyUser(token);
        userid = await user.userid;
        console.log("Storing game activity for", userid, gamename, provider, gameid)
        await database.poolQuery('INSERT INTO gameactivity (userid, gamename, provider, gameid) VALUES (?, ?, ?, ?)', [userid, gamename, provider, gameid]);
        console.log(`Logged game activity for ${userid} playing ${gamename} from ${provider} with ID ${gameid}`);
    } catch (error) {
        throw new Error('Error logging game activity:', error);
    }
};

async function fetchGameActivity(token) {
    try {
        userid = (await authentication.quickVerifyUser(token)).userid;
        console.log("Fetching game activity for", userid)
        const games = (await database.poolQuery('SELECT * FROM gameactivity WHERE userid = ?', [userid]))[0];
        console.log(`Fetched game activity for ${userid}:`, games);
        return games;
    } catch (error) {
        throw new Error('Error fetching game activity: ', error);
    }
}

module.exports = {
    storeGameActivity,
    fetchGameActivity
}