const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "support"],
      default: "admin",
    },
    permissions: {
      products: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      banners: { type: Boolean, default: false },
      pricing: { type: Boolean, default: false },
      shipping: { type: Boolean, default: false },
      admins: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
