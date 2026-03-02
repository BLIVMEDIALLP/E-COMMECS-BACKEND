// Run: node scripts/seed.js
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
};

const seed = async () => {
  await connectDB();

  const Admin = require("../models/Admin");
  const Product = require("../models/Product");
  const { Banner, SiteSetting } = require("../models/Banner");

  // Clear existing
  await Promise.all([Admin.deleteMany(), Product.deleteMany(), Banner.deleteMany(), SiteSetting.deleteMany()]);
  console.log("🧹 Cleared existing data");

  // Create superadmin
  await Admin.create({
    name: "IV Reddy",
    email: process.env.ADMIN_DEFAULT_EMAIL || "admin@shriaaum.com",
    password: process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMe@123",
    role: "superadmin",
    permissions: { products: true, orders: true, banners: true, pricing: true, shipping: true, admins: true },
  });
  console.log("👤 Superadmin created");

  // Seed products
  await Product.insertMany([
    { name: "5-Mukhi Rudraksha Mala", category: "rudraksha", series: "Shiva", price: 4500, originalPrice: 5200, badge: "Energized", isPopular: true, isRecommended: true, stock: 50, material: "Natural Himalayan Rudraksha", description: "108-bead authentic 5-mukhi Rudraksha mala, energized at Kedarnath. Provides mental clarity and spiritual protection.", image: "🔱", tags: ["Certified", "Temple-Blessed"], logisticsCost: 100, discoveryFee: 250, isEnergized: true, templeOrigin: "Kedarnath" },
    { name: "Panchaloha Lakshmi Idol", category: "panchaloha", series: "Lakshmi Narayana", price: 8500, originalPrice: 9800, badge: "Authentic Series", isPopular: true, stock: 15, material: "Panchaloha (5 sacred metals)", description: "Hand-crafted Goddess Lakshmi idol in traditional panchaloha alloy. Temple-style craftsmanship from South Indian artisans.", image: "🪷", tags: ["Handcrafted", "Panchaloha"], logisticsCost: 150, discoveryFee: 250, isEnergized: true },
    { name: "Navratri Puja Samagri Kit", category: "puja-samagri", series: "Durga", price: 1180, originalPrice: 1350, badge: "Festival Special", isPopular: true, isRecommended: true, stock: 100, material: "Premium ritual materials", description: "Complete Navratri puja kit with 22 essential items — kumkum, haldi, diyas, flowers, camphor and more.", image: "🪔", tags: ["Complete Kit", "Festival"], logisticsCost: 80, discoveryFee: 0 },
    { name: "Tirupati Ladoo Prasadam", category: "prasadam", series: "Lakshmi Narayana", price: 350, originalPrice: 350, badge: "Temple Direct", isRecommended: true, stock: 200, material: "Original temple prasadam", description: "Authentic ladoo prasadam sourced directly from Tirupati Balaji temple. Delivered within 24 hours of dispatch.", image: "🙏", tags: ["Temple Direct", "24hr Delivery"], logisticsCost: 60, discoveryFee: 0, templeOrigin: "Tirupati Balaji" },
    { name: "Shiva Lingam Copper Set", category: "puja-samagri", series: "Shiva", price: 2200, originalPrice: 2600, badge: "Energized", isRecommended: true, stock: 30, material: "Pure copper", description: "Sacred copper Shiva lingam with abhishek vessel and puja plate. Energized at Kashi Vishwanath.", image: "⚡", tags: ["Energized", "Copper"], logisticsCost: 100, discoveryFee: 250, isEnergized: true },
    { name: "Ashwagandha Wellness Pack", category: "wellness", price: 699, originalPrice: 899, badge: "Ayurvedic", isPopular: true, stock: 80, material: "100% natural herbs", description: "Temple-grade Ashwagandha, Brahmi and Tulsi blend for stress relief and mental clarity.", image: "🌿", tags: ["Ayurvedic", "Organic"], logisticsCost: 60, discoveryFee: 0 },
    { name: "Durga Yantra Gold Plated", category: "wearables", series: "Durga", price: 1800, originalPrice: 2100, badge: "Authentic Series", isRecommended: true, stock: 40, material: "Gold-plated copper", description: "Sri Durga Yantra in gold-plated copper. Energized during Navratri for protection and strength.", image: "✨", tags: ["Gold Plated", "Yantra"], logisticsCost: 80, discoveryFee: 250, isEnergized: true },
    { name: "Ganesha Panchaloha Murti", category: "panchaloha", series: "Ganesha", price: 12500, originalPrice: 14000, badge: "Masterpiece", isPopular: true, isRecommended: true, stock: 8, material: "Panchaloha — premium variant", description: "Large Ganesha murti in traditional South Indian style with panchaloha. Museum-quality craftsmanship.", image: "🐘", tags: ["Premium", "Large Format"], logisticsCost: 200, discoveryFee: 250, isEnergized: true },
    { name: "Anjaneya Kavach Pendant", category: "wearables", series: "Anjaneya", price: 1250, originalPrice: 1450, badge: "Energized", stock: 60, material: "Panchaloha", description: "Hanuman kavach pendant blessed at a Tirupati-region temple. Worn for courage and protection.", image: "🔶", tags: ["Panchaloha", "Kavach"], logisticsCost: 60, discoveryFee: 250, isEnergized: true },
    { name: "Navagraha Oil Kit", category: "wellness", price: 1350, originalPrice: 1600, badge: "Astro Care", isPopular: true, isRecommended: true, stock: 45, material: "9 sacred ritual oils", description: "Nine planet-specific oils for Navagraha puja and planetary remedies. Formulated by Vedic astrologers.", image: "🪐", tags: ["9 Oils", "Astro Remedy"], logisticsCost: 80, discoveryFee: 0 },
  ]);
  console.log("📦 Products seeded");

  // Seed hero banner
  await Banner.insertMany([
    { type: "hero", title: "Sacred Products, Temple Blessed", subtitle: "Navratri Special — Puja Samagri Starting ₹117", description: "Authentic devotional items from 50+ partner temples across South India. Energized by expert pujaris, delivered to your doorstep.", badge: "🪔 NAVRATRI SPECIAL", ctaText: "Shop Rudraksha 📿", ctaLink: "/products?category=rudraksha", ctaText2: "Temple Prasadam 🙏", ctaLink2: "/products?category=prasadam", bgGradient: "linear-gradient(135deg, #3d1c02 0%, #7a3a0a 40%, #c1440e 80%, #f5c842 100%)", isActive: true, sortOrder: 0 },
    { type: "strip", title: "🚚 Free shipping above ₹2,000 · Energized & Certified · 24–48hr Delivery · GST Invoiced", isActive: true, sortOrder: 1 },
  ]);
  console.log("🖼️  Banners seeded");

  // Seed site settings
  await SiteSetting.insertMany([
    { key: "store_name", value: "Shri Aaum", label: "Store Name", group: "general" },
    { key: "store_tagline", value: "Sacred Store", label: "Tagline", group: "general" },
    { key: "free_shipping_threshold", value: 2000, label: "Free Shipping Above (₹)", group: "store" },
    { key: "default_shipping_charge", value: 99, label: "Default Shipping Charge (₹)", group: "store" },
    { key: "gst_percent", value: 18, label: "Default GST %", group: "store" },
    { key: "temple_count", value: "50+", label: "Partner Temple Count (display)", group: "general" },
    { key: "support_phone", value: "+91 98765 43210", label: "Support Phone", group: "general" },
    { key: "support_email", value: "support@shriaaum.com", label: "Support Email", group: "general" },
    { key: "razorpay_enabled", value: false, label: "Enable Razorpay (requires keys)", group: "payment" },
    { key: "shiprocket_enabled", value: false, label: "Enable Shiprocket (requires creds)", group: "shipping" },
    { key: "interakt_enabled", value: false, label: "Enable Interakt WhatsApp (requires key)", group: "whatsapp" },
  ]);
  console.log("⚙️  Settings seeded");

  console.log("\n✅ Seed complete!");
  console.log(`   Admin Email: ${process.env.ADMIN_DEFAULT_EMAIL || "admin@shriaaum.com"}`);
  console.log(`   Admin Password: ${process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMe@123"}`);
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
