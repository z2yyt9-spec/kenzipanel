const axios = require("axios");

// helper: ubah object jadi form-urlencoded
function toForm(data) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) {
      params.append(k, String(v));
    }
  }
  return params.toString();
}

module.exports = async (req, res) => {
  // hanya izinkan POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // 🔐 API KEY diambil dari Environment Variable Vercel
    const API_KEY = process.env.ATLANTICH2H_API_KEY;
    const BASE_URL =
      process.env.ATLANTICH2H_BASE_URL || "https://atlantich2h.com";

    if (!API_KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "tLKgI9rQMC6mG9cTOrX8Xn9JlVSpljWSS7hTvgS3trriqHU0l2MbqpGjJ84isU3JtMEv3gZn3Xlkgwy87qrqWKzt0uqOeZY9HN84" });
    }

    const { amount, reffId, type, metode } = req.body || {};

    // validasi sederhana
    if (!amount || !reffId || !type || !metode) {
      return res.status(400).json({
        ok: false,
        error: "Wajib isi: amount, reffId, type, metode",
      });
    }

    // panggil endpoint AtlanticH2H
    const response = await axios.post(
      `${BASE_URL}/deposit/create`,
      toForm({
        api_key: API_KEY,
        reff_id: reffId,
        nominal: amount,
        type: type,     // contoh: "qris"
        metode: metode, // contoh: "QRIS"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 20000,
      }
    );

    return res.status(200).json({
      ok: true,
      data: response.data,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.response?.data || err.message,
    });
  }
};