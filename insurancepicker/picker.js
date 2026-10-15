/* Quiz, result card and plan comparison. Answers never leave the page. */
(function () {
  'use strict';
  const M = window.InsuranceDecision;
  const quiz = document.getElementById('quiz');
  const compare = document.getElementById('compare');
  if (!M || !quiz) return;
  const money = M.money;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg = (d, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const icon = {
    hospital: svg('<path d="M3 20V9l9-5 9 5v11"/><path d="M9 20v-5h6v5"/><path d="M12 8v4M10 10h4"/>'),
    doctor: svg('<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M10 12v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="10" r="2"/>'),
    both: svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M15 7h2a2 2 0 0 1 2 2v2M9 17H7a2 2 0 0 1-2-2v-2"/>'),
    big: svg('<path d="M12 3l8 3v6c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    unsure: svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.5"/><path d="M12 17h.01"/>'),
    chevron: svg('<path d="M9 6l6 6-6 6"/>', 18),
    back: svg('<path d="M15 6l-6 6 6 6"/>', 18),
    warn: svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>', 20),
    ext: '<span aria-hidden="true">↗</span>'
  };

  const steps = [
    {key:'goal', title:'What do you want private insurance for?', sub:'Pick what matters most to you.', options:[
      ['hospital','A private hospital room','Twin room and your choice of doctor if you need an operation or a stay','hospital'],
      ['doctor','Private doctor bills paid back','Wahlarzt visits, scans and lab tests without paying it all yourself','doctor'],
      ['both','Both of these','Private hospital and private doctors in one plan','both'],
      ['big','Protection from huge bills','A serious illness, costly treatment or very expensive medicines','big'],
      ['unsure','Not sure yet','Help me work out whether I need it at all','unsure']]},
    {key:'spend', title:'How much do you spend on private doctors a year?', sub:'Private visits, scans and lab tests you pay yourself, per adult. A rough guess is fine.'},
    {key:'budget', title:'What’s the most you’d pay each month?', sub:'Per adult. Prices on this page are for a 40-year-old.', options:[
      ['b50','Under €50','Keep it cheap'],['b100','Up to €100','Doctor cover range'],
      ['b200','Up to €200','Includes private hospital'],['any','Price isn’t the issue','Show me the best cover']]},
    {key:'condition', title:'Any health condition or planned treatment?', sub:'Insurers ask before they accept you. It changes what they’ll cover.', options:[
      ['no','No','Nothing ongoing or planned'],['yes','Yes','Something ongoing, or a treatment is planned'],
      ['unsure','Not sure','For example, symptoms I haven’t had checked']]}
  ];
  const state = {step:0, goal:'', spend:1000, budget:'', condition:''};

  const visitsHint = v => v === 0 ? 'I don’t use private doctors' : `About ${Math.max(1, Math.round(v / 150))} private visit${Math.round(v / 150) > 1 ? 's' : ''} at around €150 each`;
  const pct = v => `${Math.min(100, v / 8000 * 100)}%`;
  const priceHtml = (p, big) => {
    if (p.monthly === 0) return `<strong>€0</strong> <span class="per">extra</span>`;
    if (p.monthly == null) return `<span class="per">from</span> <strong>${money(p.from)}</strong> <span class="per">/ month + outpatient</span>`;
    return `<strong>${p.estimate || p.benchmark ? '≈ ' : ''}${money(p.monthly, !p.benchmark)}</strong> <span class="per">/ month</span>`;
  };
  const planLink = p => {
    const n = p.next.find(x => x.href);
    return n ? `<a class="plan-link" href="${n.href}" rel="noreferrer" target="_blank">${p.id === 'oegk' ? 'ÖGK health check' : 'Get a quote'} ${icon.ext}</a>` : '';
  };

  function questionView(step) {
    const n = state.step + 1, total = steps.length;
    const head = `<div class="q-head">${state.step ? `<button type="button" class="q-back" data-back>${icon.back}<span>Back</span></button>` : ''}
      <div class="q-progress" role="progressbar" aria-label="Question ${n} of ${total}" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${n}"><span style="width:${n / total * 100}%"></span></div>
      <span class="q-count">${n} of ${total}</span></div>
      <h2 class="q-title" tabindex="-1" data-focus>${step.title}</h2><p class="q-sub">${step.sub}</p>`;
    if (step.key === 'spend') {
      return head + `<div class="spend">
        <output class="spend-value" id="spend-out" for="spend-range" aria-live="polite">${money(state.spend)}<span>a year</span></output>
        <p class="spend-hint" id="spend-hint">${visitsHint(state.spend)}</p>
        <input class="range" type="range" id="spend-range" min="0" max="8000" step="100" value="${state.spend}" style="--pct:${pct(state.spend)}" aria-label="Yearly private doctor bills" aria-valuetext="${money(state.spend)} a year">
        <div class="range-scale" aria-hidden="true"><span>€0</span><span>€8,000</span></div>
        <div class="chips" role="group" aria-label="Quick picks">${[0, 500, 1000, 2500, 5000].map(v =>
          `<button type="button" class="chip" data-spend="${v}" aria-pressed="${state.spend === v}">${v ? money(v) : 'Nothing'}</button>`).join('')}</div>
        <button type="button" class="btn" data-next>Continue ${icon.chevron}</button></div>`;
    }
    const withIcons = step.key === 'goal';
    return head + `<div class="q-options${withIcons ? '' : ' grid2'}">${step.options.map(([value, label, hint, ic]) =>
      `<button type="button" class="q-option" data-pick="${value}" aria-pressed="${state[step.key] === value}">
        ${withIcons ? `<span class="q-icon">${icon[ic]}</span>` : ''}<span class="q-text"><strong>${label}</strong><small>${hint}</small></span>
        <span class="q-chev">${icon.chevron}</span></button>`).join('')}</div>`;
  }

  function bars(rows) {
    const max = Math.max(1, ...rows.map(r => r.total));
    return `<div class="bars">${rows.map(r => `<div><div class="bar-label"><span>${esc(r.label)}</span><strong>${money(r.total)}</strong></div>
      <div class="track" role="img" aria-label="${esc(r.label)}: ${money(r.premium)} premiums and ${money(r.youPay)} of bills you pay, ${money(r.total)} in total">
      <span class="seg prem" style="width:${r.premium / max * 100}%"></span><span class="seg pay" style="width:${r.youPay / max * 100}%"></span></div></div>`).join('')}</div>
      <p class="legend"><span><i class="k-prem"></i>Premiums</span><span><i class="k-pay"></i>Doctor bills you still pay</span></p>`;
  }

  function yearView(r) {
    const bill = r.answers.spend;
    let plan = r.primary;
    if (plan.id === 'oegk') plan = r.alternatives.find(p => p.monthly > 0 && !p.benchmark);
    const self = {label:'Pay doctors yourself', premium:0, youPay:bill, total:bill};
    if (!plan) return '';
    const c = M.yearCost(plan, bill);
    const diff = Math.round(self.total - c.total);
    let delta;
    if (r.primary.id === 'oegk') delta = `<p class="delta">${diff >= 0 ? `${plan.insurer} ${plan.name} would save about ${money(diff)}` : `Insurance would cost you about ${money(-diff)} more`} a year</p>`;
    else if (diff >= 0) delta = `<p class="delta good">You come out about ${money(diff)} ahead a year</p>`;
    else if (plan.hospital === 'full' || plan.hospital === 'accident') delta = `<p class="delta">Private hospital cover costs you about ${money(-diff)} a year, after doctor refunds</p>`;
    else delta = `<p class="delta">About ${money(-diff)} a year more than paying yourself</p>`;
    return `<div class="side"><h3>Your year, roughly</h3>${bars([self, {label:`With ${plan.insurer} ${plan.name}`, ...c}])}${delta}
      <p class="fine">At ${money(bill)} of private doctor bills, assuming 80% is paid back. If ÖGK refunds part of a bill, Generali pays 100% of the rest, so you may do better.</p></div>`;
  }

  function resultView() {
    const r = M.match(state);
    const p = r.primary;
    const badge = r.fit === 'match' ? ['', 'Your best match'] : r.fit === 'partial' ? ['partial', 'Closest fit for your budget'] : ['none', 'Our suggestion'];
    const nextHtml = r.next.map(n => `<li>${esc(n.text)}${n.href ? ` <a href="${n.href}" rel="noreferrer" target="_blank">${esc(n.label)} ${icon.ext}</a>` : ''}</li>`).join('');
    const notes = r.notes.map(n => `<div class="note" role="note">${icon.warn}<p><strong>${esc(n.title)}</strong>${esc(n.text)}</p></div>`).join('');
    const alts = r.alternatives.map(a => {
      const c = a.monthly > 0 && !a.benchmark ? M.yearCost(a, state.spend) : null;
      return `<a class="alt" href="#plan-${a.id}"><small>${esc(a.insurer)}</small><strong>${esc(a.name)}</strong>
        <p class="alt-price">${a.monthly === 0 ? '€0 extra' : a.monthly == null ? `from ${money(a.from)} / month` : `${a.estimate || a.benchmark ? '≈ ' : ''}${money(a.monthly, !a.benchmark)} / month`}</p>
        <p>${c ? `${money(c.total)} a year at your bills` : esc(a.tagline)}</p></a>`;
    }).join('');
    const title = p.id === 'oegk' ? r.headline : p.name;
    return `<div class="r-top"><span class="badge ${badge[0]}">${badge[1]}</span><button type="button" class="linkbtn" data-restart>Start over</button></div>
      <div class="r-grid"><div>
        <p class="r-insurer">${p.id === 'oegk' ? 'Keep ÖGK, pay as you go' : esc(p.insurer)}</p>
        <h2 class="r-name" tabindex="-1" data-focus>${esc(title)}</h2>
        <p class="r-price">${priceHtml(p)} <span class="tag ${p.estimate ? 'est' : ''}">${esc(p.source)}</span></p>
        ${p.accident ? `<p class="r-small">Generali’s quote also adds optional accident insurance for ${money(p.accident, true)} a month.</p>` : ''}
        <p class="r-why">${esc(r.why)}</p>
        <div class="lists"><div><h3>What you get</h3><ul class="ticks">${p.covers.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h3>Watch out for</h3><ul class="flags">${p.gaps.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
        ${notes}
      </div><div>${yearView(r)}<div class="side"><h3>Next steps</h3><ol class="steps">${nextHtml}</ol></div></div></div>
      ${alts ? `<div class="alts-head"><h3>Also worth a look</h3></div><div class="alts">${alts}</div>` : ''}
      <div class="r-foot"><p>Prices are per adult per month, before the insurer’s health check. Couples get 5% off at Generali for 3 years (already included); children need their own quote.</p>
      <a class="btn ghost" href="#full-comparison">Compare all plans</a></div>`;
  }

  function render(moveFocus) {
    const done = state.step >= steps.length;
    quiz.classList.toggle('is-result', done);
    quiz.innerHTML = done ? resultView() : questionView(steps[state.step]);
    if (!moveFocus) return;
    const heading = quiz.querySelector('[data-focus]');
    if (heading) heading.focus({preventScroll:true});
    const top = quiz.getBoundingClientRect().top;
    if (top < 60 || top > window.innerHeight * .5) quiz.scrollIntoView({behavior:reduceMotion ? 'auto' : 'smooth', block:'start'});
  }
  function go(step) {
    state.step = step;
    if (step >= steps.length) setCompareSpend(state.spend);
    render(true);
  }
  function setSpend(v) {
    state.spend = Math.max(0, Math.min(8000, Number(v) || 0));
    const out = quiz.querySelector('#spend-out'), range = quiz.querySelector('#spend-range');
    if (out) out.innerHTML = `${money(state.spend)}<span>a year</span>`;
    const hint = quiz.querySelector('#spend-hint');
    if (hint) hint.textContent = visitsHint(state.spend);
    if (range) { range.value = state.spend; range.style.setProperty('--pct', pct(state.spend)); range.setAttribute('aria-valuetext', `${money(state.spend)} a year`); }
    quiz.querySelectorAll('[data-spend]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.spend) === state.spend)));
  }

  quiz.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t || !quiz.contains(t)) return;
    if (t.hasAttribute('data-pick')) {
      const key = steps[state.step].key;
      state[key] = t.dataset.pick;
      quiz.querySelectorAll('[data-pick]').forEach(b => b.setAttribute('aria-pressed', String(b === t)));
      setTimeout(() => go(state.step + 1), reduceMotion ? 0 : 160);
    } else if (t.hasAttribute('data-spend')) setSpend(t.dataset.spend);
    else if (t.hasAttribute('data-next')) go(state.step + 1);
    else if (t.hasAttribute('data-back')) go(state.step - 1);
    else if (t.hasAttribute('data-restart')) { Object.assign(state, {goal:'', budget:'', condition:''}); go(0); }
  });
  quiz.addEventListener('input', e => { if (e.target.id === 'spend-range') setSpend(e.target.value); });

  /* Comparison */
  const cmp = {spend:1000, filter:'all'};
  const filters = {
    all: () => true,
    doctor: p => p.kind === 'doctor' || p.id === 'oegk',
    hospital: p => p.hospital === 'full' || p.hospital === 'accident',
    international: p => p.kind === 'international'
  };
  const featureRows = [['doctor', 'Private doctors & scans'], ['hospital', 'Hospital'], ['medicines', 'Medicines'], ['therapy', 'Therapy'], ['travel', 'Travel']];
  function tone(p, key) {
    if (!p.features[key]) return 'no';
    if (key === 'hospital') return p.hospital === 'full' || p.hospital === 'world' ? 'yes' : 'part';
    if (key === 'doctor') return p.doctor ? 'yes' : 'part';
    if (key === 'medicines') return p.kind === 'international' || p.id === 'oegk' ? 'yes' : 'part';
    return p.id === 'oegk' ? 'part' : 'yes';
  }
  const mark = {yes:'✓', part:'~', no:'✕'};

  function renderChart() {
    const rows = M.plans.filter(p => !p.benchmark).map(p => ({p, ...M.yearCost(p, cmp.spend)}))
      .sort((a, b) => a.total - b.total || a.p.monthly - b.p.monthly);
    const max = Math.max(1, ...rows.map(r => r.total));
    compare.querySelector('#chart-rows').innerHTML = rows.map((r, i) => `<a class="crow${i ? '' : ' best'}" href="#plan-${r.p.id}">
      <span class="crow-name">${esc(r.p.short)}${i ? '' : '<em>Cheapest for you</em>'}<small>${esc(r.p.cover)}${r.p.estimate ? ' · estimated price' : ''}</small></span>
      <span class="track" role="img" aria-label="${money(r.premium)} premiums plus ${money(r.youPay)} of bills you pay"><span class="seg prem" style="width:${r.premium / max * 100}%"></span><span class="seg pay" style="width:${r.youPay / max * 100}%"></span></span>
      <span class="crow-val">${money(r.total)}</span></a>`).join('');
  }
  function renderPlans() {
    const list = M.plans.filter(filters[cmp.filter]);
    compare.querySelector('#plans').innerHTML = list.map(p => {
      const c = p.monthly > 0 && !p.benchmark ? M.yearCost(p, cmp.spend) : p.id === 'oegk' ? M.yearCost(p, cmp.spend) : null;
      return `<article class="plan card" id="plan-${p.id}"><p class="plan-insurer">${esc(p.insurer)}</p><h3>${esc(p.name)}</h3>
        <p class="plan-tagline">${esc(p.tagline)}</p><p class="plan-price">${priceHtml(p)}</p>
        ${p.accident ? `<p class="plan-extra">Quote also adds optional accident insurance: +${money(p.accident, true)}</p>` : ''}
        <span class="tag ${p.estimate ? 'est' : ''}">${esc(p.source)}</span>
        <dl class="feat">${featureRows.map(([k, label]) => { const t = tone(p, k);
          return `<div class="${t}"><i aria-hidden="true">${mark[t]}</i><dt>${label}</dt><dd>${esc(p.features[k] || 'Not included')}</dd></div>`; }).join('')}</dl>
        <div class="plan-year">${c ? `<span>Your year at ${money(cmp.spend)} of bills</span><strong>${money(c.total)}</strong>` : '<span>Yearly cost depends on your excess and co-pays</span>'}</div>
        ${planLink(p)}</article>`;
    }).join('');
  }
  function setCompareSpend(v) {
    if (!compare) return;
    cmp.spend = v;
    const range = compare.querySelector('#cmp-spend');
    range.value = v; range.style.setProperty('--pct', pct(v)); range.setAttribute('aria-valuetext', `${money(v)} a year`);
    compare.querySelector('#cmp-spend-out').textContent = money(v);
    compare.querySelectorAll('.cmp-bill').forEach(el => { el.textContent = money(v); });
    renderChart(); renderPlans();
  }
  if (compare) {
    compare.querySelector('#cmp-spend').addEventListener('input', e => setCompareSpend(Number(e.target.value)));
    compare.querySelector('#cmp-filter').addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      cmp.filter = b.dataset.filter;
      compare.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderPlans();
    });
    // A link to a plan card that the current filter hides shows every plan first.
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#plan-"]');
      if (!a || document.getElementById(a.getAttribute('href').slice(1))) return;
      cmp.filter = 'all';
      compare.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filter === 'all')));
      renderPlans();
    });
    compare.hidden = false;
    setCompareSpend(cmp.spend);
  }

  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  render(false);
  if (location.hash && location.hash.startsWith('#plan-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
})();
