const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const User = require("../models/user");

// PUT /api/users/profile
router.put("/profile", requireAuth, async (req, res) => {
    try {
        const { avatarUrl } = req.body;

        // We only allow updating avatarUrl for now, but this could be expanded to name, bio, etc.
        const updates = {};
        if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true }
        ).select("_id name email avatarUrl isVerified createdAt");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ message: "Profile updated successfully", user });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;
