// ──────────────────────────────────────────────────────────────────────────────
//  RAZORPAY SERVICE
//  Docs: https://razorpay.com/docs/payments/
//  Dashboard: https://dashboard.razorpay.com/app/keys
// ──────────────────────────────────────────────────────────────────────────────

const Razorpay = require("razorpay");
const crypto = require("crypto");

let razorpay = null;

const getClient = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes("XXXX")) {
      throw new Error("Razorpay API keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env");
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// Create a Razorpay order (amount in paise)
const createOrder = async ({ amount, currency = "INR", receipt, notes = {} }) => {
  const client = getClient();
  return client.orders.create({
    amount: Math.round(amount * 100), // convert ₹ to paise
    currency,
    receipt,
    notes,
  });
};

// Verify payment signature after successful payment
const verifySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");
  return expectedSignature === razorpaySignature;
};

// Initiate refund
const createRefund = async (paymentId, amount) => {
  const client = getClient();
  return client.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    speed: "normal",
  });
};

// Fetch payment details
const fetchPayment = async (paymentId) => {
  const client = getClient();
  return client.payments.fetch(paymentId);
};

// Verify webhook signature from Razorpay
const verifyWebhook = (body, signature) => {
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");
  return expectedSig === signature;
};

module.exports = {
  createOrder,
  verifySignature,
  createRefund,
  fetchPayment,
  verifyWebhook,
};
