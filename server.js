require("dotenv").config();
const express = require("express");
const app = express();
const Sentry = require("@sentry/node");
const path = require("path");
const fs = require("fs-extra");
const cheerio = require("cheerio");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
//const crypto = require('crypto');
const authentication = require('./handlers/authentication');
const database = require('./handlers/database');
const gameactivity = require('./handlers/gameactivity');
//const flashpoint = require('./providers/flashpoint');
//const armorgames = require('./providers/armorgames');
const port = process.env.PORT || 3000;

if (process.env.DISCORD_CLIENT_ID === undefined) {
  throw new Error("DISCORD_CLIENT_ID environment variable is required!");
} else if (process.env.DISCORD_CLIENT_SECRET === undefined) {
  throw new Error("DISCORD_CLIENT_SECRET environment variable is required!");
} else if (process.env.BASE_PATH === undefined) {
  throw new Error("BASE_PATH environment variable is required!");
} else if (process.env.DB_HOST === undefined) {
  throw new Error("DB_HOST environment variable is required!");
} else if (process.env.DB_USER === undefined) {
  throw new Error("DB_USER environment variable is required!");
} else if (process.env.DB_PASS === undefined) {
  throw new Error("DB_PASS environment variable is required!");
} else if (process.env.DB_NAME === undefined) {
  throw new Error("DB_NAME environment variable is required!");
} else if (process.env.EMAIL === undefined) {
  throw new Error("EMAIL environment variable is required!");
} else if (process.env.SECURE === undefined) {
  throw new Error("SECURE environment variable is required!");
} else if (process.env.SECURE !== "true" && process.env.SECURE !== "false") {
  throw new Error("SECURE environment variable must be either 'true' or 'false'!");
} else {
  console.log("Environment variables are ok");
}

//function generateSessionId() {
//  return crypto.randomBytes(32).toString('base64');
//}

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
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: process.env.SESSION_SECRET,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  cookie: {
    sameSite: 'strict',
    signed: true
  }
}));
app.use(cookieParser(process.env.SESSION_SECRET));
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
        throw new Error(`Failed to fetch game file from Armor Games ${response.status} ${response.statusText}`);
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

app.get("/auth/discord", (req, res) => {
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.BASE_PATH}/auth/discord/callback&response_type=code&scope=identify`);
});

app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Code is required");
  }
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.BASE_PATH}/auth/discord/callback`,
      scope: "identify",
    }),
  });
  if (!response.ok) {
    return res.status(400).send("Token invalid");
  } else {
    const json = await response.json();
    console.log(json);
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `${json.token_type} ${json.access_token}`,
      },
    });
    const userJson = await userResponse.json();
    console.log(userJson);
    try {
      if (process.env.SECURE === "true") {
        res.cookie("token", await authentication.authenticateUser(userJson), { maxAge: 1000 * 60 * 60 * 24 * 30, signed: true, secure: true, sameSite: "strict"});
      } else if (process.env.SECURE === "false") {
        res.cookie("token", await authentication.authenticateUser(userJson), { maxAge: 1000 * 60 * 60 * 24 * 30, signed: true, secure: false, sameSite: "strict"});
      }
      res.redirect("/");
      //res.send(`
      //  <div style="margin: 300px auto; max-width: 400px; display: flex; flex-direction: column; align-items: center;">
      //    <h3>Welcome, ${userJson.global_name}</h3>
      //    <script>
      //      window.location.replace('/');
      //    </script>
      //  </div>
      //`);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error");
    }
  }
});

app.get('/login', (req, res) => {
  res.redirect('/auth/discord');
});

app.get('/', async (req, res) => {
  const token = req.signedCookies['token'];
  try {
    const userinfo = await authentication.quickVerifyUser(token);
    console.log("Detected", userinfo);
    res.render(path.join(__dirname, 'views', 'index.ejs'), { username: userinfo.username, avatar: userinfo.avatar });
  } catch {
    res.render(path.join(__dirname, 'views', 'index.ejs'), { username: undefined, avatar: undefined });
  }  
})

app.get('/gameactivity', async (req, res) => {
  const token = req.signedCookies['token'];
  if (token === undefined) {
    res.redirect('/login');
  } else {
    try {
      const userinfo = await authentication.quickVerifyUser(token);
      const activities = await gameactivity.fetchGameActivity(token);
      console.log("Detected", userinfo);
      res.render(path.join(__dirname, 'views', 'gameactivity.ejs'), { username: userinfo.username, avatar: userinfo.avatar, activities: activities });
    } catch {
      res.redirect('/login');
    }    
  }
});

app.get('/:page', async (req, res, next) => {
  const pagePath = path.join(__dirname, 'views', `${req.params.page}.ejs`)
  const token = req.signedCookies['token'];
  fs.access(pagePath, fs.constants.F_OK, async (err) => {
    if (err) {
      next();
    } else {
      try {
        const userinfo = await authentication.quickVerifyUser(token);
        res.render(pagePath, { username: userinfo.username, avatar: userinfo.avatar, email: process.env.EMAIL });
      } catch {
        res.render(pagePath, { username: undefined, avatar: undefined, email: process.env.EMAIL });
      }
    }
  });
});

app.get("/api/search", async (req, res) => {
  const searchTerm = req.query.q;
  const provider = req.query.provider;
  //const filter = req.query.filter;
  //if (provider === undefined) {
  const flashpointAPI = `https://db-api.unstable.life/search?smartSearch=${searchTerm}&fields=id,title,developer,publisher,platform,library,tags,originalDescription,dateAdded,dateModified`;//&filter=true
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
    armorgamesSearchResult = armorgamesSearchResult.map((game) => ({
      id: game.game_id,
      title: game.label,
      cover: game.thumbnail,
      gameUrl: `https://armorgames.com${game.url}`,
      provider: "Armor Games",
    }));
    console.log("Finished fetching from Armor Games API");
    res.json({ ...flashpointSearchResult, ...armorgamesSearchResult });
  }
//}
});

app.get("/api/userprofile", async (req, res) => {
  const token = req.signedCookies['token'];
  console.log("Recieved signed cookie:", req.signedCookies, " and unsigned cookie:", req.cookies);
  if (token === undefined) {
    return res.status(401).send("Unauthorized");
  } else {
    try {
      user = await authentication.quickVerifyUser(token);
      res.json({
        userid: user.userid,
        username: user.username,
        avatar: user.avatar
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get('/api/getgame', async (req, res) => {
  const provider = req.query.provider;
  const id = req.query.id;
  const token = req.signedCookies['token'];
  gamefile = undefined;
  if (!provider || !id) {
    return res.status(400).json({ error: "Provider and ID are required" });
  } else if (provider === "armorgames") {
    try {
      gameFile = await fetchGame("armorgames", id, `https://armorgames.com/play/${id}`);
      if (token !== undefined) {
        fs.readFile('debug/armorgames.json', 'utf8', async (err, data) => {
          if (err !== null) {
            console.warn("An error occured while reading the Armor Games cache:", err)
          } else if (data !== undefined){
            const gameResult = JSON.parse(data).filter(game => Number(game.game_id) === Number(req.query.id));
            if (gameResult.length > 0) {
              try {
                await gameactivity.storeGameActivity(token, gameResult[0].label, provider, id);
              } catch (error) {
                console.warn("An error occured while storing gaming activity:", error);
              }
            } else {
              console.warn("An error occured while storing game activity because the game wasn't found in the Armor Games cache")
            }
          }
        });
      }
      res.json({ gameFile: gameFile });
    } catch (error) {
      console.error(error);
      return res.status(404).json({ error: "Game not found" });
    }
  } else if (provider === "flashpoint") {
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
      try {
        res.json({
          uuid: gameinfojson.id,
          title: gameinfojson.title,
          utcMilli: gameinfojson.utcMilli,
          extreme: gameinfojson.extreme,
          gameFile: gameinfojson.launchCommand,
          gameLocationOnZip: decodeURIComponent('content/' + new URL(gameinfojson.launchCommand).hostname + new URL(gameinfojson.launchCommand).pathname),
          gameFile2: `https://download.unstable.life/gib-roms/Games/${gameinfojson.uuid}-${gameinfojson.utcMilli}.zip`,//https://download.unstable.life/gib-roms/Games/001485ad-b206-4e72-a44d-605d836afe6c-1630664499395.zip
        });
      } catch (error) {
        console.error(`Game URL retrieved from Flashpoint API is invalid, the game id is ${gameinfojson.id}:`, error);
        res.status(500).json({ error: "Game URL is invalid, please report this error to the developer." });
      }
    } else {
      res.status(404).json({ error: "Failed to fetch game, game might not exist" });
    }
  } else {
    res.status(400).json({ error: "Invalid provider" });
  };
});

app.get('/api/gameactivity', async (req, res) => {
  const token = req.signedCookies['token'];
  if (token === undefined) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    try {
      res.json(await gameactivity.fetchGameActivity(token));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get('/proxy', async (req, res) => {
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

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
})

app.use(express.static(path.join(__dirname, "public")));
app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  database.dbInit();
});