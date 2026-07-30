const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(env.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
