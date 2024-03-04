require("dotenv").config();
const express = require("express");
const app = express();
const firebaseAdmin = require("firebase-admin");
const Sentry = require("@sentry/node");
const path = require("path");
const fs = require("fs-extra");
const cheerio = require("cheerio");
const port = process.env.PORT || 3000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

async function fetchGame(url, provider, id) {
  console.log(`Fetching game file from ${provider} with id ${id}...`);
  if (provider === "armorgames") {
    if (fs.existsSync(`debug/${id}.html`)) {
      console.log("File exists");
      const gameFile = cheerio
        .load(await fs.readFile(`debug/${id}.html`))('param[name="movie"]')
        .attr("value");
      return gameFile;
    } else if (!fs.existsSync(`debug/${id}.json`)) {
      const response = await fetch(url);
      const html = await response.text();
      await fs.ensureDir("debug");
      await fs.writeFile(`debug/armorgames-${id}.html`, html);
      const gameFile = cheerio.load(html)('param[name="movie"]').attr("value");
      return gameFile;
    }
  } else {
    throw new Error("Invalid provider");
  }
}

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
        cover: `https://infinity.unstable.life/images/Logos/${result.id.substring(
          0,
          2
        )}/${result.id.substring(2, 4)}/${result.id}.png?type=jpg`,
        gameFile: `https://download.unstable.life/gib-roms/Games/${result.id}`,
        getInfo: `https://ooooooooo.ooo/get?id=${result.id}`,
        provider: "Flashpoint",
      }));
    console.log(
      "Finished fetching from Flashpoint API\nFetching from Armor Games API..."
    );
    const armorgamesResponse = await fetch(armorgamesAPI);
    const armorgamesResultJson = await armorgamesResponse.json();
    const armorgamesSearchResult = armorgamesResultJson
      .filter((game) => Number(game.game_id) === Number(req.query.game_id))
      .filter((game) => game.url.split("/")[1] === "play")
      .map(async (game) => ({
        id: game.game_id,
        title: game.label,
        cover: game.thumbnail,
        gameUrl: `https://armorgames.com/${game.url}`,
        gameFile: await fetchGame(game.url, "armorgames", game.game_id),
        provider: "Armor Games",
      }));
    res.json({ ...flashpointSearchResult });
  }
});

app.use(express.static(path.join(__dirname, "public_html")));

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});