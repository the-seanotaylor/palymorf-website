// api/submissions/[id]/note.js
// Updates the admin note for a specific submission

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const { note } = req.body;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  try {
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/submissions?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ note })
      }
    );

    if (!dbRes.ok) {
      return res.status(500).json({ error: 'Failed to update note' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Note update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
