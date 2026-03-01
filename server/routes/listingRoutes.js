const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const listings = require("../controllers/listingsController");
const requireAuth = require("../middleware/requireAuth");

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config (saves to server/uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safeOriginal}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only image files are allowed (jpg, png, webp)"));
  cb(null, true);
}

const upload = multer({ storage, fileFilter });

// public browse
router.get("/", listings.list);

// public: get all active listings by a specific seller
router.get("/seller/:userId", listings.bySeller);

// public detail view (anyone can view a listing)
router.get("/detail/:id", listings.getPublic);

// protected
router.get("/mine", requireAuth, listings.mine);

// create listing with optional image upload (field name must be "images", max 5)
router.post("/", requireAuth, upload.array("images", 5), listings.create);

// get one listing for edit page (owner only)
router.get("/:id", requireAuth, listings.getOne);

// update listing, optional image replace (field name must be "images", max 5)
router.put("/:id", requireAuth, upload.array("images", 5), listings.update);

// delete listing
router.delete("/:id", requireAuth, listings.remove);

module.exports = router;
