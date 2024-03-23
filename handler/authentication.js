const jwt = require('jsonwebtoken');
const database = require('./database');
require('dotenv').config();

async function authenticateUser(json) {
    if (json === undefined) {
        throw new Error('No JSON data provided');
    } else {
        const user = await database.poolQuery('SELECT * FROM authentication WHERE id = ?', [json.id]);
        const profile = `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.png`;
        if (user.length === 0) {
            await database.poolQuery('INSERT INTO users (id, username, globalname, avatar) VALUES (?, ?)', [json.id, json.username, json.global_name, json.avatar]);
        }
    }
};

module.exports = { authenticateUser };