// ──────────────────────────────────────────────────────────────────────────────
//  SHRI AAUM — Express API Server
// ──────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const app = express();

// ── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
app.use("/api/", limiter);
app.use("/api/auth/login", loginLimiter);
```

The fix is changing `max` to `limit` — that's what changed in `express-rate-limit` v7.

Commit → Railway auto-redeploys → should go green. Then visit:
```
https://e-commecs-backend-production.up.railway.app/api/seed-init

// Body parsers — NOTE: webhook route uses raw body, so it's registered before json()
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/banners", require("./routes/banners"));

// Health check
// Temporary seed route — delete after first run
app.get("/api/seed-init", async (req, res) => {
  const Admin = require("./models/Admin");
  const Product = require("./models/Product");
  const { Banner, SiteSetting } = require("./models/Banner");
  await Promise.all([Admin.deleteMany(), Product.deleteMany(), Banner.deleteMany(), SiteSetting.deleteMany()]);
  await Admin.create({ name: "IV Reddy", email: "admin@shriaaum.com", password: "ChangeMe@123", role: "superadmin", permissions: { products: true, orders: true, banners: true, pricing: true, shipping: true, admins: true } });
  await Product.insertMany([
    { name: "5-Mukhi Rudraksha Mala", category: "rudraksha", series: "Shiva", price: 4500, originalPrice: 5200, badge: "Energized", isPopular: true, isRecommended: true, stock: 50, material: "Natural Himalayan Rudraksha", description: "108-bead authentic 5-mukhi Rudraksha mala, energized at Kedarnath.", image: "🔱", tags: ["Certified", "Temple-Blessed"], logisticsCost: 100, discoveryFee: 250, isEnergized: true },
    { name: "Panchaloha Lakshmi Idol", category: "panchaloha", series: "Lakshmi Narayana", price: 8500, originalPrice: 9800, badge: "Authentic Series", isPopular: true, stock: 15, material: "Panchaloha (5 sacred metals)", description: "Hand-crafted Goddess Lakshmi idol in traditional panchaloha alloy.", image: "🪷", tags: ["Handcrafted", "Panchaloha"], logisticsCost: 150, discoveryFee: 250 },
    { name: "Navratri Puja Samagri Kit", category: "puja-samagri", series: "Durga", price: 1180, originalPrice: 1350, badge: "Festival Special", isPopular: true, isRecommended: true, stock: 100, material: "Premium ritual materials", description: "Complete Navratri puja kit with 22 essential items.", image: "🪔", tags: ["Complete Kit", "Festival"], logisticsCost: 80, discoveryFee: 0 },
    { name: "Tirupati Ladoo Prasadam", category: "prasadam", series: "Lakshmi Narayana", price: 350, originalPrice: 350, badge: "Temple Direct", isRecommended: true, stock: 200, material: "Original temple prasadam", description: "Authentic ladoo prasadam from Tirupati Balaji temple.", image: "🙏", tags: ["Temple Direct", "24hr Delivery"], logisticsCost: 60, discoveryFee: 0 },
    { name: "Shiva Lingam Copper Set", category: "puja-samagri", series: "Shiva", price: 2200, originalPrice: 2600, badge: "Energized", isRecommended: true, stock: 30, material: "Pure copper", description: "Sacred copper Shiva lingam energized at Kashi Vishwanath.", image: "⚡", tags: ["Energized", "Copper"], logisticsCost: 100, discoveryFee: 250 },
    { name: "Ashwagandha Wellness Pack", category: "wellness", price: 699, originalPrice: 899, badge: "Ayurvedic", isPopular: true, stock: 80, material: "100% natural herbs", description: "Temple-grade Ashwagandha, Brahmi and Tulsi blend.", image: "🌿", tags: ["Ayurvedic", "Organic"], logisticsCost: 60, discoveryFee: 0 },
    { name: "Durga Yantra Gold Plated", category: "wearables", series: "Durga", price: 1800, originalPrice: 2100, badge: "Authentic Series", isRecommended: true, stock: 40, material: "Gold-plated copper", description: "Sri Durga Yantra energized during Navratri.", image: "✨", tags: ["Gold Plated", "Yantra"], logisticsCost: 80, discoveryFee: 250 },
    { name: "Ganesha Panchaloha Murti", category: "panchaloha", series: "Ganesha", price: 12500, originalPrice: 14000, badge: "Masterpiece", isPopular: true, isRecommended: true, stock: 8, material: "Panchaloha premium", description: "Large Ganesha murti in traditional South Indian panchaloha.", image: "🐘", tags: ["Premium", "Large Format"], logisticsCost: 200, discoveryFee: 250 },
    { name: "Anjaneya Kavach Pendant", category: "wearables", series: "Anjaneya", price: 1250, originalPrice: 1450, badge: "Energized", stock: 60, material: "Panchaloha", description: "Hanuman kavach pendant blessed at Tirupati-region temple.", image: "🔶", tags: ["Panchaloha", "Kavach"], logisticsCost: 60, discoveryFee: 250 },
    { name: "Navagraha Oil Kit", category: "wellness", price: 1350, originalPrice: 1600, badge: "Astro Care", isPopular: true, isRecommended: true, stock: 45, material: "9 sacred ritual oils", description: "Nine planet-specific oils for Navagraha puja.", image: "🪐", tags: ["9 Oils", "Astro Remedy"], logisticsCost: 80, discoveryFee: 0 },
  ]);
  await Banner.create({ type: "hero", title: "Sacred Products, Temple Blessed", subtitle: "Navratri Special", badge: "🪔 NAVRATRI SPECIAL", isActive: true });
  res.json({ success: true, message: "✅ Database seeded! Admin: admin@shriaaum.com / ChangeMe@123" });
});
```

Commit → Railway redeploys → then visit:
```
https://e-commecs-backend-production.up.railway.app/api/seed-init
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, timestamp: new Date() });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🕉  Shri Aaum Backend running on port ${PORT}`);
  console.log(`📦  Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗  API: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
