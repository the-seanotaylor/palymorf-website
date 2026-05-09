/* ── ASSESSMENT ENGINE ─────────────────────── */
const answers = {};
let currentDomain = 0;

function startAssessment() {
  document.getElementById('assessCover').classList.add('hidden');
  document.getElementById('assessQuiz').classList.remove('hidden');
  renderDomain(0);
}

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
  window.scrollTo({ top: document.getElementById('assessment').offsetTop - 80, behavior: 'smooth' });
}

function renderDomainNav() {
  const nav = document.getElementById('domainNav');
  nav.innerHTML = DOMAINS.map((d, i) => {
    const done = d.questions.every((_, qi) => answers[`${d.id}_${qi}`] !== undefined);
    const active = i === currentDomain;
    let cls = 'domain-btn';
    if (active) cls += ' active';
    else if (done) cls += ' done';
    return `<button class="${cls}" onclick="renderDomain(${i})">${d.title}</button>`;
  }).join('');
}

function renderQuestions(d, idx) {
  const qOffset = idx * 15;
  const wrap = document.getElementById('qWrap');
  wrap.innerHTML = d.questions.map((q, qi) => {
    const key = `${d.id}_${qi}`;
    const val = answers[key];
    const labels = q.labels || ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
    const isAnchor = q.anchor || false;

    return `
      <div class="q-card${val !== undefined ? ' answered' : ''}${isAnchor ? ' anchor-q' : ''}" id="qcard_${key}">
        ${isAnchor ? '<div class="q-anchor-tag">Key question</div>' : ''}
        <div class="q-num">Q${qOffset + qi + 1} of 75</div>
        <div class="q-text">${q.text}</div>
        ${q.sub ? `<div class="q-subtext">${q.sub}</div>` : ''}
        <div class="q-scale">
          ${[1, 2, 3, 4, 5].map(v => `
            <div class="q-opt">
              <input type="radio" name="${key}" id="${key}_${v}" value="${v}"${val === v ? ' checked' : ''} onchange="setAnswer('${key}', ${v})">
              <label for="${key}_${v}">
                <span class="q-val">${v}</span>
                <span class="q-lbl">${labels[v - 1]}</span>
              </label>
            </div>
          `).join('')}
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
  refreshDomainTab(key.split('_')[0]);
}

function refreshDomainTab(domId) {
  const di = DOMAINS.findIndex(d => d.id === domId);
  if (di === currentDomain) return;
  const done = DOMAINS[di].questions.every((_, qi) => answers[`${domId}_${qi}`] !== undefined);
  const btns = document.getElementById('domainNav').querySelectorAll('.domain-btn');
  if (done) btns[di].classList.add('done');
}

function updateProgress() {
  const total = Object.keys(answers).length;
  const pct = Math.round(total / 75 * 100);
  document.getElementById('progFill').style.width = `${pct}%`;
  document.getElementById('progCount').textContent = `${total} / 75`;
  document.getElementById('progDomain').textContent = `Domain ${currentDomain + 1} of 5`;

  const d = DOMAINS[currentDomain];
  const dAnswered = d.questions.filter((_, qi) => answers[`${d.id}_${qi}`] !== undefined).length;
  document.getElementById('qNavInfo').textContent = `${dAnswered} / 15 in this domain`;
}

function updateNavButtons() {
  document.getElementById('prevBtn').disabled = currentDomain === 0;
  const nextBtn = document.getElementById('nextBtn');
  if (currentDomain === 4) {
    nextBtn.textContent = 'View my score →';
    nextBtn.onclick = showResults;
  } else {
    nextBtn.textContent = 'Next →';
    nextBtn.onclick = nextDomain;
  }
}

function nextDomain() { if (currentDomain < 4) renderDomain(currentDomain + 1); }
function prevDomain() { if (currentDomain > 0) renderDomain(currentDomain - 1); }

/* ── RESULTS ENGINE ────────────────────────── */
function showResults() {
  document.getElementById('assessQuiz').classList.add('hidden');
  const resultsEl = document.getElementById('assessResults');
  resultsEl.classList.remove('hidden');

  const domainScores = DOMAINS.map(d => {
    const raw = d.questions.reduce((sum, _, qi) => sum + (answers[`${d.id}_${qi}`] || 0), 0);
    return { ...d, raw, pct: Math.round(raw / 75 * 100) };
  });

  const overallRaw = domainScores.reduce((s, d) => s + d.raw, 0);
  const overallPct = Math.round(overallRaw / 375 * 100);

  const tier = getTier(overallPct);
  const best = [...domainScores].sort((a, b) => b.pct - a.pct)[0];
  const worst = [...domainScores].sort((a, b) => a.pct - b.pct).slice(0, 2);

  const t1 = answers['time_0'] || 3;
  const t2 = answers['time_1'] || 3;
  const t4 = answers['time_3'] || 3;
  const saysTime = t1 >= 4;
  const actsTime = t2 >= 4;
  const lowVal = t4 <= 2;
  const timeMoneyGap = saysTime && !actsTime;

  resultsEl.innerHTML = buildResultsHTML(overallPct, tier, domainScores, best, worst, timeMoneyGap, saysTime, actsTime, lowVal);
}

function getTier(pct) {
  if (pct >= 85) return { label: 'Wealth Ready', tagline: 'You are operating at a high level across most domains. The gap between your success and your freedom is narrow — and closeable with the right moves.' };
  if (pct >= 70) return { label: 'High Potential', tagline: 'You have built something significant. A few specific gaps are keeping you from fully living it. The blueprint is clear.' };
  if (pct >= 55) return { label: 'At the Threshold', tagline: 'You are close — but something is leaking. Time, systems, or identity misalignment is costing you more than you realize.' };
  if (pct >= 40) return { label: 'Significant Gaps', tagline: 'You have achieved success on paper but several domains need restructuring. The good news: the gaps are identifiable and fixable.' };
  return { label: 'Rebuild Required', tagline: 'Your success is real but your systems, identity, and structure are not keeping up with it. This is the most important moment to get clarity.' };
}

const INSIGHT_MAP = {
  time: {
    str: 'Your time is genuinely protected — real boundaries and structures that most high earners never achieve.',
    weak: 'Time is your most urgent gap. You are likely running on someone else\'s calendar and sacrificing your own priorities every single day.'
  },
  wealth: {
    str: 'Your wealth is working intelligently — multiple streams, proactive strategy, and assets that grow without your constant attention.',
    weak: 'Your wealth strategy has gaps quietly costing you compounding growth. Money sitting idle or assets that drain are silently expensive.'
  },
  identity: {
    str: 'You have strong identity clarity — you know who you are becoming and your decisions reflect that alignment.',
    weak: 'Identity misalignment is the invisible tax on everything else. When who you are and how you live don\'t match, nothing feels like enough.'
  },
  systems: {
    str: 'Your life runs on strong systems — things work without your constant presence, one of the rarest achievements at your level.',
    weak: 'Your life is running on personal effort rather than infrastructure. This is unsustainable and will either burn you out or cap your growth.'
  },
  relationships: {
    str: 'Your relationships are a genuine source of strength — you are known, supported, and surrounded by people who reflect your values.',
    weak: 'Relationship gaps at your level often go unnamed because everything looks fine externally. But isolation inside success is one of the most costly problems we see.'
  }
};

function buildResultsHTML(pct, tier, domainScores, best, worst, timeMoneyGap, saysTime, actsTime, lowVal) {
  const domainScoreCards = domainScores.map(d => `
    <div class="d-score-card">
      <div class="d-score-name">${d.title}</div>
      <div class="d-score-val" style="color:${d.color}">${d.pct}</div>
      <div class="d-score-track">
        <div class="d-score-fill-bar" style="width:${d.pct}%;background:${d.color}"></div>
      </div>
    </div>`).join('');

  const timeMoneyHTML = timeMoneyGap
    ? `<div class="flag-box">
        <div class="flag-tag">Critical flag — time vs. money gap detected</div>
        <div class="flag-title">You say time. Your actions say money.</div>
        <div class="flag-body">Your answers indicate you value your time — but your actual decisions consistently prioritize earning more over protecting the hours you have. You are trading the one thing that cannot be replaced for more of the one thing you already have enough of.</div>
      </div>`
    : (saysTime && actsTime
      ? `<div class="insight-box" style="border-left:2px solid #0F6E56">
          <div class="insight-tag" style="color:#5DCAA5">Time alignment confirmed</div>
          <div class="insight-title">Your values and your behavior are aligned on time.</div>
          <div class="insight-body">You not only say time is your priority — your actual decisions reflect it. This is rare at your income level and is the foundation everything else is built on.</div>
        </div>`
      : '');

  const lowValHTML = lowVal
    ? `<div class="flag-box">
        <div class="flag-tag">Wealth tax detected — low-value time use</div>
        <div class="flag-title">You are doing work that should be delegated.</div>
        <div class="flag-body">You are regularly spending time on tasks someone else should be handling. At your income level, every hour spent on low-value work is a decision to underpay yourself. This is one of the first things the Palymorf Life Audit eliminates.</div>
      </div>`
    : '';

  const bestHTML = `
    <div class="insight-box" style="border-left:2px solid ${best.color}">
      <div class="insight-tag" style="color:${best.color}">Strongest domain — ${best.title}</div>
      <div class="insight-title">Where you are already winning</div>
      <div class="insight-body">${INSIGHT_MAP[best.id].str}</div>
    </div>`;

  const worstHTML = worst.map(w => `
    <div class="insight-box" style="border-left:2px solid #A32D2D">
      <div class="insight-tag" style="color:#F09595">Priority gap — ${w.title} (${w.pct}/100)</div>
      <div class="insight-title">Where to focus first</div>
      <div class="insight-body">${INSIGHT_MAP[w.id].weak}</div>
    </div>`).join('');

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

    <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(184,160,106,0.7);font-weight:500;margin-bottom:0.75rem;">Domain breakdown</div>
    <div class="d-scores-grid">${domainScoreCards}</div>

    <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(184,160,106,0.7);font-weight:500;margin-bottom:0.75rem;margin-top:1.5rem;">Your insights</div>

    ${timeMoneyHTML}
    ${lowValHTML}
    ${bestHTML}
    ${worstHTML}

    <div class="results-cta">
      <div class="results-cta-title">Ready to see the full blueprint?</div>
      <div class="results-cta-sub">The Palymorf Life Audit Intensive takes everything this score revealed and builds a complete Life Redesign Blueprint — specific, actionable, and built around your exact gaps. One weekend. Total clarity.</div>
      <button class="btn-gold" onclick="document.getElementById('offers').scrollIntoView({behavior:'smooth'})">Explore working with us &rarr;</button>
    </div>

    <div class="results-retake">
      <button class="btn-outline-light" onclick="retakeAssessment()">Retake assessment</button>
    </div>`;
}

function retakeAssessment() {
  Object.keys(answers).forEach(k => delete answers[k]);
  document.getElementById('assessResults').classList.add('hidden');
  document.getElementById('assessResults').innerHTML = '';
  document.getElementById('assessCover').classList.remove('hidden');
  window.scrollTo({ top: document.getElementById('assessment').offsetTop - 80, behavior: 'smooth' });
}
