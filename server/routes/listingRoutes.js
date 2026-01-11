const express = require("express");
const router = express.Router();

const listings = require("../controllers/listingsController");
const requireAuth = require("../middleware/requireAuth");

router.get("/", listings.list);                 // public browse
router.post("/", requireAuth, listings.create); // protected create
router.get("/mine", requireAuth, listings.mine);
router.delete("/:id", requireAuth, listings.remove);

module.exports = router;
