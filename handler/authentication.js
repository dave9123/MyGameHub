const jwt = require('jsonwebtoken');
const database = require('./database');
require('dotenv').config();

async function authenticateUser(json) {
    if (json === undefined) {
        throw new Error('No JSON data provided');
    } else {
        const user = await database.poolQuery('SELECT * FROM authentication WHERE userid = ?', [json.id]);
        console.log(user);
        if (user.length > 1 && user.length < 3) {
            await database.poolQuery('INSERT INTO authentication (userid, username, globalname, avatar) VALUES (?, ?, ?, ?)', [json.id, json.username, json.global_name, `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.png`]);
        } else if (user.length > 2) {
            throw new Error('Multiple users found with the same ID, more like wtf?');
        } else {
            await database.poolQuery('UPDATE authentication SET username = ?, globalname = ?, avatar = ? WHERE userid = ?', [json.username, json.global_name, `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.png`, json.id]);
        }
        const token = jwt.sign({ id: json.id }, process.env.JWT_SECRET, { expiresIn: '30d' }); // Expires in 30 days
        console.log('User authenticated:', json.username, 'with token:', token)
        return token;
    }
};

async function verifyUser(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('User verified:', decoded);
        const user = await database.poolQuery('SELECT * FROM authentication WHERE userid = ?', [decoded.id]);
        console.log(user);
        return { userid: decoded.id, username: user[0].username, globalname: user[0].globalname, avatar: user[0].avatar};
    } catch (error) {
        throw new Error('Invalid token recieved or database might be unaccessible', error);
    }
};

module.exports = { authenticateUser, verifyUser };