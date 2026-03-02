// ──────────────────────────────────────────────────────────────────────────────
//  INTERAKT (WhatsApp Business API)
//  Docs: https://docs.interakt.ai/
//  Dashboard: https://app.interakt.ai/
//
//  SETUP STEPS:
//  1. Sign up at https://app.interakt.ai/
//  2. Connect your WhatsApp Business Number
//  3. Get API Key from Settings → API & Webhooks
//  4. Create & approve message templates in your dashboard
//  5. Add INTERAKT_API_KEY to .env
// ──────────────────────────────────────────────────────────────────────────────

const axios = require("axios");

const BASE_URL = process.env.INTERAKT_BASE_URL || "https://api.interakt.ai/v1/public";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Basic ${process.env.INTERAKT_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Generic message sender
const sendMessage = async ({ phone, templateName, bodyValues = [], headerValues = [], buttonValues = [] }) => {
  if (!process.env.INTERAKT_API_KEY || process.env.INTERAKT_API_KEY.includes("XXXX")) {
    console.warn("⚠️  Interakt not configured — skipping WhatsApp message");
    return { skipped: true };
  }

  try {
    const res = await client.post("/message/", {
      countryCode: "+91",
      phoneNumber: phone.replace(/^\+91/, "").replace(/\s/g, ""),
      callbackData: "callback",
      type: "Template",
      template: {
        name: templateName,
        languageCode: "en",
        headerValues,
        bodyValues,
        buttonValues,
      },
    });
    return res.data;
  } catch (err) {
    console.error("❌ Interakt error:", err?.response?.data || err.message);
    throw err;
  }
};

// ── Pre-built Message Templates ──────────────────────────────────────────────
// NOTE: Create these template names in your Interakt dashboard first.
// Template names must match exactly.

// 1. Order confirmed
const sendOrderConfirmation = async (order) => {
  return sendMessage({
    phone: order.customer.phone,
    templateName: "order_confirmation",   // 👈 create this in Interakt dashboard
    bodyValues: [
      order.customer.name,
      order.orderNumber,
      `₹${order.total.toLocaleString("en-IN")}`,
      "24–48 hours",
    ],
  });
};

// 2. Payment received
const sendPaymentSuccess = async (order) => {
  return sendMessage({
    phone: order.customer.phone,
    templateName: "payment_success",      // 👈 create this in Interakt dashboard
    bodyValues: [
      order.customer.name,
      order.orderNumber,
      `₹${order.total.toLocaleString("en-IN")}`,
      order.razorpayPaymentId || "N/A",
    ],
  });
};

// 3. Shipment dispatched with tracking
const sendShipmentUpdate = async (order) => {
  return sendMessage({
    phone: order.customer.phone,
    templateName: "shipment_dispatched",  // 👈 create this in Interakt dashboard
    bodyValues: [
      order.customer.name,
      order.orderNumber,
      order.courierName || "Our courier",
      order.awbCode || "N/A",
      order.trackingUrl || "Track via our website",
    ],
  });
};

// 4. Out for delivery
const sendOutForDelivery = async (order) => {
  return sendMessage({
    phone: order.customer.phone,
    templateName: "out_for_delivery",     // 👈 create this in Interakt dashboard
    bodyValues: [order.customer.name, order.orderNumber],
  });
};

// 5. Order delivered
const sendDeliveryConfirmation = async (order) => {
  return sendMessage({
    phone: order.customer.phone,
    templateName: "order_delivered",      // 👈 create this in Interakt dashboard
    bodyValues: [order.customer.name, order.orderNumber],
  });
};

// 6. Order cancelled
const sendCancellationNotice = async (order, reason = "") => {
  return sendMessage({
    phone: order.customer.phone,
    templateName: "order_cancelled",      // 👈 create this in Interakt dashboard
    bodyValues: [order.customer.name, order.orderNumber, reason],
  });
};

// 7. Custom message (for support / follow-up)
const sendCustomMessage = async (phone, templateName, bodyValues = []) => {
  return sendMessage({ phone, templateName, bodyValues });
};

module.exports = {
  sendOrderConfirmation,
  sendPaymentSuccess,
  sendShipmentUpdate,
  sendOutForDelivery,
  sendDeliveryConfirmation,
  sendCancellationNotice,
  sendCustomMessage,
};
