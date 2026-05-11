// api/create-checkout.js
// Creates a Stripe Checkout session for the full report unlock ($197)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, email, name } = req.body;
  if (!id || !email) return res.status(400).json({ error: 'Missing required fields' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const baseUrl   = process.env.SITE_URL || 'https://palymorf.com';

  if (!stripeKey) return res.status(500).json({ error: 'Stripe not configured' });

  try {
    const params = new URLSearchParams({
      'mode':                                              'payment',
      'customer_email':                                    email,
      'line_items[0][price_data][currency]':               'usd',
      'line_items[0][price_data][product_data][name]':     'Palymorf Full Wealth Readiness Report',
      'line_items[0][price_data][product_data][description]':
        'Complete domain breakdown, personalized flags, insights, and priority gaps for your Wealth Readiness Score.',
      'line_items[0][price_data][unit_amount]':            '19700',
      'line_items[0][quantity]':                           '1',
      'metadata[submission_id]':                           id,
      'metadata[customer_name]':                           name || '',
      'success_url':                                       `${baseUrl}/report/${id}?payment=success`,
      'cancel_url':                                        `${baseUrl}/report/${id}`
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${stripeKey}`,
        'Content-Type':   'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error('Stripe error:', session.error);
      return res.status(500).json({ error: session.error?.message || 'Stripe error' });
    }

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
