// src/routes/index.js
const router = require("express").Router();
const ctrl = require("../controllers/index");
const authCtrl  = require("../controllers/authController");
const protect   = require("../middleware/auth");

// ── Health ─────────────────────────────────────────────────────────────
router.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);
router.post("/auth/login",  authCtrl.login);

router.use(protect);   // everything below requires Bearer token

router.get("/auth/me",      authCtrl.getMe);

// ── Profile ────────────────────────────────────────────────────────────
router.get("/profile", ctrl.getProfile);

// ── Shares ─────────────────────────────────────────────────────────────
router.get("/shares", ctrl.getShares);
router.get("/shares/:script", ctrl.getShareByScript);

// ── Portfolio ──────────────────────────────────────────────────────────
router.get("/portfolio", ctrl.getPortfolio);

// ── IPO / Applicable Issues ────────────────────────────────────────────
// Optional: ?type=IPO  ?type=FPO  ?type=RIGHT
router.get("/issues", ctrl.getApplicableIssues);

// ── WACC ───────────────────────────────────────────────────────────────
// Optional: ?script=NABIL
router.get("/wacc", ctrl.getWacc);

// ── Sync ───────────────────────────────────────────────────────────────
router.post("/sync", ctrl.triggerSync);
router.get("/sync/logs", ctrl.getSyncLogs);

module.exports = router;
