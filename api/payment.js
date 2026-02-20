const axios = require("axios");

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
  try {
    const API_KEY = process.env.ATLANTICH2H_API_KEY;
    const BASE_URL =
      process.env.ATLANTICH2H_BASE_URL || "https://atlantich2h.com";

    if (!API_KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "tLKgI9rQMC6mG9cTOrX8Xn9JlVSpljWSS7hTvgS3trriqHU0l2MbqpGjJ84isU3JtMEv3gZn3Xlkgwy87qrqWKzt0uqOeZY9HN84" });
    }

    // ===============================
    // GET = CEK STATUS
    // ===============================
    if (req.method === "GET") {
      const { id } = req.query;

      if (!id) {
        return res
          .status(400)
          .json({ ok: false, error: "Missing id transaksi" });
      }

      const response = await axios.post(
        `${BASE_URL}/deposit/status`,
        toForm({
          api_key: API_KEY,
          id: id,
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
    }

    // ===============================
    // POST = CANCEL TRANSAKSI
    // ===============================
    if (req.method === "POST") {
      const { id } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ ok: false, error: "Missing id transaksi" });
      }

      const response = await axios.post(
        `${BASE_URL}/deposit/cancel`,
        toForm({
          api_key: API_KEY,
          id: id,
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
    }

    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.response?.data || err.message,
    });
  }
};