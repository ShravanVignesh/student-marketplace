console.log("AUTH CONTROLLER LOADED:", __filename);

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const VerificationToken = require("../models/verificationToken");
const { makeToken, hashToken } = require("../utils/crypto");
const { sendVerificationEmail } = require("../utils/email");

function isAcUk(email) {
  return typeof email === "string" && email.toLowerCase().endsWith(".ac.uk");
}

function signJwt(userId) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing in env");
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });
    if (!isAcUk(email)) return res.status(400).json({ message: "Only .ac.uk emails allowed" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      isVerified: false,
    });

    await VerificationToken.deleteMany({ userId: user._id });

    const token = makeToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await VerificationToken.create({ userId: user._id, tokenHash, expiresAt });

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const verifyUrl = `${appUrl}/verify?id=${user._id}&token=${token}`;

    await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });

    // Include the verifyUrl in the response for development purposes
    // due to DMARC policies often dropping emails sent from outlook via third-party SMTPs.
    return res.status(201).json({ message: "Registered. Please verify your email.", verifyUrl });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function verify(req, res) {
  try {
    const { id, token } = req.query;
    if (!id || !token) return res.status(400).json({ message: "Missing token or id" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.json({ message: "Already verified" });

    const tokenDoc = await VerificationToken.findOne({ userId: user._id });
    if (!tokenDoc) return res.status(400).json({ message: "No verification token found" });
    if (tokenDoc.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: "Token expired" });

    const incomingHash = hashToken(token);
    if (incomingHash !== tokenDoc.tokenHash) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    await user.save();
    await VerificationToken.deleteMany({ userId: user._id });

    return res.json({ message: "Email verified. You can now log in." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first" });

    const token = signJwt(user._id);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ message: "If the email exists, we sent a link." });
    if (user.isVerified) return res.status(200).json({ message: "Account already verified" });

    await VerificationToken.deleteMany({ userId: user._id });

    const token = makeToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await VerificationToken.create({ userId: user._id, tokenHash, expiresAt });

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const verifyUrl = `${appUrl}/verify?id=${user._id}&token=${token}`;

    await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });

    return res.json({ message: "Verification email sent", verifyUrl });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function devVerify(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isVerified = true;
    await user.save();

    return res.json({ message: "User verified (dev)", email: user.email });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("_id name email avatarUrl isVerified createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  register,
  verify,
  login,
  resendVerification,
  devVerify,
  me,
};
