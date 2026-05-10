// api/submit.js
// Vercel serverless function — saves assessment to Supabase + sends email notification

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    email,
    answers,
    domain_scores,
    overall_score,
    tier,
    flags
  } = req.body;

  // Basic validation
  if (!name || !email || !answers || !overall_score) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  try {
    // ── 1. SAVE TO SUPABASE ─────────────────
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        email,
        answers,
        domain_scores,
        overall_score,
        tier,
        flags,
        note: ''
      })
    });

    if (!dbRes.ok) {
      const err = await dbRes.text();
      console.error('Supabase error:', err);
      return res.status(500).json({ error: 'Failed to save submission' });
    }

    const [savedRecord] = await dbRes.json();

    // ── 2. SEND EMAIL NOTIFICATION ──────────
    if (resendKey && notifyEmail) {
      const flagLines = [
        flags?.time_money_gap ? '🔴 Time/money gap detected — says time but actions say money' : null,
        flags?.low_value_time ? '🟡 Low-value time use — doing work that should be delegated' : null,
        flags?.time_aligned ? '🟢 Time alignment confirmed — values match behavior' : null,
      ].filter(Boolean).join('\n');

      const domainLines = Object.entries(domain_scores)
        .map(([k, v]) => `  ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}/100`)
        .join('\n');

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: 'Palymorf <noreply@palymorf.com>',
          to: notifyEmail,
          subject: `New assessment: ${name} scored ${overall_score}/100 — ${tier}`,
          text: `
New Palymorf Wealth Readiness Score submission

━━━━━━━━━━━━━━━━━━━━━━━
CONTACT
━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name}
Email: ${email}

━━━━━━━━━━━━━━━━━━━━━━━
SCORE
━━━━━━━━━━━━━━━━━━━━━━━
Overall: ${overall_score}/100
Tier: ${tier}

━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━
${domainLines}

━━━━━━━━━━━━━━━━━━━━━━━
FLAGS
━━━━━━━━━━━━━━━━━━━━━━━
${flagLines || 'No flags detected'}

━━━━━━━━━━━━━━━━━━━━━━━
View full submission in the admin dashboard:
https://palymorf.com/admin
━━━━━━━━━━━━━━━━━━━━━━━
          `.trim(),
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #1A1814; max-width: 560px; margin: 0 auto; padding: 2rem; }
  .header { border-bottom: 2px solid #B8A06A; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .logo { font-size: 20px; letter-spacing: 0.12em; color: #1A1814; margin: 0; }
  .logo span { color: #B8A06A; }
  .score-block { background: #F5F0E8; border-radius: 4px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: center; }
  .score-num { font-size: 48px; font-weight: 300; color: #8C6E2F; margin: 0; }
  .score-tier { font-size: 16px; font-weight: 500; color: #1A1814; margin: 4px 0 0; }
  .section-title { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #B8A06A; font-weight: 500; margin: 1.5rem 0 0.75rem; }
  .domain-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 0.5px solid #E8DCC8; font-size: 14px; }
  .flag-red { background: #FCEBEB; border-left: 3px solid #A32D2D; padding: 0.75rem 1rem; margin-bottom: 0.5rem; font-size: 13px; color: #791F1F; }
  .flag-yellow { background: #FFF8E6; border-left: 3px solid #8C6E2F; padding: 0.75rem 1rem; margin-bottom: 0.5rem; font-size: 13px; color: #7A5C00; }
  .flag-green { background: #E1F5EE; border-left: 3px solid #0F6E56; padding: 0.75rem 1rem; margin-bottom: 0.5rem; font-size: 13px; color: #085041; }
  .contact-block { background: #F5F1EB; border-radius: 4px; padding: 1rem; margin-bottom: 1.5rem; }
  .cta-btn { display: inline-block; background: #1A1814; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 2px; font-size: 13px; font-weight: 500; margin-top: 1.5rem; }
</style></head>
<body>
  <div class="header"><p class="logo">PALYM<span>O</span>RF</p></div>
  <div class="contact-block">
    <strong>${name}</strong><br>
    <a href="mailto:${email}" style="color:#185FA5">${email}</a>
  </div>
  <div class="score-block">
    <div class="score-num">${overall_score}</div>
    <div class="score-tier">${tier}</div>
  </div>
  <div class="section-title">Domain Breakdown</div>
  ${Object.entries(domain_scores).map(([k, v]) => `
    <div class="domain-row">
      <span>${k.charAt(0).toUpperCase() + k.slice(1)}</span>
      <strong>${v}/100</strong>
    </div>`).join('')}
  ${flags?.time_money_gap || flags?.low_value_time || flags?.time_aligned ? `
  <div class="section-title">Flags</div>
  ${flags?.time_money_gap ? '<div class="flag-red">🔴 Time/money gap — says time but actions say money</div>' : ''}
  ${flags?.low_value_time ? '<div class="flag-yellow">🟡 Low-value time use — doing work that should be delegated</div>' : ''}
  ${flags?.time_aligned ? '<div class="flag-green">🟢 Time aligned — values match behavior</div>' : ''}
  ` : ''}
  <a href="https://palymorf.com/admin" class="cta-btn">View in Admin Dashboard &rarr;</a>
</body>
</html>`
        })
      });
    }

    return res.status(200).json({ success: true, id: savedRecord?.id });

  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
