const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const requireAuth = require("../middleware/requireAuth");

// store in server/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext.toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only jpg, png, webp allowed"));
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

// POST /api/uploads/image
router.post("/image", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
