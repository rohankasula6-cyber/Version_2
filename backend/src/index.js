// src/index.js
require("dotenv").config();

const cron = require("node-cron");
const app = require("./app");
const { connect, disconnect } = require("./config/database");
const { runFullSync } = require("./services/syncService");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;
const SYNC_CRON = process.env.SYNC_CRON || "0 6 * * *"; // Default: 6 AM daily

async function start() {
  // 1. Connect to MongoDB
  await connect();

  // 2. Start Express server
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📡 API base: http://localhost:${PORT}/api`);
  });

  // 3. Schedule automatic sync
  if (cron.validate(SYNC_CRON)) {
    cron.schedule(SYNC_CRON, async () => {
      logger.info(`⏰ Scheduled sync triggered (cron: ${SYNC_CRON})`);
      await runFullSync();
    });
    logger.info(`📅 Sync scheduled: ${SYNC_CRON}`);
  } else {
    logger.warn(`⚠️  Invalid SYNC_CRON expression: "${SYNC_CRON}". Scheduler disabled.`);
  }

  // 4. Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  logger.error("Fatal startup error:", err);
  process.exit(1);
});
