const express = require("express");
const router = express.Router();

const listings = require("../controllers/listingsController");
const requireAuth = require("../middleware/requireAuth");

router.get("/", listings.list); // public browse
router.post("/", requireAuth, listings.create); // protected create
router.get("/mine", requireAuth, listings.mine); // protected mine

router.get("/:id", listings.getOne); // public single listing
router.put("/:id", requireAuth, listings.update); // protected edit (owner only)

router.delete("/:id", requireAuth, listings.remove); // protected delete (owner only)

module.exports = router;
