const mongoose = require("mongoose");

// Controls hero banners, announcement strips, CTA sections
const bannerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hero", "strip", "cta", "popup", "category"],
      required: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    badge: { type: String },           // e.g., "🪔 NAVRATRI SPECIAL"
    ctaText: { type: String },
    ctaLink: { type: String },
    ctaText2: { type: String },
    ctaLink2: { type: String },
    imageUrl: { type: String },
    bgGradient: { type: String },      // CSS gradient string
    emoji: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    validFrom: { type: Date },
    validTo: { type: Date },
  },
  { timestamps: true }
);

// Site settings — key/value store for dynamic config
const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    label: { type: String },           // human-readable label for admin UI
    group: { type: String, default: "general" },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);
const SiteSetting = mongoose.model("SiteSetting", siteSettingSchema);

module.exports = { Banner, SiteSetting };
