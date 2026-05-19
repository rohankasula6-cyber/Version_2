// src/app.js
const express = require("express");
const cors    = require("cors");
const routes  = require("./routes/index");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────
// Allow requests from your React dev server
app.use(cors({
  origin: [
    "http://localhost:5173",   // Vite default
    "http://localhost:3000",   // CRA default
    "http://localhost:4173",   // Vite preview
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Respond to all OPTIONS preflight requests immediately
app.options("*", cors());

// ── Body parsing ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger ──────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const logger = require("./utils/logger");
  logger.debug(`→ ${req.method} ${req.url}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────
app.use("/api", routes);

// ── Error handling ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;