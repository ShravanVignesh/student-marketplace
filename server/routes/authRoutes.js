const express = require("express");
const router = express.Router();

const auth = require("../controllers/authController");

router.post("/register", auth.register);
router.get("/verify", auth.verify);
router.post("/login", auth.login);
router.post("/resend-verification", auth.resendVerification);
router.post("/dev-verify", auth.devVerify);

module.exports = router;
