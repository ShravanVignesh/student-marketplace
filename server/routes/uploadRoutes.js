const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");
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
    format: async (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      return ext === 'jpeg' ? 'jpg' : ext;
    },
    public_id: (req, file) => `${Date.now()}-${Math.random().toString(16).slice(2)}`,
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

  // Cloudinary returns the full URL in `req.file.path`
  const url = req.file.path;
  res.json({ url });
});

module.exports = router;
