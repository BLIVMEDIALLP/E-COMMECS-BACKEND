const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { protect } = require("../middleware/auth");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  if (!admin.isActive) {
    return res.status(403).json({ success: false, message: "Account deactivated" });
  }

  admin.lastLogin = new Date();
  await admin.save();

  res.json({
    success: true,
    token: signToken(admin._id),
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    },
  });
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// POST /api/auth/admins — create new admin (superadmin only)
router.post("/admins", protect, async (req, res) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Superadmin only" });
  }
  const admin = await Admin.create(req.body);
  res.status(201).json({ success: true, admin });
});

// GET /api/auth/admins
router.get("/admins", protect, async (req, res) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Superadmin only" });
  }
  const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
  res.json({ success: true, admins });
});

// PUT /api/auth/admins/:id — update permissions
router.put("/admins/:id", protect, async (req, res) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Superadmin only" });
  }
  const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
  res.json({ success: true, admin });
});

// POST /api/auth/change-password
router.post("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin._id);
  if (!(await admin.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, message: "Current password incorrect" });
  }
  admin.password = newPassword;
  await admin.save();
  res.json({ success: true, message: "Password updated" });
});

module.exports = router;
