// ══════════════════════════════════════════════════════════
//  MeroShare API Server  —  Express
//  Routes:
//    POST /api/login           { clientId, username, password }
//    GET  /api/profile         x-meroshare-token header
//    GET  /api/shares          x-meroshare-token header
//    GET  /api/portfolio       x-meroshare-token header
//    GET  /api/ipos            x-meroshare-token header
//    GET  /api/wacc            x-meroshare-token header
// ══════════════════════════════════════════════════════════

require("dotenv").config();
const express = require("express");
const axios = require("axios");

axios.defaults.timeout = 15000;
const cors    = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
app.use(express.json());

const AUTH_URL = "https://webbackend.cdsc.com.np/api/meroShare";
const VIEW_URL = "https://webbackend.cdsc.com.np/api/meroShareView";

// ── helpers ────────────────────────────────────────────────
function msHeaders(token) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}
function extractToken(req) {
  return req.headers["x-meroshare-token"] || null;
}

async function getProfile(token) {
  const r = await axios.get(`${AUTH_URL}/ownDetail/`, { headers: msHeaders(token) });
  return r.data;
}

// ══════════════════════════════════════════════════════════
//  POST /api/login
//  Body: { clientId, username, password }
//  .env fallback: MS_CLIENT_ID, MS_USERNAME, MS_PASSWORD
// ══════════════════════════════════════════════════════════
app.post("/api/login", async (req, res) => {
  try {
    const clientId = req.body.clientId || process.env.MS_CLIENT_ID;
    const username = req.body.username || process.env.MS_USERNAME;
    const password = req.body.password || process.env.MS_PASSWORD;

    if (!clientId || !username || !password) {
      return res.status(400).json({ error: "clientId, username and password are required." });
    }

    const response = await axios.post(
      `${AUTH_URL}/auth/`,
      { clientId: Number(clientId), username, password },
      { headers: { "Content-Type": "application/json" } }
    );

    const token = response.headers["authorization"];
    if (!token) return res.status(401).json({ error: "Login failed — no token returned." });

    res.json({ token });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    res.status(err.response?.status || 500).json({ error: msg });
  }
});

// ══════════════════════════════════════════════════════════
//  GET /api/profile
// ══════════════════════════════════════════════════════════
app.get("/api/profile", async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided." });
  try {
    const data = await getProfile(token);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  GET /api/shares
// ══════════════════════════════════════════════════════════
app.get("/api/shares", async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided." });
  try {
    const { demat: boid, clientCode } = await getProfile(token);
    const r = await axios.post(
      `${VIEW_URL}/myShare/`,
      { sortBy: "CCY_SHORT_NAME", demat: [boid], clientCode: String(clientCode), page: 1, size: 200, sortAsc: true },
      { headers: msHeaders(token) }
    );
    const shares = Array.isArray(r.data) ? r.data : (r.data?.meroShareDematShare || []);
    res.json({ shares, totalItems: r.data?.totalItems || shares.length });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  GET /api/portfolio
// ══════════════════════════════════════════════════════════
app.get("/api/portfolio", async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided." });
  try {
    const { demat: boid, clientCode } = await getProfile(token);
    const r = await axios.post(
      `${VIEW_URL}/myPortfolio/`,
      { sortBy: "script", demat: [boid], clientCode: String(clientCode), page: 1, size: 200, sortAsc: true },
      { headers: msHeaders(token) }
    );
    const p       = r.data;
    const holding = p.meroShareMyPortfolio || p.myPortfolio || p.object || (Array.isArray(p) ? p : []);
    res.json({
      holdings:                   Array.isArray(holding) ? holding : [],
      totalCostPrice:              p.totalCostPrice || 0,
      totalValueOfLastTransPrice:  p.totalValueOfLastTransPrice || 0,
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  GET /api/ipos
// ══════════════════════════════════════════════════════════
app.get("/api/ipos", async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided." });
  try {
    const r = await axios.post(
      `${AUTH_URL}/companyShare/applicableIssue/`,
      {
        filterDateParams: [
          { key: "minIssueOpenDate",  condition: "", alias: "", value: "" },
          { key: "maxIssueCloseDate", condition: "", alias: "", value: "" },
        ],
        filterFieldParams: [
          { key: "companyIssue.companyISIN.script",       alias: "Scrip" },
          { key: "companyIssue.companyISIN.company.name", alias: "Company Name" },
          { key: "companyIssue.assignedToClient.name",    value: "", alias: "Issue Manager" },
        ],
        page: 1,
        size: 20,
        searchRoleViewConstants: "VIEW_APPLICABLE_SHARE",
      },
      { headers: msHeaders(token) }
    );
    const data   = r.data;
    const issues = data.object || data.applicableIssue || (Array.isArray(data) ? data : []);
    res.json({ issues, totalItems: data.totalCount || data.totalItems || issues.length });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  GET /api/wacc
// ══════════════════════════════════════════════════════════
app.get("/api/wacc", async (req, res) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token provided." });
  try {
    const { demat: boid, clientCode } = await getProfile(token);

    const sharesRes = await axios.post(
      `${VIEW_URL}/myShare/`,
      { sortBy: "CCY_SHORT_NAME", demat: [boid], clientCode: String(clientCode), page: 1, size: 200, sortAsc: true },
      { headers: msHeaders(token) }
    );
    const shares  = Array.isArray(sharesRes.data) ? sharesRes.data : (sharesRes.data?.meroShareDematShare || []);
    const scripts = shares.map(s => s.script).filter(Boolean);

    const allRecords = [];
    for (const scrip of scripts) {
      try {
        const r = await axios.post(
          "https://webbackend.cdsc.com.np/api/myPurchase/search/wacc/",
          { demat: boid, scrip },
          { headers: msHeaders(token) }
        );
        const records = r.data?.waccUpdateResponse || [];
        allRecords.push(...records);
      } catch { /* skip */ }
    }

    res.json({ wacc: allRecords });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || err.message });
  }
});

// ── Health check ───────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`\n🚀  MeroShare API server → http://localhost:${PORT}`);
  console.log("    Routes: /api/login  /api/profile  /api/shares  /api/portfolio  /api/ipos  /api/wacc\n");
});
