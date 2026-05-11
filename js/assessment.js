/* ── ASSESSMENT ENGINE ─────────────────────── */

const answers = {};
let currentDomain = 0;
let userName = '';
let userEmail = '';

// ── START — no form, go straight into quiz ──
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('assessCover').classList.add('hidden');
  document.getElementById('assessQuiz').classList.remove('hidden');
  renderDomain(0);
});

// ── QUIZ ────────────────────────────────────
function renderDomain(idx) {
  currentDomain = idx;
  const d = DOMAINS[idx];
  document.getElementById('domEye').textContent = d.eye;
  document.getElementById('domTitle').textContent = d.title;
  document.getElementById('domDesc').textContent = d.desc;
  renderDomainNav();
  renderQuestions(d, idx);
  updateProgress();
  updateNavButtons();
  document.getElementById('assessment').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderDomainNav() {
  document.getElementById('domainNav').innerHTML = DOMAINS.map((d, i) => {
    const done = d.questions.every((_, qi) => answers[`${d.id}_${qi}`] !== undefined);
    const active = i === currentDomain;
    return `<button class="domain-btn${active ? ' active' : ''}${done && !active ? ' done' : ''}" onclick="renderDomain(${i})">${d.title}</button>`;
  }).join('');
}

function renderQuestions(d, idx) {
  document.getElementById('qWrap').innerHTML = d.questions.map((q, qi) => {
    const key = `${d.id}_${qi}`;
    const val = answers[key];
    const labels = q.labels || ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
    return `
      <div class="q-card${val !== undefined ? ' answered' : ''}${q.anchor ? ' anchor-q' : ''}" id="qcard_${key}">
        ${q.anchor ? '<div class="q-anchor-tag">Key question</div>' : ''}
        <div class="q-num">Q${idx * 15 + qi + 1} of 75</div>
        <div class="q-text">${q.text}</div>
        ${q.sub ? `<div class="q-subtext">${q.sub}</div>` : ''}
        <div class="q-scale">
          ${[1,2,3,4,5].map(v => `
            <div class="q-opt">
              <input type="radio" name="${key}" id="${key}_${v}" value="${v}"${val === v ? ' checked' : ''} onchange="setAnswer('${key}',${v})">
              <label for="${key}_${v}"><span class="q-val">${v}</span><span class="q-lbl">${labels[v-1]}</span></label>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function setAnswer(key, val) {
  answers[key] = parseInt(val);
  const card = document.getElementById(`qcard_${key}`);
  if (card) card.classList.add('answered');
  updateProgress();
  updateNavButtons();
  const domId = key.split('_')[0];
  const di = DOMAINS.findIndex(d => d.id === domId);
  if (di !== currentDomain) {
    const done = DOMAINS[di].questions.every((_, qi) => answers[`${domId}_${qi}`] !== undefined);
    if (done) document.getElementById('domainNav').querySelectorAll('.domain-btn')[di].classList.add('done');
  }
}

function updateProgress() {
  const total = Object.keys(answers).length;
  document.getElementById('progFill').style.width = `${Math.round(total / 75 * 100)}%`;
  document.getElementById('progCount').textContent = `${total} / 75`;
  document.getElementById('progDomain').textContent = `Domain ${currentDomain + 1} of 5`;
  const d = DOMAINS[currentDomain];
  const dAns = d.questions.filter((_, qi) => answers[`${d.id}_${qi}`] !== undefined).length;
  document.getElementById('qNavInfo').textContent = `${dAns} / 15 in this domain`;
}

function updateNavButtons() {
  document.getElementById('prevBtn').disabled = currentDomain === 0;
  const nb = document.getElementById('nextBtn');
  if (currentDomain === 4) {
    nb.textContent = 'View my score →';
    nb.onclick = showCaptureModal;
  } else {
    nb.textContent = 'Next →';
    nb.onclick = nextDomain;
  }
}

function nextDomain() { if (currentDomain < 4) renderDomain(currentDomain + 1); }
function prevDomain() { if (currentDomain > 0) renderDomain(currentDomain - 1); }

// ── EMAIL CAPTURE MODAL ─────────────────────
// Only shown AFTER all 75 questions are answered
function showCaptureModal() {
  document.getElementById('assessQuiz').classList.add('hidden');
  document.getElementById('captureModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('captureName').focus(), 100);

  document.getElementById('captureEmail').onkeydown = e => {
    if (e.key === 'Enter') handleCapture();
  };
  document.getElementById('captureSubmit').onclick = handleCapture;
}

function handleCapture() {
  const nameEl = document.getElementById('captureName');
  const emailEl = document.getElementById('captureEmail');
  const btn = document.getElementById('captureSubmit');

  nameEl.style.borderColor = '';
  emailEl.style.borderColor = '';

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();

  if (!name) { nameEl.style.borderColor = '#A32D2D'; nameEl.focus(); return; }
  if (!email || !email.includes('@') || !email.includes('.')) {
    emailEl.style.borderColor = '#A32D2D'; emailEl.focus(); return;
  }

  userName = name;
  userEmail = email;
  btn.textContent = 'Loading your score...';
  btn.disabled = true;

  setTimeout(() => {
    document.getElementById('captureModal').classList.add('hidden');
    showResults();
  }, 500);
}

// ── RESULTS ────────────────────────────────
async function showResults() {
  const domainScores = DOMAINS.map(d => {
    const raw = d.questions.reduce((s, _, qi) => s + (answers[`${d.id}_${qi}`] || 0), 0);
    return { id: d.id, raw, pct: Math.round(raw / 75 * 100) };
  });
  const overallRaw = domainScores.reduce((s, d) => s + d.raw, 0);
  const overallPct = Math.round(overallRaw / 375 * 100);
  const tier = getTier(overallPct);

  const flags = {
    time_money_gap: (answers['time_0'] || 3) >= 4 && (answers['time_1'] || 3) < 4,
    low_value_time: (answers['time_3'] || 3) <= 2,
    time_aligned:   (answers['time_0'] || 3) >= 4 && (answers['time_1'] || 3) >= 4
  };

  const resultsEl = document.getElementById('assessResults');
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = buildResultsHTML(
    overallPct, tier, domainScores,
    [...domainScores].sort((a, b) => b.pct - a.pct)[0],
    [...domainScores].sort((a, b) => a.pct - b.pct).slice(0, 2),
    flags
  );
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Save silently in background
  const domainScoresObj = {};
  domainScores.forEach(d => { domainScoresObj[d.id] = d.pct; });
  const answersObj = {};
  DOMAINS.forEach(d => {
    answersObj[d.id] = d.questions.map((q, qi) => ({ q: q.text, a: answers[`${d.id}_${qi}`] || 0 }));
  });

  try {
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName, email: userEmail,
        answers: answersObj, domain_scores: domainScoresObj,
        overall_score: overallPct, tier: tier.label, flags
      })
    });
  } catch (e) {
    console.warn('Could not save results:', e);
  }
}

// ── RESULTS HTML ───────────────────────────
function buildResultsHTML(pct, tier, domainScores, best, worst, flags) {
  const DC = { time:'#B8A06A', wealth:'#185FA5', identity:'#0F6E56', systems:'#8C6E2F', relationships:'#533BAA' };

  const cards = domainScores.map(d => `
    <div class="d-score-card">
      <div class="d-score-name">${cap(d.id)}</div>
      <div class="d-score-val" style="color:${DC[d.id]}">${d.pct}</div>
      <div class="d-score-track"><div class="d-score-fill-bar" style="width:${d.pct}%;background:${DC[d.id]}"></div></div>
    </div>`).join('');

  const tmHTML = flags.time_money_gap
    ? `<div class="flag-box"><div class="flag-tag">Critical flag — time vs. money gap detected</div><div class="flag-title">You say time. Your actions say money.</div><div class="flag-body">Your answers indicate you value your time — but your actual decisions consistently prioritize earning more over protecting the hours you have. You are trading the one thing that cannot be replaced for more of the one thing you already have enough of.</div></div>`
    : flags.time_aligned
    ? `<div class="insight-box" style="border-left:2px solid #0F6E56"><div class="insight-tag" style="color:#5DCAA5">Time alignment confirmed</div><div class="insight-title">Your values and your behavior are aligned on time.</div><div class="insight-body">You not only say time is your priority — your actual decisions reflect it. Rare at your income level.</div></div>`
    : '';

  const lvHTML = flags.low_value_time
    ? `<div class="flag-box"><div class="flag-tag">Wealth tax detected — low-value time use</div><div class="flag-title">You are doing work that should be delegated.</div><div class="flag-body">At your income level, every hour spent on low-value work is a decision to underpay yourself. This is one of the first things the Palymorf Life Audit eliminates.</div></div>`
    : '';

  const bestHTML = `<div class="insight-box" style="border-left:2px solid ${DC[best.id]}"><div class="insight-tag" style="color:${DC[best.id]}">Strongest domain — ${cap(best.id)}</div><div class="insight-title">Where you are already winning</div><div class="insight-body">${INSIGHT_MAP[best.id].str}</div></div>`;

  const worstHTML = worst.map(w => `<div class="insight-box" style="border-left:2px solid #A32D2D"><div class="insight-tag" style="color:#F09595">Priority gap — ${cap(w.id)} (${w.pct}/100)</div><div class="insight-title">Where to focus first</div><div class="insight-body">${INSIGHT_MAP[w.id].weak}</div></div>`).join('');

  return `
    <div class="results-hero">
      <div class="results-eye">Your Palymorf Wealth Readiness Score</div>
      <div class="results-ring">
        <div class="results-score">${pct}</div>
        <div class="results-denom">out of 100</div>
      </div>
      <div class="results-tier">${tier.label}</div>
      <div class="results-tagline">${tier.tagline}</div>
    </div>
    <div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(184,160,106,.7);font-weight:500;margin-bottom:.75rem">Domain breakdown</div>
    <div class="d-scores-grid">${cards}</div>
    <div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(184,160,106,.7);font-weight:500;margin-bottom:.75rem;margin-top:1.5rem">Your insights</div>
    ${tmHTML}${lvHTML}${bestHTML}${worstHTML}
    <div class="results-cta">
      <div class="results-cta-title">Your results have been saved, ${esc(userName)}.</div>
      <div class="results-cta-sub">The Palymorf team will reach out to <strong style="color:rgba(255,255,255,.75)">${esc(userEmail)}</strong> within 48 hours to discuss your score and what the Life Audit Intensive would look like for you specifically.</div>
      <button class="btn-gold" onclick="document.getElementById('offers').scrollIntoView({behavior:'smooth'})">Explore working with us &rarr;</button>
    </div>
    <div class="results-retake">
      <button class="btn-outline-light" onclick="retakeAssessment()">Retake assessment</button>
    </div>`;
}

function retakeAssessment() {
  Object.keys(answers).forEach(k => delete answers[k]);
  userName = ''; userEmail = ''; currentDomain = 0;
  ['assessResults','captureModal'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
    if (id === 'assessResults') document.getElementById(id).innerHTML = '';
  });
  document.getElementById('assessCover').classList.remove('hidden');
  document.getElementById('captureSubmit').disabled = false;
  document.getElementById('captureSubmit').textContent = 'View my score →';
  document.getElementById('assessment').scrollIntoView({ behavior: 'smooth' });
}

// ── HELPERS ────────────────────────────────
function getTier(pct) {
  if (pct >= 85) return { label: 'Wealth Ready',       tagline: 'You are operating at a high level across most domains. The gap between your success and your freedom is narrow — and closeable with the right moves.' };
  if (pct >= 70) return { label: 'High Potential',     tagline: 'You have built something significant. A few specific gaps are keeping you from fully living it. The blueprint is clear.' };
  if (pct >= 55) return { label: 'At the Threshold',   tagline: 'You are close — but something is leaking. Time, systems, or identity misalignment is costing you more than you realize.' };
  if (pct >= 40) return { label: 'Significant Gaps',   tagline: 'You have achieved success on paper but several domains need restructuring. The good news: the gaps are identifiable and fixable.' };
  return           { label: 'Rebuild Required',        tagline: 'Your success is real but your systems, identity, and structure are not keeping up with it. This is the most important moment to get clarity.' };
}

const INSIGHT_MAP = {
  time:          { str: 'Your time is genuinely protected — real boundaries and structures that most high earners never achieve.', weak: 'Time is your most urgent gap. You are likely running on someone else\'s calendar and sacrificing your own priorities every single day.' },
  wealth:        { str: 'Your wealth is working intelligently — multiple streams, proactive strategy, and assets that grow without your constant attention.', weak: 'Your wealth strategy has gaps quietly costing you compounding growth. Money sitting idle or assets that drain are silently expensive.' },
  identity:      { str: 'You have strong identity clarity — you know who you are becoming and your decisions reflect that alignment.', weak: 'Identity misalignment is the invisible tax on everything else. When who you are and how you live don\'t match, nothing feels like enough.' },
  systems:       { str: 'Your life runs on strong systems — things work without your constant presence, one of the rarest achievements at your level.', weak: 'Your life is running on personal effort rather than infrastructure. This is unsustainable and will either burn you out or cap your growth.' },
  relationships: { str: 'Your relationships are a genuine source of strength — you are known, supported, and surrounded by people who reflect your values.', weak: 'Relationship gaps at your level often go unnamed because everything looks fine externally. But isolation inside success is one of the most costly problems we see.' }
};

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function escapeHtml(s) { return esc(s); }
