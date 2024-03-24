const fs = require('fs-extra');
const gameactivity = require("../handlers/gameactivity");

async function search(searchTerm) {
    json = undefined;
    result = undefined;
    if (fs.existsSync(`debug/armorgames.json`)) {
        console.log("Using cached Armor Games search results");
        json = JSON.parse(await fs.readFile(`debug/armorgames.json`));
    } else if (!fs.existsSync(`debug/armorgames.json`)) {
        console.log("Cached Armor Games search results not found");
        const response = await fetch('https://armorgames.com/service/game-search');
        if (!response.ok) {
            throw new Error(`Failed to fetch data from Armor Games API (${response.status} ${response.statusText})`);
        } else if (response.ok) {
            json = await response.json();
            await fs.ensureDir("debug");
            await fs.writeFile(`debug/armorgames.json`, JSON.parse(armorgamesResultJson));
        }
    }
    result = json.filter((game) => game.label && game.label.toLowerCase().includes(searchTerm.toLowerCase())).filter((game) => game.url.split("/")[1] === "play").map((game) => ({
        id: game.game_id,
        title: game.label,
        cover: game.thumbnail,
        gameUrl: `https://armorgames.com${game.url}`,
        provider: "Armor Games",
    }));
    return result;
}

async function getgame(id, token) {
    const gameFile = await fetchGame("armorgames", id, `https://armorgames.com/play/${id}`);
    if (token !== undefined) {
      try {
        fs.readFile('debug/armorgames.json', 'utf8', async (err, data) => {
          if (err !== undefined) {
            console.error(err);
          } else {
            const gameResult = JSON.parse(data).filter(game => Number(game.game_id) === Number(req.query.game_id))
            if (gameResult.length > 0) {
              try {
                await gameactivity.storeGameActivity(token, gameResult.label, provider, id);
              } catch (error) {
                console.warn("An error occured while storing gaming activity:", error);
              }
            } else {
              console.log("Game not found in cache");
            }
          }
        });
      } catch (error) {
        console.error(error);
      }
    }
    //res.json({ gameFile: gameFile });
}

module.exports = {
    search
};