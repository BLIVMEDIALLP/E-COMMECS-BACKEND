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
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: "Too many requests" }));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts" }));

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
