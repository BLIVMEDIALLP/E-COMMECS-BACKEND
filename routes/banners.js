const express = require("express");
const router = express.Router();
const { Banner, SiteSetting } = require("../models/Banner");
const { protect, can } = require("../middleware/auth");

// ── PUBLIC ─────────────────────────────────────────────────────────────────

// GET /api/banners — active banners for the storefront
router.get("/", async (req, res) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $or: [
      { validFrom: { $exists: false } },
      { validFrom: { $lte: now }, validTo: { $gte: now } },
      { validFrom: { $lte: now }, validTo: { $exists: false } },
    ],
  }).sort({ sortOrder: 1, type: 1 });

  res.json({ success: true, banners });
});

// GET /api/banners/settings — public site settings (non-sensitive)
router.get("/settings", async (req, res) => {
  const settings = await SiteSetting.find({ group: { $in: ["general", "store", "seo"] } });
  const map = {};
  settings.forEach((s) => (map[s.key] = s.value));
  res.json({ success: true, settings: map });
});

// ── ADMIN ──────────────────────────────────────────────────────────────────

// GET /api/banners/admin/all
router.get("/admin/all", protect, async (req, res) => {
  const banners = await Banner.find().sort({ sortOrder: 1 });
  res.json({ success: true, banners });
});

// POST /api/banners
router.post("/", protect, can("banners"), async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, banner });
});

// PUT /api/banners/:id
router.put("/:id", protect, can("banners"), async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, banner });
});

// DELETE /api/banners/:id
router.delete("/:id", protect, can("banners"), async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ── SITE SETTINGS ──────────────────────────────────────────────────────────

// GET /api/banners/admin/settings
router.get("/admin/settings", protect, async (req, res) => {
  const settings = await SiteSetting.find().sort({ group: 1, key: 1 });
  res.json({ success: true, settings });
});

// PUT /api/banners/settings/:key — upsert a setting
router.put("/settings/:key", protect, async (req, res) => {
  const setting = await SiteSetting.findOneAndUpdate(
    { key: req.params.key },
    { ...req.body, key: req.params.key },
    { new: true, upsert: true }
  );
  res.json({ success: true, setting });
});

// POST /api/banners/settings/bulk — update multiple settings at once
router.post("/settings/bulk", protect, async (req, res) => {
  const { settings } = req.body; // [{ key, value, label, group }]
  const ops = settings.map((s) => ({
    updateOne: {
      filter: { key: s.key },
      update: { $set: s },
      upsert: true,
    },
  }));
  await SiteSetting.bulkWrite(ops);
  res.json({ success: true });
});

module.exports = router;
