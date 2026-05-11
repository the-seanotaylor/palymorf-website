// api/stripe-webhook.js
// Verifies Stripe signature and marks submission as paid in Supabase

import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end',  ()    => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyAndParse(rawBody, sigHeader, secret) {
  // Parse Stripe-Signature header: t=...,v1=...
  const parts = Object.fromEntries(
    sigHeader.split(',').map(p => p.split('='))
  );
  const timestamp = parts['t'];
  const v1sig     = parts['v1'];
  if (!timestamp || !v1sig) return null;

  // Compute expected HMAC
  const signed   = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');

  // Timing-safe compare (pad to equal length to avoid length leak)
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1sig,    'hex');
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody       = await getRawBody(req);
  const sigHeader     = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sigHeader || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  const event = verifyAndParse(rawBody.toString(), sigHeader, webhookSecret);
  if (!event) {
    console.error('Stripe signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session      = event.data.object;
    const submissionId = session.metadata?.submission_id;

    if (submissionId) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}`,
        {
          method:  'PATCH',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ paid: true })
        }
      );

      if (!patchRes.ok) {
        const err = await patchRes.text();
        console.error('Supabase patch error:', err);
        return res.status(500).json({ error: 'Failed to update payment status' });
      }

      console.log(`Marked submission ${submissionId} as paid`);
    }
  }

  return res.status(200).json({ received: true });
}
