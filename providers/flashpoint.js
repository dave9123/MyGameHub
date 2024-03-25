const gameactivity = require("../handlers/gameactivity");

async function search(searchTerm, filter) {
    filter = filter || "true";
    console.log("Fetching from Flashpoint API searchTerm '" + searchTerm + "' and filter " + filter)
    const flashpointResponse = await fetch(`https://db-api.unstable.life/search?smartSearch=${searchTerm}&filter=${filter}&fields=id,title,developer,publisher,platform,library,tags,originalDescription,dateAdded,dateModified`);
    if (!flashpointResponse.ok) {
      throw new Error(`Failed to fetch data from Flashpoint API (${flashpointResult.status} ${flashpointResult.statusText})`);
    }
    const json = await flashpointResponse.json()
    const result = json.filter((result) => result.platform === "Flash").map((result) => ({
        id: result.id,
        title: result.title,
        developer: result.developer,
        publisher: result.publisher,
        description: result.originalDescription,
        cover: `https://infinity.unstable.life/images/Logos/${result.id.substring(0,2)}/${result.id.substring(2,4)}/${result.id}.png?type=jpg`,
        getInfo: `https://ooooooooo.ooo/get?id=${result.id}`, //{"uuid":"06695a49-dd02-4902-ae18-aa13d8b50c20","title":"The Sigworminator 6000","launchCommand":"http://uploads.ungrounded.net/231000/231585_Create_a_worm.swf?123","utcMilli":"1616732063351","extreme":false,"votesWorking":0,"votesBroken":0,"isZipped":true}
        provider: "Flashpoint"
      }));
    if (result.length === 0) {
        console.log("No results found from Flashpoint API");
    }
    console.log("Finished fetching from Flashpoint API");
    return result;
};

async function getgame(id, token) {
    const gameinfo = await fetch(`https://ooooooooo.ooo/get?id=${id}`)
    if (gameinfo.ok) {
        const gameinfojson = await gameinfo.json();
        console.log(gameinfojson);
        if (token !== undefined) {
            try {
                await gameactivity.storeGameActivity(token, gameinfojson.title, provider, id);
            } catch (error) {
                console.error(error);
            }
        }
        res.json({
            uuid: gameinfojson.id,
            title: gameinfojson.title,
            extreme: gameinfojson.extreme,
            gameFile: gameinfojson.launchCommand,
            gameLocationOnZip: decodeURIComponent('content/' + new URL(gameinfojson.launchCommand).hostname + new URL(gameinfojson.launchCommand).pathname),
            gameFile2: `https://download.unstable.life/gib-roms/Games/${gameinfojson.uuid}-${gameinfojson.utcMilli}.zip`,//https://download.unstable.life/gib-roms/Games/001485ad-b206-4e72-a44d-605d836afe6c-1630664499395.zip
        });
    } else if (!gameinfo.ok){
        res.status(404).json({ error: "Failed to fetch game, game might not exist" });
    }
}

module.exports = {
    search,
    getgame
};