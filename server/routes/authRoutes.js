console.log("AUTHROUTES LOADED:", __filename);

const express = require("express");
const router = express.Router();

const auth = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");

router.post("/register", auth.register);
router.get("/verify", auth.verify);
router.post("/login", auth.login);
router.post("/resend-verification", auth.resendVerification);
router.post("/dev-verify", auth.devVerify);

// protected
router.get("/me", requireAuth, auth.me);

module.exports = router;
