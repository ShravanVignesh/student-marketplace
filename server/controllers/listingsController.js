const Listing = require("../models/listing");

exports.create = async (req, res) => {
  try {
    const { title, description, price, category, location, images } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({ message: "title, description, price are required" });
    }

    const listing = await Listing.create({
      title,
      description,
      price: Number(price),
      category: category || "",
      location: location || "",
      images: Array.isArray(images) ? images : [],
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

exports.getOne = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("owner", "name email");
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    return res.json({ listing });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, description, price, category, location, status } = req.body;

    if (title !== undefined) listing.title = String(title).trim();
    if (description !== undefined) listing.description = String(description).trim();
    if (price !== undefined) listing.price = Number(price);
    if (category !== undefined) listing.category = String(category).trim();
    if (location !== undefined) listing.location = String(location).trim();

    if (status !== undefined) {
      const s = String(status);
      if (!["active", "sold"].includes(s)) {
        return res.status(400).json({ message: "Invalid status. Use active or sold." });
      }
      listing.status = s;
    }

    await listing.save();
    return res.json({ message: "Updated", listing });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await listing.deleteOne();
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
