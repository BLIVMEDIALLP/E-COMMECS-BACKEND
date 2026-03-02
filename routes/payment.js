const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const razorpay = require("../services/razorpay");
const interakt = require("../services/interakt");
const { protect } = require("../middleware/auth");

// POST /api/payment/create-order — create Razorpay order
router.post("/create-order", async (req, res) => {
  const { items, customer, notes } = req.body;

  if (!items?.length) return res.status(400).json({ success: false, message: "No items in order" });

  // Validate and price items from DB
  let subtotal = 0;
  let logisticsTotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      return res.status(400).json({ success: false, message: `Product not available: ${item.name}` });
    }
    if (product.stock < item.qty) {
      return res.status(400).json({ success: false, message: `Insufficient stock: ${product.name}` });
    }
    subtotal += product.price * item.qty;
    logisticsTotal += product.logisticsCost;
    validatedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      qty: item.qty,
      image: product.image,
      sku: product.sku,
    });
  }

  const total = subtotal + logisticsTotal;

  // Create our DB order (pending)
  const dbOrder = await Order.create({
    customer,
    items: validatedItems,
    subtotal,
    logisticsTotal,
    total,
    notes,
    paymentStatus: "pending",
    status: "placed",
  });

  // Create Razorpay order
  let rzpOrder;
  try {
    rzpOrder = await razorpay.createOrder({
      amount: total,
      receipt: dbOrder.orderNumber,
      notes: { orderId: dbOrder._id.toString() },
    });
  } catch (err) {
    // Razorpay not configured — return mock for dev
    console.warn("⚠️  Razorpay not configured:", err.message);
    return res.json({
      success: true,
      dev: true,
      orderId: dbOrder._id,
      orderNumber: dbOrder.orderNumber,
      message: "Razorpay not configured — add keys to .env",
    });
  }

  dbOrder.razorpayOrderId = rzpOrder.id;
  await dbOrder.save();

  res.json({
    success: true,
    orderId: dbOrder._id,
    orderNumber: dbOrder.orderNumber,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
    customer,
  });
});

// POST /api/payment/verify — verify payment after Razorpay callback
router.post("/verify", async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  // Verify signature
  const isValid = razorpay.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  if (!isValid) {
    order.paymentStatus = "failed";
    await order.save();
    return res.status(400).json({ success: false, message: "Payment verification failed" });
  }

  // Update order
  order.paymentStatus = "paid";
  order.status = "confirmed";
  order.razorpayPaymentId = razorpayPaymentId;
  order.razorpaySignature = razorpaySignature;
  await order.save();

  // Decrement stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.qty, totalSold: item.qty },
    });
  }

  // Send WhatsApp notifications
  try {
    await interakt.sendOrderConfirmation(order);
    await interakt.sendPaymentSuccess(order);
    order.whatsappUpdates.push({ event: "order_confirmed", sentAt: new Date(), status: "sent" });
    await order.save();
  } catch (e) {
    console.warn("WhatsApp notification failed:", e.message);
  }

  res.json({ success: true, order });
});

// POST /api/payment/webhook — Razorpay webhook endpoint
// Point this URL in Razorpay dashboard: https://yourdomain.com/api/payment/webhook
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!razorpay.verifyWebhook(req.body, signature)) {
    return res.status(400).json({ success: false });
  }

  const event = JSON.parse(req.body);

  if (event.event === "payment.captured") {
    const paymentId = event.payload.payment.entity.id;
    const rzpOrderId = event.payload.payment.entity.order_id;
    await Order.findOneAndUpdate(
      { razorpayOrderId: rzpOrderId },
      { paymentStatus: "paid", razorpayPaymentId: paymentId }
    );
  }

  res.json({ received: true });
});

// POST /api/payment/refund/:orderId — initiate refund (admin)
router.post("/refund/:orderId", protect, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  const refund = await razorpay.createRefund(order.razorpayPaymentId, order.total);

  order.paymentStatus = "refunded";
  order.status = "returned";
  await order.save();

  res.json({ success: true, refund });
});

module.exports = router;
