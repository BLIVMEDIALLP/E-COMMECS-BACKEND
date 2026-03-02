const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Protect admin routes
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized — no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin || !req.admin.isActive) {
      return res.status(401).json({ success: false, message: "Admin account inactive" });
    }

    next();
  } catch {
    res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

// Check specific permission
const can = (permission) => (req, res, next) => {
  if (req.admin.role === "superadmin") return next();
  if (!req.admin.permissions[permission]) {
    return res.status(403).json({ success: false, message: `No permission: ${permission}` });
  }
  next();
};

module.exports = { protect, can };
