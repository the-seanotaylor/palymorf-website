// api/report/[id].js
// Public endpoint — returns free fields always, full data only if paid

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid report ID' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  try {
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/submissions?id=eq.${encodeURIComponent(id)}&select=id,name,email,overall_score,tier,domain_scores,flags,paid,created_at`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!dbRes.ok) return res.status(500).json({ error: 'Database error' });

    const rows = await dbRes.json();
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });

    const row = rows[0];

    // Always return basic free fields + email (UUID is the access key)
    const response = {
      id:            row.id,
      name:          row.name,
      email:         row.email,
      overall_score: row.overall_score,
      tier:          row.tier,
      paid:          row.paid || false,
      created_at:    row.created_at
    };

    // Return full data only if paid
    if (row.paid) {
      response.domain_scores = row.domain_scores;
      response.flags         = row.flags;
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error('Report fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
