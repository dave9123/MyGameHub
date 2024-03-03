require('dotenv').config();
const express = require('express');
const app = express();
const firebaseAdmin = require('firebase-admin');
const Sentry = require("@sentry/node");
const path = require('path');
const port = process.env.PORT || 3000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.post('/api/search', (req, res) => {
    const searchTerm = req.query.q;
    const flashpointAPI = `https://db-api.unstable.life/search?smartSearch=${searchTerm}&filter=true&fields=id,title,developer,publisher,platform,library,tags,originalDescription,dateAdded,dateModified`
    if (!searchTerm) {
        return res.status(400).send('Search term is required');
    } else {
        console.log(`Searching for ${searchTerm}`);
    };
});

app.use(express.static(path.join(__dirname, 'public_html')));

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});