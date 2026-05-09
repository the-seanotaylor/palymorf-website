# Palymorf Website

Official website for [Palymorf](https://palymorf.com) — a premium transformation ecosystem for high earners who have built financial success but are spending more time managing it than living it.

## Structure

```
palymorf/
├── index.html          # Main page
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── questions.js    # 75-question assessment data
│   ├── assessment.js   # Assessment + results engine
│   └── main.js         # Nav, animations, form
├── vercel.json         # Vercel deployment config
└── README.md
```

## Sections

- **Hero** — Headline, score card preview, proof stats
- **About** — Wanda Rogers + Sean Taylor founder cards
- **How It Works** — Three-tier service steps
- **Assessment** — Full 75-question Wealth Readiness Score with results engine
- **Offers** — Three service tiers with pricing
- **Contact** — Inquiry form

## Deployment

This site is deployed via [Vercel](https://vercel.com) connected to this GitHub repository. Every push to `main` triggers an automatic redeploy.

### Connect your domain

1. In Vercel dashboard → your project → Settings → Domains
2. Add `palymorf.com` and `www.palymorf.com`
3. Update your DNS at your registrar with the records Vercel provides

## Contact Form

The contact form currently uses a client-side timeout placeholder. To connect a real backend:

**Option A — Formspree (easiest, free tier available)**
1. Create account at formspree.io
2. Create a new form, copy your endpoint URL
3. In `index.html`, change `<form ... onsubmit="handleFormSubmit(event)">` to `<form action="https://formspree.io/f/YOUR_ID" method="POST">`
4. Remove the `handleFormSubmit` call from `main.js`

**Option B — EmailJS (sends directly to your inbox)**
1. Create account at emailjs.com
2. Follow their JS SDK setup
3. Replace the `setTimeout` in `handleFormSubmit` in `main.js` with an EmailJS send call

## Development

No build tools needed. Open `index.html` directly in a browser or use any local server:

```bash
npx serve .
# or
python3 -m http.server 3000
```

## License

&copy; 2026 Palymorf LLC. All rights reserved.
