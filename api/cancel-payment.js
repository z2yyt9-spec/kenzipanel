const axios = require("axios");

global.__KENZI_PAYMAP__ = global.__KENZI_PAYMAP__ || new Map();

function toForm(data) {
  const p = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) p.append(k, String(v));
  });
  return p.toString();
}

async function tryCancel(BASE_URL, API_KEY, payload) {
  const r = await axios.post(
    `${BASE_URL}/deposit/cancel`,
    toForm({ api_key: API_KEY, ...payload }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 20000 }
  );
  return r.data;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const API_KEY = process.env.ATLANTICH2H_API_KEY;
    const BASE_URL = process.env.ATLANTICH2H_BASE_URL || "https://atlantich2h.com";
    if (!API_KEY) {
      return res.status(500).json({ success: false, error: "tLKgI9rQMC6mG9cTOrX8Xn9JlVSpljWSS7hTvgS3trriqHU0l2MbqpGjJ84isU3JtMEv3gZn3Xlkgwy87qrqWKzt0uqOeZY9HN84" });
    }

    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ success: false, error: "Missing order_id" });
    }

    const cachedDepositId = global.__KENZI_PAYMAP__.get(String(order_id)) || null;

    let data = null;

    // 1) coba cancel pakai reff_id
    try {
      data = await tryCancel(BASE_URL, API_KEY, { reff_id: order_id });
    } catch (_) {}

    // 2) coba cancel pakai id cache
    if (!data && cachedDepositId) {
      try {
        data = await tryCancel(BASE_URL, API_KEY, { id: cachedDepositId });
      } catch (_) {}
    }

    // 3) fallback: order_id sebagai id
    if (!data) {
      data = await tryCancel(BASE_URL, API_KEY, { id: order_id });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(200).json({
      success: false,
      error: err?.response?.data || err?.message || "Gagal cancel",
    });
  }
};