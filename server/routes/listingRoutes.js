const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const listings = require("../controllers/listingsController");
const requireAuth = require("../middleware/requireAuth");

// Cloudinary config is already done globally or can wait, but we should make sure it has the env vars here too
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "student-marketplace-listings",
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
  },
});

const upload = multer({ storage });

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
