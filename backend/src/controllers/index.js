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

// ── Profile ───────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne().sort({ updatedAt: -1 }).lean();
    if (!profile) return err(res, "No profile found. Run a sync first.", 404);
    ok(res, profile);
  } catch (e) {
    logger.error(e);
    err(res, e.message);
  }
};

// ── Shares ────────────────────────────────────────────────────────────
exports.getShares = async (req, res) => {
  try {
    const shares = await Share.find().sort({ script: 1 }).lean();
    ok(res, shares, { total: shares.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message);
  }
};

exports.getShareByScript = async (req, res) => {
  try {
    const share = await Share.findOne({ script: req.params.script.toUpperCase() }).lean();
    if (!share) return err(res, "Share not found.", 404);
    ok(res, share);
  } catch (e) {
    logger.error(e);
    err(res, e.message);
  }
};

// ── Portfolio ─────────────────────────────────────────────────────────
exports.getPortfolio = async (req, res) => {
  try {
    const summary = await PortfolioSummary.findOne().lean();
    const items = await PortfolioItem.find().sort({ script: 1 }).lean();
    ok(res, { summary, items }, { total: items.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message);
  }
};

// ── Applicable Issues ─────────────────────────────────────────────────
exports.getApplicableIssues = async (req, res) => {
  try {
    const { type } = req.query; // optional: ?type=IPO
    const filter = type ? { shareTypeName: new RegExp(type, "i") } : {};
    const issues = await ApplicableIssue.find(filter).sort({ issueOpenDate: -1 }).lean();
    ok(res, issues, { total: issues.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message);
  }
};

// ── WACC ──────────────────────────────────────────────────────────────
exports.getWacc = async (req, res) => {
  try {
    const { script } = req.query; // optional: ?script=NABIL
    const filter = script ? { scrip: script.toUpperCase() } : {};
    const records = await Wacc.find(filter).sort({ transactionDate: -1 }).lean();
    ok(res, records, { total: records.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message);
  }
};

// ── Sync Logs ─────────────────────────────────────────────────────────
exports.getSyncLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const logs = await SyncLog.find().sort({ createdAt: -1 }).limit(limit).lean();
    ok(res, logs, { total: logs.length });
  } catch (e) {
    logger.error(e);
    err(res, e.message);
  }
};

// ── Manual Sync Trigger ───────────────────────────────────────────────
exports.triggerSync = async (req, res) => {
  try {
    logger.info("Manual sync triggered via API.");
    // Fire-and-forget; respond immediately
    res.json({ success: true, message: "Sync started. Check /api/sync/logs for status." });
    await runFullSync();
  } catch (e) {
    logger.error(e);
    // Response already sent; just log the error
  }
};
