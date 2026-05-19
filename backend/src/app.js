// src/app.js
const express = require("express");
const routes = require("./routes/index");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Global middleware ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Basic request logger ────────────────────────────────────────────────
app.use((req, _res, next) => {
  const logger = require("./utils/logger");
  logger.debug(`→ ${req.method} ${req.url}`);
  next();
});

// ── API routes ──────────────────────────────────────────────────────────
app.use("/api", routes);

// ── Error handling ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
