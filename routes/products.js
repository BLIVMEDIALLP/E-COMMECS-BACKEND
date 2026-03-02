const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, can } = require("../middleware/auth");

// ── PUBLIC ─────────────────────────────────────────────────────────────────

// GET /api/products — list with filters
router.get("/", async (req, res) => {
  const { category, series, popular, recommended, featured, search, sort = "createdAt", page = 1, limit = 50 } = req.query;

  const query = { isActive: true };

  if (category && category !== "all") query.category = category;
  if (series) query.series = series;
  if (popular === "true") query.isPopular = true;
  if (recommended === "true") query.isRecommended = true;
  if (featured === "true") query.isFeatured = true;
  if (search) query.name = { $regex: search, $options: "i" };

  const sortMap = {
    createdAt: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { totalSold: -1 },
    rating: { avgRating: -1 },
  };

  const products = await Product.find(query)
    .sort(sortMap[sort] || { createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Product.countDocuments(query);

  res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/products/:slug — single product
router.get("/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, product });
});

// ── ADMIN ──────────────────────────────────────────────────────────────────

// POST /api/products — create
router.post("/", protect, can("products"), async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id — update
router.put("/:id", protect, can("products"), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, product });
});

// PATCH /api/products/:id/pricing — update only pricing fields
router.patch("/:id/pricing", protect, can("pricing"), async (req, res) => {
  const { price, originalPrice, logisticsCost, discoveryFee, gstPercent } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { price, originalPrice, logisticsCost, discoveryFee, gstPercent },
    { new: true }
  );
  res.json({ success: true, product });
});

// PATCH /api/products/:id/stock — update stock
router.patch("/:id/stock", protect, can("products"), async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: req.body.stock },
    { new: true }
  );
  res.json({ success: true, product });
});

// PATCH /api/products/:id/toggle — activate/deactivate
router.patch("/:id/toggle", protect, can("products"), async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Not found" });
  product.isActive = !product.isActive;
  await product.save();
  res.json({ success: true, isActive: product.isActive });
});

// DELETE /api/products/:id
router.delete("/:id", protect, can("products"), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Product deleted" });
});

// GET /api/products/admin/all — all products including inactive
router.get("/admin/all", protect, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, products });
});

module.exports = router;
