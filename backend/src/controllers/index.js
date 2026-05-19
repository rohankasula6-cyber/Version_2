// src/controllers/index.js
const UserProfile = require("../models/UserProfile");
const Share = require("../models/Share");
const { PortfolioItem, PortfolioSummary } = require("../models/Portfolio");
const ApplicableIssue = require("../models/ApplicableIssue");
const Wacc = require("../models/Wacc");
const SyncLog = require("../models/SyncLog");
const { runFullSync } = require("../services/syncService");
const logger = require("../utils/logger");

// ── Utility ───────────────────────────────────────────────────────────
const ok = (res, data, meta = {}) => res.json({ success: true, ...meta, data });
const err = (res, message, status = 500) =>
  res.status(status).json({ success: false, message });

async function getActiveBoid() {
  const profile = await UserProfile.findOne().sort({ updatedAt: -1 }).lean();
  if (!profile || !profile.boid) {
    throw Object.assign(new Error("No profile found. Run a sync first."), { status: 404 });
  }
  return profile.boid;
}

// ── Profile ───────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne().sort({ updatedAt: -1 }).lean();
    if (!profile) return err(res, "No profile found. Run a sync first.", 404);
    ok(res, profile);
  } catch (e) {
    logger.error(e);
    err(res, e.message, e.status || 500);
  }
};

// ── Shares ────────────────────────────────────────────────────────────
exports.getShares = async (req, res) => {
  try {
    const boid = await getActiveBoid();
    const shares = await Share.find({ boid })
      .sort({ script: 1 })
      .select("-__v -createdAt -updatedAt")
      .lean();
    ok(res, shares, { total: shares.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message, e.status || 500);
  }
};

exports.getShareByScript = async (req, res) => {
  try {
    const boid = await getActiveBoid();
    const share = await Share.findOne({
      boid,
      script: req.params.script.toUpperCase(),
    })
      .select("-__v -createdAt -updatedAt")
      .lean();
    if (!share) return err(res, `Share '${req.params.script.toUpperCase()}' not found.`, 404);
    ok(res, share);
  } catch (e) {
    logger.error(e);
    err(res, e.message, e.status || 500);
  }
};

// ── Portfolio ─────────────────────────────────────────────────────────
exports.getPortfolio = async (req, res) => {
  try {
    const boid = await getActiveBoid();
    const [summary, items] = await Promise.all([
      PortfolioSummary.findOne({ boid }).select("-__v -createdAt -updatedAt").lean(),
      PortfolioItem.find({ boid }).sort({ script: 1 }).select("-__v -createdAt -updatedAt").lean(),
    ]);
    ok(res, { summary, items }, { total: items.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message, e.status || 500);
  }
};

// ── Applicable Issues ─────────────────────────────────────────────────
exports.getApplicableIssues = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { shareTypeName: new RegExp(type, "i") } : {};
    const issues = await ApplicableIssue.find(filter)
      .sort({ issueOpenDate: -1 })
      .select("-__v -createdAt -updatedAt")
      .lean();
    ok(res, issues, { total: issues.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message, e.status || 500);
  }
};

// ── WACC ──────────────────────────────────────────────────────────────
exports.getWacc = async (req, res) => {
  try {
    const boid = await getActiveBoid();
    const { script } = req.query;
    const filter = { boid, ...(script ? { scrip: script.toUpperCase() } : {}) };
    const records = await Wacc.find(filter)
      .sort({ transactionDate: -1 })
      .select("-__v -createdAt -updatedAt")
      .lean();
    ok(res, records, { total: records.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message, e.status || 500);
  }
};

// ── Sync Logs ─────────────────────────────────────────────────────────
exports.getSyncLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const logs = await SyncLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("-__v")
      .lean();
    ok(res, logs, { total: logs.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message, e.status || 500);
  }
};

// ── Manual Sync Trigger ───────────────────────────────────────────────
// REPLACE the whole triggerSync export:
exports.triggerSync = async (req, res) => {
  try {
    logger.info("Manual sync triggered via API.");
    res.json({ success: true, message: "Sync started. Check /api/sync/logs for status." });

    // Load last user from DB for credentials
    const User = require("../models/User");
    const lastUser = await User.findOne().sort({ lastLoginAt: -1 }).lean();
    if (lastUser) {
      runFullSync({
        clientId: lastUser.clientId,
        username:  lastUser.username,
        password:  process.env.MEROSHARE_PASSWORD,
      });
    } else {
      logger.warn("Manual sync: no user found in DB.");
    }
  } catch (e) {
    logger.error(e);
  }
};