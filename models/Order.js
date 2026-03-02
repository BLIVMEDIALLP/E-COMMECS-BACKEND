const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  image: { type: String },
  sku: { type: String },
});

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customer: addressSchema,

    items: [orderItemSchema],

    // Pricing
    subtotal: { type: Number, required: true },
    logisticsTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "razorpay" },

    // ── Razorpay ──────────────────────────────────────────
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Order status
    status: {
      type: String,
      enum: ["placed", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled", "returned"],
      default: "placed",
    },

    // ── Shiprocket ────────────────────────────────────────
    shiprocketOrderId: { type: String },
    shiprocketShipmentId: { type: String },
    awbCode: { type: String },           // tracking number
    courierName: { type: String },
    trackingUrl: { type: String },
    estimatedDelivery: { type: Date },

    // ── WhatsApp (Interakt) ───────────────────────────────
    whatsappUpdates: [
      {
        event: String,         // e.g., "order_confirmed", "shipped"
        sentAt: Date,
        messageId: String,
        status: String,        // "sent", "delivered", "read", "failed"
      },
    ],

    notes: { type: String },
    internalNotes: { type: String }, // admin-only

    // Admin flags
    isPriority: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
    followUpStatus: {
      type: String,
      enum: ["none", "pending", "contacted", "not_interested", "resolved"],
      default: "none",
    },
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `SA${Date.now().toString().slice(-6)}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
