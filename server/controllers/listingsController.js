const Listing = require("../models/listing");

// helper: check ownership
function assertOwner(listing, userId) {
  return listing.owner && listing.owner.toString() === String(userId);
}

exports.create = async (req, res) => {
  try {
    const { title, description, price, category, location } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({ message: "title, description, price are required" });
    }

    // If file uploaded, store a public URL path
    const images = [];
    if (req.file) {
      images.push(`/uploads/${req.file.filename}`);
    }

    const listing = await Listing.create({
      title: String(title).trim(),
      description: String(description).trim(),
      price: Number(price),
      category: category ? String(category).trim() : "",
      location: location ? String(location).trim() : "",
      images,
      owner: req.user.id,
    });

    return res.status(201).json({ listing });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { q, category, status } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const listings = await Listing.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.json({ listings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.mine = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.json({ listings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// NEW: get single listing for edit page (owner only)
exports.getOne = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (!assertOwner(listing, req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    return res.json({ listing });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// NEW: update listing (owner only). Optionally replace image.
exports.update = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (!assertOwner(listing, req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, description, price, category, location, status } = req.body;

    if (title !== undefined) listing.title = String(title).trim();
    if (description !== undefined) listing.description = String(description).trim();

    if (price !== undefined) {
      const p = Number(price);
      if (Number.isNaN(p)) return res.status(400).json({ message: "price must be a number" });
      listing.price = p;
    }

    if (category !== undefined) listing.category = String(category).trim();
    if (location !== undefined) listing.location = String(location).trim();

    if (status !== undefined) {
      const s = String(status);
      if (!["active", "sold"].includes(s)) {
        return res.status(400).json({ message: "status must be active or sold" });
      }
      listing.status = s;
    }

    // If new file uploaded, replace images with the new one
    if (req.file) {
      listing.images = [`/uploads/${req.file.filename}`];
    }

    await listing.save();

    return res.json({ listing });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (!assertOwner(listing, req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await listing.deleteOne();
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
