const axios = require("axios");

// cache in-memory (best effort)
global.__KENZI_PAYMAP__ = global.__KENZI_PAYMAP__ || new Map();

function toForm(data) {
  const p = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) p.append(k, String(v));
  });
  return p.toString();
}

function pickQrImage(payload) {
  // coba ambil field QR dari beberapa kemungkinan nama
  return (
    payload?.qr_image ||
    payload?.qris_image ||
    payload?.qr_url ||
    payload?.qrcode ||
    payload?.data?.qr_image ||
    payload?.data?.qr_url ||
    payload?.data?.qrcode ||
    payload?.data?.qr
  );
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

    const body = req.body || {};
    const { order_id, amount } = body;

    if (!order_id || !amount) {
      return res.status(400).json({ success: false, error: "Missing: order_id, amount" });
    }

    // NOTE:
    // - type & metode itu tergantung akun AtlanticH2H kamu.
    // - Kalau kamu sudah tahu value yang benar, isi via ENV biar gak hardcode.
    const TYPE = process.env.ATLANTICH2H_DEPOSIT_TYPE || "qris";
    const METODE = process.env.ATLANTICH2H_DEPOSIT_METODE || "QRIS";

    // create deposit
    const r = await axios.post(
      `${BASE_URL}/deposit/create`,
      toForm({
        api_key: API_KEY,
        reff_id: order_id,   // penting: frontend pakai order_id
        nominal: amount,
        type: TYPE,
        metode: METODE,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 20000 }
    );

    const data = r.data || {};
    const depositId =
      data?.id || data?.deposit_id || data?.data?.id || data?.data?.deposit_id || null;

    // simpan mapping best-effort
    if (depositId) global.__KENZI_PAYMAP__.set(String(order_id), String(depositId));

    const qr = pickQrImage(data);

    return res.status(200).json({
      success: true,
      order_id,
      deposit_id: depositId,     // (frontend tidak wajib pakai, tapi berguna)
      qr_image: qr || null,      // frontend butuh ini 4
      raw: data,                 // kalau mau debug, bisa kamu hapus nanti
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      error: err?.response?.data || err?.message || "Gagal create QRIS",
    });
  }
};