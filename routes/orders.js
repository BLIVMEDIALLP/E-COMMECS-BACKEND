const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const shiprocket = require("../services/shiprocket");
const interakt = require("../services/interakt");
const { protect, can } = require("../middleware/auth");

// All order routes require admin auth
router.use(protect);

// GET /api/orders — list with filters
router.get("/", async (req, res) => {
  const { status, paymentStatus, search, page = 1, limit = 20, sort = "createdAt" } = req.query;

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ];
  }

  const orders = await Order.find(query)
    .populate("items.product", "name image")
    .sort({ [sort]: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Order.countDocuments(query);

  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

// GET /api/orders/stats — dashboard stats
router.get("/stats", async (req, res) => {
  const [total, today, paid, pending, shipped, delivered] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    Order.countDocuments({ paymentStatus: "paid" }),
    Order.countDocuments({ status: "placed", paymentStatus: "pending" }),
    Order.countDocuments({ status: "shipped" }),
    Order.countDocuments({ status: "delivered" }),
  ]);

  const revenueResult = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  // Last 7 days revenue
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyOrders = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, stats: { total, today, paid, pending, shipped, delivered, totalRevenue, weeklyOrders } });
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product");
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, order });
});

// PATCH /api/orders/:id/status — update order status
router.patch("/:id/status", async (req, res) => {
  const { status, internalNotes } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  order.status = status;
  if (internalNotes) order.internalNotes = internalNotes;

  // Send WhatsApp update based on status
  try {
    if (status === "shipped") await interakt.sendShipmentUpdate(order);
    if (status === "delivered") await interakt.sendDeliveryConfirmation(order);
    if (status === "cancelled") await interakt.sendCancellationNotice(order);
    order.whatsappUpdates.push({ event: status, sentAt: new Date(), status: "sent" });
  } catch (e) {
    console.warn("WhatsApp update failed:", e.message);
  }

  await order.save();
  res.json({ success: true, order });
});

// POST /api/orders/:id/ship — push to Shiprocket
router.post("/:id/ship", can("shipping"), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  try {
    const result = await shiprocket.createShipment(order);
    order.shiprocketOrderId = result.order_id;
    order.shiprocketShipmentId = result.shipment_id;
    order.status = "processing";
    await order.save();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id/track
router.get("/:id/track", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order?.awbCode) return res.status(404).json({ success: false, message: "No tracking info yet" });
  const tracking = await shiprocket.trackShipment(order.awbCode);
  res.json({ success: true, tracking });
});

// PATCH /api/orders/:id/followup
router.patch("/:id/followup", async (req, res) => {
  const { followUpStatus, internalNotes } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { followUpStatus, internalNotes },
    { new: true }
  );
  res.json({ success: true, order });
});

// POST /api/orders/:id/whatsapp — manual WhatsApp message
router.post("/:id/whatsapp", async (req, res) => {
  const order = await Order.findById(req.params.id);
  const { templateName, bodyValues } = req.body;
  try {
    const result = await interakt.sendCustomMessage(order.customer.phone, templateName, bodyValues);
    order.whatsappUpdates.push({ event: `manual:${templateName}`, sentAt: new Date(), status: "sent" });
    await order.save();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
