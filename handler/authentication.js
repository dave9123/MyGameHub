const jwt = require('jsonwebtoken');
const database = require('./database');
require('dotenv').config();

async function authenticateUser(json) {
    if (json === undefined) {
        throw new Error('No JSON data provided');
    } else {
        const user = await database.poolQuery('SELECT * FROM authentication WHERE userid = ?', [json.id]);
        if (user.length === 0) {
            await database.poolQuery('INSERT INTO authentication (userid, username, globalname, avatar) VALUES (?, ?)', [json.id, json.username, json.global_name, `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.png`]);// ?size=1024
        } else if (user.length > 1) {
            throw new Error('Multiple users found with the same ID');
        } else {
            await database.poolQuery('UPDATE authentication SET username = ?, globalname = ?, avatar = ? WHERE userid = ?', [json.username, json.global_name, `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.png`, json.id]);
        }
        const token = jwt.sign({ id: json.id }, process.env.JWT_SECRET, { expiresIn: '30d' }); // Expires in 30 days
        return token;
    }
};

module.exports = { authenticateUser };