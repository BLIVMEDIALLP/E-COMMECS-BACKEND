const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String },

    category: {
      type: String,
      required: true,
      enum: ["rudraksha", "puja-samagri", "prasadam", "panchaloha", "wellness", "wearables"],
    },
    series: {
      type: String,
      enum: ["Lakshmi Narayana", "Shiva", "Durga", "Ganesha", "Anjaneya", null],
      default: null,
    },

    // Pricing
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    logisticsCost: { type: Number, default: 100 },
    discoveryFee: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },

    // Inventory
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    weight: { type: Number, default: 500 }, // grams — for Shiprocket
    dimensions: {
      length: { type: Number, default: 10 }, // cm
      breadth: { type: Number, default: 10 },
      height: { type: Number, default: 10 },
    },

    // Display
    image: { type: String, default: "🕉️" }, // emoji OR url
    imageUrl: { type: String }, // actual image URL from S3/CDN
    images: [{ type: String }], // gallery

    // Badges & Flags
    badge: { type: String, default: null }, // "Energized", "Temple Direct", etc.
    tags: [{ type: String }],
    isPopular: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },

    material: { type: String },
    templeOrigin: { type: String }, // e.g., "Tirupati Balaji"
    isEnergized: { type: Boolean, default: false },
    energizationNote: { type: String },

    // Stats
    totalSold: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug
productSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
