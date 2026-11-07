
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
    const upstream = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      redirect: 'follow'
    });

    const raw = await upstream.text();

    let result;

    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        ok: false,
        msg: 'Respons GAS bukan JSON.'
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(502).json({
      ok: false,
      msg: 'Gagal menghubungi GAS: ' + error.message
    });
  }
}
