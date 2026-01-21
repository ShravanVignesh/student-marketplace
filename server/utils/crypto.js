const crypto = require("crypto");

function makeToken() {
  // 32 bytes -> 64 hex chars
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { makeToken, hashToken };
