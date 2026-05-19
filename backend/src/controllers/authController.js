// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MeroShareClient = require("../services/meroshareClient");
const { runFullSync } = require("../services/syncService");
const logger = require("../utils/logger");

const ok  = (res, data, meta = {}) => res.json({ success: true, ...meta, data });
const err = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/login
exports.login = async (req, res) => {
  const { clientId, username, password } = req.body;

  if (!clientId || !username || !password) {
    return err(res, "clientId, username and password are required.");
  }

  try {
    // 1. Verify credentials directly against MeroShare
    const client = new MeroShareClient({
      clientId: Number(clientId),
      username,
      password,
    });

    await client.login();
    const profile = await client.getOwnDetails();

    // 2. Upsert user in DB
    let user = await User.findOne({ username });
    if (user) {
      user.clientId    = Number(clientId);
      user.password    = password;       // pre-save hook re-hashes
      user.boid        = profile.demat;
      user.name        = profile.name;
      user.email       = profile.email;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await User.create({
        clientId: Number(clientId),
        username,
        password,
        boid:        profile.demat,
        name:        profile.name,
        email:       profile.email,
        lastLoginAt: new Date(),
      });
    }

    // 3. Issue JWT immediately — frontend unblocks right away
    const token = generateToken(user._id);
    logger.info(`✅ User logged in: ${username} (${profile.name})`);

    ok(res, {
      token,
      user: {
        id:       user._id,
        name:     user.name,
        username: user.username,
        email:    user.email,
        boid:     user.boid,
      },
    });

    // 4. Trigger full sync in background AFTER response is sent
    //    so the frontend doesn't wait for it
    logger.info("🔄 Background sync started after login...");
runFullSync({ clientId: Number(clientId), username, password }).then(() => {
          logger.info("✅ Background sync complete.");
    }).catch((e) => {
      logger.error("❌ Background sync failed:", e.message);
    });

  } catch (e) {
    if (e.response?.status === 401 || e.response?.status === 400) {
      return err(res, "Invalid MeroShare credentials.", 401);
    }
    logger.error(e);
    err(res, "Login failed. Please try again.", 500);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) return err(res, "User not found.", 404);
    ok(res, user);
  } catch (e) {
    logger.error(e);
    err(res, e.message, 500);
  }
};