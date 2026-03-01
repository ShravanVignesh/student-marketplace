const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const requireAuth = require("../middleware/requireAuth");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "student-marketplace-uploads",
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
  },
});

const upload = multer({ storage });

// POST /api/uploads/image
router.post("/image", requireAuth, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    console.log("Cloudinary upload successful:", req.file.path);
    const url = req.file.path;
    res.json({ url });
  });
});

module.exports = router;
