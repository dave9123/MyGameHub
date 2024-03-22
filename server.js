require("dotenv").config();
const express = require("express");
const app = express();
const Sentry = require("@sentry/node");
const path = require("path");
const fs = require("fs-extra");
const cheerio = require("cheerio");
const mysql = require("mysql2");
const port = process.env.PORT || 3000;
const database = require("./handler/database");

if (process.env.SENTRY_DSN !== undefined) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

async function fetchGame(provider, id, url) {
  console.log(`Fetching game file from ${provider} with id ${id}`);
  if (provider === "armorgames") {
    if (fs.existsSync(`debug/${id}.html`)) {
      console.log("File exists");
      const gameFile = cheerio.load(await fs.readFile(`debug/${id}.html`))('param[name="movie"]').attr("value");
      return gameFile;
    } else if (!fs.existsSync(`debug/${id}.json`)) {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch game file" });
      } else {
        const html = await response.text();
        await fs.ensureDir("debug");
        await fs.writeFile(`debug/armorgames-${id}.html`, html);
        const gameFile = cheerio.load(html)('param[name="movie"]').attr("value");
        return gameFile;
      }
    }
  } else {
    throw new Error("Invalid provider");
  }
}

//app.get("/", (req, res) => {
//  const refreshToken = req.session.refreshToken;
//  if (refreshToken === undefined) {
//    res.sendFile(path.join(__dirname, "public_html", "index.html"));
//  } else {
//    console.log(refreshToken);
//    res.send(
//      'Hello, logged in user<script>top.location.href="index.html";</script>'
//    );
//  }
//});

//app.get("/api/user", async (req, res) => {
//  const accessToken = req.session.accessToken;
//  const refreshToken = req.session.refreshToken;
//  const accessTokenExpiresAt = req.session.accessTokenExpiresAt;
//
//  if (!accessToken || !refreshToken || Date.now() > accessTokenExpiresAt) {
//    const token = await fetch("https://discord.com/api/oauth2/token", {
//      method: "POST",
//      headers: {
//        "Content-Type": "application/x-www-form-urlencoded",
//      },
//      body: new URLSearchParams({
//        client_id: process.env.DISCORD_CLIENT_ID,
//        client_secret: process.env.DISCORD_CLIENT_SECRET,
//        grant_type: "refresh_token",
//        refresh_token: refreshToken,
//        scope: "identify",
//      }),
//    });
//    console.log(token);
//    const tokenJson = await token.json();
//    console.log(tokenJson);
//  }
//});

//app.get("/auth/discord", (req, res) => {
//  res.redirect(
//    `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.BASE_PATH}/auth/discord/callback&response_type=code&scope=identify`
//  );
//});

//app.get("/auth/discord/callback", async (req, res) => {
//  const code = req.query.code;
//  if (!code) {
//    return res.status(400).send("Code is required");
//  }
//  const response = await fetch("https://discord.com/api/oauth2/token", {
//    method: "POST",
//    headers: {
//      "Content-Type": "application/x-www-form-urlencoded",
//    },
//    body: new URLSearchParams({
//      client_id: process.env.DISCORD_CLIENT_ID,
//      client_secret: process.env.DISCORD_CLIENT_SECRET,
//      grant_type: "authorization_code",
//      code,
//      redirect_uri: `${process.env.BASE_PATH}/auth/discord/callback`,
//      scope: "identify",
//    }),
//  });
//  const json = await response.json();
//  console.log(json);
//  const userResponse = await fetch("https://discord.com/api/users/@me", {
//    headers: {
//      Authorization: `${json.token_type} ${json.access_token}`,
//    },
//  });
//  const userJson = await userResponse.json();
//  console.log(userJson);
//  res.cookie("refreshToken", json.refresh_token, {
//    secure: process.env.SECURE,
//    maxAge: 24 * 60 * 60 * 7 * 1000, // 1 week
//  });
//  res.send(`
//    <div style="margin: 300px auto; max-width: 400px; display: flex; flex-direction: column; align-items: center; font-family: sans-serif;">
//    <h3>Welcome, ${userJson.global_name}</h3>
//    <script>
//      window.location.replace('/');
//    </script>
//    </div>
//  `);
//});

app.get("/flash", (req, res) => {
  res.sendFile(path.join(__dirname, "public_html", "flash.html"));
});

app.get("/documentation", (req, res) => {
  res.sendFile(path.join(__dirname, "public_html", "documentation.html"));
});

//app.get("/login", (req, res) => {
//  res.sendFile(path.join(__dirname, "public_html", "login.html"));
//});

app.get("/developers", (req, res) => {
  res.sendFile(path.join(__dirname, "public_html", "developers.html"));
});

app.get("/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "public_html", "settings.html"));
});

app.get("/api/search", async (req, res) => {
  const searchTerm = req.query.q;
  //const provider = req.query.provider;
  const flashpointAPI = `https://db-api.unstable.life/search?smartSearch=${searchTerm}&filter=true&fields=id,title,developer,publisher,platform,library,tags,originalDescription,dateAdded,dateModified`;
  const armorgamesAPI = "https://armorgames.com/service/game-search";
  if (!searchTerm) {
    return res.status(400).send("Search term is required");
  } else {
    console.log(req.query);
    console.log(`Fetching from Flashpoint API...`);
    const flashpointResponse = await fetch(flashpointAPI);
    if (!flashpointResponse.ok) {
      throw new Error(
        `Failed to fetch data from Flashpoint API (${flashpointResult.status} ${flashpointResult.statusText})`
      );
    }
    const flashpointSearchResultJson = await flashpointResponse.json();
    const flashpointSearchResult = flashpointSearchResultJson
      .filter((result) => result.platform === "Flash")
      .map((result) => ({
        id: result.id,
        title: result.title,
        developer: result.developer,
        publisher: result.publisher,
        description: result.originalDescription,
        cover: `https://infinity.unstable.life/images/Logos/${result.id.substring(0,2)}/${result.id.substring(2,4)}/${result.id}.png?type=jpg`,
        //gameFile: `https://download.unstable.life/gib-roms/Games/${result.id}-${result.utcMilli}.zip`,
        getInfo: `https://ooooooooo.ooo/get?id=${result.id}`, //{"uuid":"06695a49-dd02-4902-ae18-aa13d8b50c20","title":"The Sigworminator 6000","launchCommand":"http://uploads.ungrounded.net/231000/231585_Create_a_worm.swf?123","utcMilli":"1616732063351","extreme":false,"votesWorking":0,"votesBroken":0,"isZipped":true}
        provider: "Flashpoint",
      }));
    console.log("Finished fetching from Flashpoint API\nFetching from Armor Games API...");
    const armorgamesResponse = await fetch(armorgamesAPI);
    const armorgamesResultJson = await armorgamesResponse.json();
    await fs.ensureDir("debug");
    await fs.writeFile(`debug/armorgames.json`,JSON.stringify(armorgamesResultJson));
    var armorgamesSearchResult = await armorgamesResultJson;
    armorgamesSearchResult = armorgamesSearchResult.filter((game) => game.label && game.label.toLowerCase().includes(searchTerm.toLowerCase()));
    armorgamesSearchResult = armorgamesSearchResult.filter((game) => game.url.split("/")[1] === "play");
    console.log(armorgamesSearchResult);
    armorgamesSearchResult = armorgamesSearchResult.map((game) => ({
      id: game.game_id,
      title: game.label,
      cover: game.thumbnail,
      gameUrl: `https://armorgames.com${game.url}`,
      //gameFile: await fetchGame(`https://armorgames.com${game.url}`, "armorgames", game.game_id),
      //getInfo: `${process.env.BASE_PATH}/api/getgame?provider=armorgames&id=${game.game_id}`,
      provider: "Armor Games",
    }));
    console.log("Finished fetching from Armor Games API");
    res.json({ ...flashpointSearchResult });
  }
});

app.get('/api/getgame', async (req, res) => {
  const provider = req.query.provider;
  const id = req.query.id;
  if (!provider || !id) {
    return res.status(400).json({ error: "Provider and ID are required" });
  }
  if (provider === "armorgames") {
    const gameFile = await fetchGame("armorgames", id, `https://armorgames.com/play/${id}`);
    res.json({ gameFile: gameFile });
  } else if (provider === "flashpoint") {
    const gameinfo = await fetch(`https://ooooooooo.ooo/get?id=${id}`)
    if (gameinfo.ok) {
      const gameinfojson = await gameinfo.json();
      console.log(gameinfojson);
      //const gameFile = await fetchGame("flashpoint", id, `https://download.unstable.life/gib-roms/Games/${id}-${utcMilli}.zip`);
      res.json({
        uuid: gameinfojson.id,
        title: gameinfojson.title,
        utcMilli: gameinfojson.utcMilli,
        extreme: gameinfojson.extreme,
        gameFile: gameinfojson.launchCommand,
        gameLocationOnZip: decodeURIComponent('content/' + new URL(gameinfojson.launchCommand).hostname + new URL(gameinfojson.launchCommand).pathname),
        gameFile2: `https://download.unstable.life/gib-roms/Games/${gameinfojson.uuid}-${gameinfojson.utcMilli}.zip`,//https://download.unstable.life/gib-roms/Games/001485ad-b206-4e72-a44d-605d836afe6c-1630664499395.zip
      });
    } else {
      res.status(404).json({ error: "Failed to fetch game, game is probably not found" });
    }
  } else {
    res.status(400).json({ error: "Invalid provider" });
  };
});

app.use('/proxy', async (req, res) => {
  const url = req.query.url;
  if (url === undefined) {
    return res.status(400).json({ error: "URL is required" });
  } else if (!url.startsWith("https://download.unstable.life/gib-roms/Games/")) {
    return res.status(400).json({ error: "URL isn't invalid" });
  } else if (!url.endsWith(".zip")) {
    return res.status(400).json({ error: "URL isn't invalid" });
  } else {
    try {
      console.log(`Fetching file from ${url}`)
      response = await fetch(url);
      if (response.ok) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Disposition", `attachment; filename=${url.split("/").pop()}`);
        res.send(Buffer.from(await response.arrayBuffer()));
      } else {
        res.status(500).json({ error: "Failed to fetch file" });
      }
    } catch (error) {
      res.status(500).json({ error: error });
      console.error(error);
    }
  }
});

app.get("/auth/callback", async (req, res) => {
  if (req.query.mode === "action" && req.query.oobCode !== undefined) {
    res.send(``);
  }
});

app.use(express.static(path.join(__dirname, "public_html")));

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});