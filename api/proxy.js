
export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_URL;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      msg: 'Method not allowed'
    });
  }

  if (!GAS_URL) {
    return res.status(500).json({
      ok: false,
      msg: 'GAS_URL belum dikonfigurasi.'
    });
  }

  try {
    // Pastikan URL GAS valid
    const configuredUrl = new URL(GAS_URL);

    // Baca request dari frontend
    let payload = req.body;

    // Jika body berupa string, ubah menjadi object
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return res.status(400).json({
          ok: false,
          msg: 'Request body bukan JSON valid.'
        });
      }
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        ok: false,
        msg: 'Request body kosong atau tidak valid.'
      });
    }

    // Kirim request ke Google Apps Script
    const upstream = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const raw = await upstream.text();

    const contentType = upstream.headers.get('content-type') || '';

    // Coba parsing respons GAS
    let result;

    try {
      result = JSON.parse(raw);
    } catch {
      let finalUrl = '';

      try {
        const u = new URL(upstream.url);
        finalUrl = u.origin + u.pathname;
      } catch {
        finalUrl = 'Tidak diketahui';
      }

      return res.status(502).json({
        ok: false,
        error: 'GAS_INVALID_RESPONSE',
        msg: 'Respons GAS bukan JSON.',
        diagnostic: {
          configuredHost: configuredUrl.host,
          httpStatus: upstream.status,
          contentType: contentType,
          finalUrl: finalUrl,
          responsePreview: raw.slice(0, 600)
        }
      });
    }

    // Respons GAS berhasil dibaca
    return res.status(200).json(result);

  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'PROXY_ERROR',
      msg: 'Gagal menghubungi GAS.',
      detail: error.message
    });
  }
}

