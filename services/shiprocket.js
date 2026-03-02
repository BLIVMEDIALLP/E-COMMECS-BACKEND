// ──────────────────────────────────────────────────────────────────────────────
//  SHIPROCKET SERVICE
//  Docs: https://apidocs.shiprocket.in/
//  Dashboard: https://app.shiprocket.in/
// ──────────────────────────────────────────────────────────────────────────────

const axios = require("axios");

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";
let token = null;
let tokenExpiry = null;

// Auto-authenticate and cache token (expires in 24h)
const getToken = async () => {
  if (token && tokenExpiry && Date.now() < tokenExpiry) return token;

  if (!process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL.includes("@email.com")) {
    throw new Error("Shiprocket credentials not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to .env");
  }

  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });

  token = res.data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // refresh before 24h
  console.log("✅ Shiprocket authenticated");
  return token;
};

const headers = async () => ({
  Authorization: `Bearer ${await getToken()}`,
  "Content-Type": "application/json",
});

// Create a new Shiprocket order + shipment
const createShipment = async (order) => {
  const h = await headers();

  const payload = {
    order_id: order.orderNumber,
    order_date: new Date(order.createdAt).toISOString().split("T")[0],
    pickup_location: "Primary",               // set in Shiprocket dashboard
    channel_id: "",                           // leave blank for custom
    comment: order.notes || "Shri Aaum Order",
    billing_customer_name: order.customer.name,
    billing_last_name: "",
    billing_address: order.customer.line1,
    billing_address_2: order.customer.line2 || "",
    billing_city: order.customer.city,
    billing_pincode: order.customer.pincode,
    billing_state: order.customer.state,
    billing_country: "India",
    billing_email: order.customer.email || "",
    billing_phone: order.customer.phone,
    shipping_is_billing: true,
    order_items: order.items.map((item) => ({
      name: item.name,
      sku: item.sku || item.product.toString(),
      units: item.qty,
      selling_price: item.price,
      discount: "",
      tax: "",
      hsn: 9999,
    })),
    payment_method: order.paymentStatus === "paid" ? "Prepaid" : "COD",
    shipping_charges: order.logisticsTotal || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: order.discountAmount || 0,
    sub_total: order.subtotal,
    length: 15,
    breadth: 12,
    height: 10,
    weight: order.items.reduce((s, i) => s + (i.qty * 0.5), 0), // kg estimate
  };

  const res = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, { headers: h });
  return res.data;
};

// Request pickup for a shipment
const requestPickup = async (shipmentId) => {
  const h = await headers();
  const res = await axios.post(`${BASE_URL}/courier/generate/pickup`, {
    shipment_id: [shipmentId],
  }, { headers: h });
  return res.data;
};

// Get AWB (tracking) code
const assignAWB = async (shipmentId) => {
  const h = await headers();
  const res = await axios.post(`${BASE_URL}/courier/assign/awb`, {
    shipment_id: shipmentId,
  }, { headers: h });
  return res.data;
};

// Track a shipment by AWB
const trackShipment = async (awbCode) => {
  const h = await headers();
  const res = await axios.get(`${BASE_URL}/courier/track/awb/${awbCode}`, { headers: h });
  return res.data;
};

// Get available couriers for a pincode
const checkServiceability = async ({ pickupPincode, deliveryPincode, weight, cod = false }) => {
  const h = await headers();
  const res = await axios.get(`${BASE_URL}/courier/serviceability/`, {
    headers: h,
    params: {
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight,
      cod: cod ? 1 : 0,
    },
  });
  return res.data;
};

// Cancel an order
const cancelOrder = async (orderIds) => {
  const h = await headers();
  const res = await axios.post(`${BASE_URL}/orders/cancel`, {
    ids: Array.isArray(orderIds) ? orderIds : [orderIds],
  }, { headers: h });
  return res.data;
};

module.exports = {
  createShipment,
  requestPickup,
  assignAWB,
  trackShipment,
  checkServiceability,
  cancelOrder,
};
