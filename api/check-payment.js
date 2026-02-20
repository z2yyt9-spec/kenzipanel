const axios = require("axios");

global.__KENZI_PAYMAP__ = global.__KENZI_PAYMAP__ || new Map();

function toForm(data) {
  const p = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) p.append(k, String(v));
  });
  return p.toString();
}

function normalizeStatus(raw) {
  const s = String(raw || "").toLowerCase();
  // mapping umum: paid/success/completed
  if (["paid", "success", "settlement", "completed", "done"].includes(s)) return "completed";
  if (["pending", "unpaid", "process", "processing"].includes(s)) return "pending";
  if (["expired", "canceled", "cancelled", "failed"].includes(s)) return "failed";
  return s || "pending";
}

async function tryStatus(BASE_URL, API_KEY, payload) {
  const r = await axios.post(
    `${BASE_URL}/deposit/status`,
    toForm({ api_key: API_KEY, ...payload }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 20000 }
  );
  return r.data;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const API_KEY = process.env.ATLANTICH2H_API_KEY;
    const BASE_URL = process.env.ATLANTICH2H_BASE_URL || "https://atlantich2h.com";
    if (!API_KEY) {
      return res.status(500).json({ success: false, error: "tLKgI9rQMC6mG9cTOrX8Xn9JlVSpljWSS7hTvgS3trriqHU0l2MbqpGjJ84isU3JtMEv3gZn3Xlkgwy87qrqWKzt0uqOeZY9HN84" });
    }

    const { order_id } = req.query || {};
    if (!order_id) {
      return res.status(400).json({ success: false, error: "Missing order_id" });
    }

    const cachedDepositId = global.__KENZI_PAYMAP__.get(String(order_id)) || null;

    let data = null;
    let lastErr = null;

    // 1) coba status pakai reff_id (paling cocok dengan frontend order_id)
    try {
      data = await tryStatus(BASE_URL, API_KEY, { reff_id: order_id });
    } catch (e) {
      lastErr = e;
    }

    // 2) kalau gagal, coba pakai deposit id dari cache
    if (!data && cachedDepositId) {
      try {
        data = await tryStatus(BASE_URL, API_KEY, { id: cachedDepositId });
      } catch (e) {
        lastErr = e;
      }
    }

    // 3) fallback terakhir: coba pakai order_id sebagai id
    if (!data) {
      try {
        data = await tryStatus(BASE_URL, API_KEY, { id: order_id });
      } catch (e) {
        lastErr = e;
      }
    }

    if (!data) {
      return res.status(200).json({
        success: false,
        error: lastErr?.response?.data || lastErr?.message || "Gagal cek status",
      });
    }

    const rawStatus =
      data?.status || data?.data?.status || data?.transaction?.status || data?.data?.transaction?.status;

    const status = normalizeStatus(rawStatus);

    // format sesuai yang dicek frontend 5
    return res.status(200).json({
      success: true,
      transaction: {
        status, // "completed" / "pending" / "failed"
        order_id,
        deposit_id: cachedDepositId || data?.id || data?.deposit_id || data?.data?.id || null,
      },
      // panel_data sengaja null (karena create panel kamu endpoint lain /api/force-create-panel)
      panel_data: null,
      raw: data, // boleh hapus nanti
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      error: err?.response?.data || err?.message || "Server error",
    });
  }
};