const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, maxlength: 40, default: "" },
    location: { type: String, trim: true, maxlength: 80, default: "" },
    images: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "sold"], default: "active" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
