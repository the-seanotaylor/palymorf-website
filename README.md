# Palymorf Website

Official website for [Palymorf](https://palymorf.com) including the Wealth Readiness Score assessment, results storage, email notifications, and admin dashboard.

---

## Stack

- **Frontend** — Vanilla HTML/CSS/JS (no framework, fast and simple)
- **Database** — Supabase (free tier, PostgreSQL)
- **Email** — Resend (free tier, 3,000 emails/month)
- **Hosting** — Vercel (free tier, auto-deploys on git push)

---

## Project Structure

```
palymorf/
├── index.html                    # Main landing page + assessment
├── admin.html                    # Private admin dashboard
├── css/
│   └── styles.css                # All styles
├── js/
│   ├── questions.js              # 75 assessment questions data
│   ├── assessment.js             # Assessment engine + results
│   └── main.js                   # Nav, animations, contact form
├── api/
│   ├── submit.js                 # POST — saves submission + sends email
│   ├── submissions.js            # GET  — returns all submissions (admin)
│   └── submissions/[id]/note.js  # PATCH — saves admin note
├── .env.example                  # Environment variable template
├── .gitignore
├── vercel.json                   # Vercel configuration
└── README.md
```

---

## Setup — Step by Step

### 1. Supabase (database)

1. Go to [supabase.com](https://supabase.com) → create a free account
2. Click **New Project** → give it a name → set a database password → create
3. Once created, go to **SQL Editor** and run this to create the submissions table:

```sql
create table submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  answers jsonb,
  domain_scores jsonb,
  overall_score integer,
  tier text,
  flags jsonb,
  note text default '',
  created_at timestamptz default now()
);

-- Index for fast lookups
create index on submissions (created_at desc);
create index on submissions (email);
```

4. Go to **Project Settings → API**
5. Copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → this is your `SUPABASE_SERVICE_KEY`

---

### 2. Resend (email notifications)

1. Go to [resend.com](https://resend.com) → create a free account
2. Go to **API Keys** → create a new key
3. Copy the key → this is your `RESEND_API_KEY`
4. To send from `noreply@palymorf.com`, go to **Domains** → add `palymorf.com` → follow DNS setup
   - While testing, you can send from `onboarding@resend.dev` (their sandbox domain) for free

---

### 3. Environment Variables

**For local development:**
```bash
cp .env.example .env.local
# Edit .env.local and fill in your values
```

**For Vercel (production):**
1. Go to [vercel.com](https://vercel.com) → your project → **Settings → Environment Variables**
2. Add each variable from `.env.example` with your real values:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `RESEND_API_KEY`
   - `NOTIFY_EMAIL` (e.g. `sean@palymorf.com,wanda@palymorf.com`)
   - `ADMIN_PASSWORD` (choose something strong)

---

### 4. Deploy to Vercel

```bash
# In your project directory
git init
git add .
git commit -m "Initial Palymorf website"
git branch -M main
git remote add origin https://github.com/the-seanotaylor/palymorf-website.git
git push -u origin main
```

Then in Vercel:
1. **Add New Project** → import `palymorf-website` from GitHub
2. Add your environment variables (step 3 above)
3. Click **Deploy**

Every future `git push` to `main` auto-deploys.

---

### 5. Connect palymorf.com

1. Vercel dashboard → your project → **Settings → Domains**
2. Add `palymorf.com` and `www.palymorf.com`
3. Update DNS at your domain registrar with the records Vercel provides
4. DNS propagates in 5–30 minutes

---

## Admin Dashboard

Access at: `https://palymorf.com/admin`

**Default password:** set via `ADMIN_PASSWORD` environment variable

**Features:**
- View all submissions sorted by date
- See overall score, tier, and flags at a glance
- Search by name or email
- Filter by tier or flag type
- Click any row to open the full detail panel including all 75 answers
- Add and save pre-meeting notes per submission
- Export filtered results to CSV

**To change the admin password:** update `ADMIN_PASSWORD` in Vercel environment variables and redeploy.

---

## Contact Form

The contact form in `main.js` uses a placeholder. To connect a real handler:

**Option A — Formspree (easiest)**
1. Create account at [formspree.io](https://formspree.io)
2. Create a new form → copy your form ID
3. In `index.html`, update the form action or in `main.js` replace the `setTimeout` with:
```js
fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

---

## Local Development

No build tools needed:

```bash
# Option 1 — VS Code Live Server extension (recommended)
# Right-click index.html → Open with Live Server

# Option 2 — Node
npx serve .

# Option 3 — Python
python3 -m http.server 3000
```

Note: API routes (`/api/*`) require Vercel CLI for local testing:
```bash
npm i -g vercel
vercel dev
```

---

## License

&copy; 2026 Palymorf LLC. All rights reserved.
