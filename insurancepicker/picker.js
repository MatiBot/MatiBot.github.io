/* Build your year: emoji levels in, every plan ranked out. Nothing leaves the page. */
(function () {
  'use strict';
  const M = window.InsuranceDecision;
  const controls = document.getElementById('controls');
  const results = document.getElementById('results');
  const matrix = document.getElementById('matrix');
  if (!M || !controls || !results) return;
  const money = M.money;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const e = s => `<span class="e" aria-hidden="true">${s}</span>`;
  const state = {levels:{...M.presets[1].levels}, room:'private', cause:'illness', preset:'normal',
    moving:false, baby:'none', sort:{key:'year', dir:1}};
  let current = null;
  const usage = () => M.usageFrom(state.levels, state.room, state.cause, state.baby);
  const isNoPlan = p => p.id === 'oegk';
  const seg = (label, attr, options, value) => `<span class="seg" role="group" aria-label="${label}">${options.map(([v, text]) =>
    `<button type="button" data-${attr}="${v}" aria-pressed="${value === v}">${text}</button>`).join('')}</span>`;

  /* Controls */
  function levelRow(c) {
    const i = state.levels[c.key], l = c.levels[i];
    const hospital = c.key === 'hospital';
    const value = hospital && i && state.room === 'public' ? '€0 with ÖGK' : money(l[0]);
    return `<div class="lvl" data-key="${c.key}">
      <div class="lvl-top"><span class="lvl-ico">${e(c.emoji)}</span>
        <span class="lvl-txt"><strong id="lbl-${c.key}">${c.name}</strong><small>${c.hint}</small></span>
        <span class="lvl-val" aria-live="polite"><b>${esc(l[2])}</b><span>${value}</span></span></div>
      <div class="scale" role="radiogroup" aria-labelledby="lbl-${c.key}">
        <span class="scale-fill" style="width:calc((100% - 56px) * ${i / 4})"></span>
        ${c.levels.map((x, j) => `<button type="button" role="radio" class="lv${j <= i ? ' on' : ''}" data-i="${j}" aria-checked="${j === i}" tabindex="${j === i ? 0 : -1}" aria-label="${esc(x[2])}, ${money(x[0])}">${e(x[1])}</button>`).join('')}
      </div>
      ${hospital && i ? `<div class="opts">${seg('Room', 'room', [['private', '🛎️ Private room'], ['public', '🏥 Public ward']], state.room)}
        ${seg('Cause', 'cause', [['illness', '🤒 Illness'], ['accident', '🚑 Accident']], state.cause)}</div>
        <p class="note">${state.room === 'private' ? 'Example bill for a private room and doctor. In a public ward, ÖGK pays.' : 'ÖGK pays the public ward (plus a small daily fee). Some plans pay you cash per day.'}</p>` : ''}
    </div>`;
  }
  function babyRow() {
    const b = state.baby;
    const val = b === 'none' ? ['No', '€0'] : b === 'public' ? ['Public ward', '€0 with ÖGK'] : ['Private room', money(M.BIRTH.privateBill)];
    return `<div class="lvl"><div class="lvl-top"><span class="lvl-ico">${e('🤰')}</span>
        <span class="lvl-txt"><strong>Having a baby?</strong><small>Birth with ${M.BIRTH.days} nights in hospital</small></span>
        <span class="lvl-val" aria-live="polite"><b>${val[0]}</b><span>${val[1]}</span></span></div>
      <div class="opts">${seg('Having a baby', 'baby', [['none', 'No'], ['public', '🏥 Public ward'], ['private', '🛎️ Private room']], b)}</div>
      ${b === 'none' ? '' : `<p class="note">${b === 'private' ? `Example private bill: ${money(M.BIRTH.privateBill)}. ` : 'ÖGK pays a public-hospital birth; some plans pay you cash. '}Insurers only pay if the pregnancy starts after their waiting period: ${M.BIRTH.waitMonths} months at Generali.</p>`}
    </div>`;
  }
  function renderControls(focusSel) {
    controls.innerHTML = `<div class="panel-title"><h2>${e('🗓️')} Your year</h2></div>
      <p class="panel-sub">Tap a level for each kind of care, or try a year:</p>
      <div class="presets" role="group" aria-label="Example years">${M.presets.map(p =>
        `<button type="button" class="chip" data-preset="${p.id}" aria-pressed="${state.preset === p.id}">${e(p.emoji)}${p.name}</button>`).join('')}</div>
      ${M.care.map(levelRow).join('')}
      ${babyRow()}
      <div class="lvl"><div class="lvl-top"><span class="lvl-ico">${e('✈️')}</span>
        <span class="lvl-txt"><strong>Moving out of Austria?</strong><small>Austrian plans stay behind</small></span></div>
        <div class="opts">${seg('Moving out of Austria', 'move', [['no', '🏠 No'], ['yes', '🧳 Maybe']], state.moving ? 'yes' : 'no')}</div></div>
      <div class="bill-total"><span>${e('🧾')} Your bills, no insurance</span><strong>${money(M.bills(usage()))}</strong></div>`;
    if (focusSel) {
      const b = controls.querySelector(focusSel);
      if (b) { b.focus({preventScroll:true}); if (!reduceMotion && b.classList.contains('lv')) b.classList.add('pop'); }
    }
  }

  /* Ranking */
  const sub = r => {
    const p = r.plan, parts = [p.cover];
    if (state.moving) parts.unshift(M.portable(p) ? '🧳 Moves with you' : isNoPlan(p) ? '📍 Ends if you move' : '📍 Stays in Austria');
    if (p.monthly) parts.push(`${p.priceFloor ? 'from ' : ''}${money(p.monthly)}/mo`);
    if (r.cash) parts.push(`💵 ${money(r.cash)} back`);
    return parts.join(' · ');
  };
  const unknownNote = p => p.priceFloor
    ? 'Core plan price only: the outpatient module (doctors, medicines) and co-pays aren’t included.'
    : 'A published price example from another country. Excess and co-pays aren’t included.';
  function rowHtml(r, rank, max, none, winnerId) {
    const p = r.plan, isNone = isNoPlan(p), isTop = p.id === winnerId;
    const pay = Math.max(0, r.youPay - r.cash);
    const vs = Math.round(r.total - none.total);
    const val = r.unknown ? `${money(r.total)}+<small>${p.priceFloor ? '+ module & co-pays' : '+ co-pays'} ?</small>`
      : `${money(r.total)}<small class="${vs < 0 ? 'good' : ''}">${isNone ? 'baseline' : vs < 0 ? `${money(-vs)} less` : vs > 0 ? `${money(vs)} more` : 'same'}</small>`;
    return `<button type="button" class="row${isTop ? ' top' : ''}${isNone ? ' none' : ''}" data-id="${p.id}" aria-describedby="tip">
      <span class="r-rank">${isTop ? e('🏆') : isNone ? e('😬') : rank < 0 ? e('❓') : rank + 1}</span>
      <span class="r-name">${esc(p.short)}<small>${esc(sub(r))}</small></span>
      <span class="r-bar" aria-hidden="true">
        <span class="clip"><span class="seg-p" style="width:${r.premium / max * 100}%"></span><span class="seg-y" style="width:${pay / max * 100}%"></span>${r.unknown ? '<span class="seg-q"></span>' : ''}</span>
        <span class="base-line" style="left:${none.total / max * 100}%"></span></span>
      <span class="r-val">${val}</span></button>`;
  }
  function tipHtml(r) {
    const p = r.plan, none = current.none, vs = Math.round(r.total - none.total);
    const line = (k, label, v, cls = '') => `<div class="t-line ${cls}">${k}<span>${label}</span><b>${v}</b></div>`;
    const kinds = [['🧑‍⚕️', 'Doctors & tests', 'doctors'], ['💆', 'Therapy', 'therapy'], ['💊', 'Medicines', 'meds'], ['🏥', 'Hospital & birth', 'hospital']];
    const detail = kinds.filter(k => r.parts[k[2]] > 0).map(k => `<li><span>${e(k[0])} ${k[1]}</span><b>${money(r.parts[k[2]])}</b></li>`).join('');
    const verdict = isNoPlan(p) ? 'The baseline: €0 premiums, you pay every bill yourself.'
      : `${vs < 0 ? `${money(-vs)} less than no insurance` : vs > 0 ? `${money(vs)} more than no insurance` : 'Same as no insurance'}${r.unknown ? ', before co-pays' : ''}`;
    return `<div class="t-head"><b>${esc(p.short)}</b><span>${money(r.total)}${r.unknown ? '+' : ''} a year</span></div>
      ${line('<i class="k-prem"></i>', 'Premiums', money(r.premium))}
      <p class="t-small">${p.monthly ? `${p.priceFloor ? 'From ' : ''}${money(p.monthly, true)} × 12 months` : 'No private premiums'}</p>
      ${r.unknown ? line(e('❓'), 'Excess & co-pays', 'unknown') : line('<i class="k-pay"></i>', 'You still pay', money(r.youPay))}
      ${!r.unknown && detail ? `<ul class="t-list">${detail}</ul>` : ''}
      ${r.cash ? line(e('💵'), 'Cash paid to you', `−${money(r.cash)}`, 'good') : ''}
      ${isNoPlan(p) ? '' : line(e('🛡️'), 'Insurer pays', money(r.insurerPays))}
      ${line('<i class="k-base"></i>', 'No insurance', money(none.total))}
      <p class="t-verdict ${vs < 0 ? 'good' : ''}">${verdict}</p>
      ${r.unknown ? `<p class="t-small">${unknownNote(p)}</p>` : ''}
      <a class="t-link" href="#plan-${p.id}" data-goto="${p.id}">See all features ↓</a>`;
  }
  function renderResults() {
    const R = M.rank(usage());
    current = R;
    hideTip(true);
    const w = R.winner, wp = w.plan, none = R.none;
    const max = Math.max(1, ...R.rows.map(r => r.premium + Math.max(0, r.youPay - r.cash)), none.total) * 1.04;
    const cheaper = R.rows.filter(r => r.unknown && r.total < w.total);
    const save = isNoPlan(wp) ? `<strong>€0</strong><span>premiums</span>` : `<strong>${money(R.saving)}</strong><span>less than no insurance</span>`;
    const before = new Map([...results.querySelectorAll('.row')].map(el => [el.dataset.id, el.getBoundingClientRect().top]));
    let n = 0;
    results.innerHTML = `<div class="winner" aria-live="polite">
        <span class="trophy e" aria-hidden="true">${isNoPlan(wp) ? '🤷' : '🏆'}</span>
        <p class="w-label">Cheapest confirmed price for your year</p>
        <p class="w-name">${esc(wp.short)}</p>
        <p class="w-meta"><strong>${money(w.total)}</strong> a year · ${wp.monthly ? `${money(wp.monthly, true)}/month` : 'no premiums'}${wp.source.type === 'estimate' ? ' · estimated price' : ''}</p>
        <p class="w-save">${save}</p>
        <ul class="w-facts">${(isNoPlan(wp) ? ['🙌 Insurance doesn’t pay off for this year', ...wp.facts.slice(0, 2)] : wp.facts).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <a class="w-link" href="${wp.link.href}" target="_blank" rel="noreferrer">${esc(wp.link.label)} ↗</a></div>
      ${cheaper.length ? `<div class="maybe"><p class="maybe-title">${e('🌍')} Possibly much cheaper, if you qualify</p>
        <p class="maybe-sub">Not ranked first because their Austrian prices aren’t confirmed yet.</p>
        <ul>${cheaper.map(r => `<li><span><b>${esc(r.plan.short)}</b>${r.plan.priceFloor ? 'from ' : '≈ '}${money(r.total)} a year + ${r.plan.priceFloor ? 'outpatient module & co-pays' : 'co-pays'}</span><a href="${r.plan.link.href}" target="_blank" rel="noreferrer">Ask for a quote ↗</a></li>`).join('')}</ul></div>` : ''}
      ${state.moving ? `<p class="w-note">${e('✈️')} <strong>Moving abroad?</strong> Austrian plans only cover treatment in Austria once you live elsewhere. Generali lets you cancel at the end of the month you move. Cigna and Allianz Care move with you, if you’re eligible.</p>` : ''}
      <div class="rank-head" id="ranking"><h3>All plans for your year</h3>
        <p class="legend"><span><i class="k-prem"></i>Premiums</span><span><i class="k-pay"></i>You pay</span><span><i class="k-base"></i>No insurance</span></p></div>
      <p class="rank-tip">${e('👆')} <span class="hover-only">Hover over</span><span class="touch-only">Tap</span> a plan to see what’s in its bar.</p>
      <div class="rows">${R.rows.map(r => rowHtml(r, r.unknown ? -1 : n++, max, none, wp.id)).join('')}</div>
      <p class="rank-note">Per adult, per year. Plans pay back 80% of outpatient bills within their limits (the cautious case). Hospital and birth bills are examples.</p>`;
    if (!reduceMotion && before.size) {
      results.querySelectorAll('.row').forEach(el => {
        const dy = (before.get(el.dataset.id) ?? 0) - el.getBoundingClientRect().top;
        if (dy) el.animate([{transform:`translateY(${dy}px)`}, {transform:'none'}], {duration:420, easing:'cubic-bezier(.2,.8,.2,1)'});
      });
    }
    updateDock(wp, w.total);
    renderMatrix();
  }

  /* Breakdown popover: hover with a mouse, tap on touch, focus with a keyboard. */
  const tip = document.createElement('div');
  tip.id = 'tip'; tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  let tipFor = null, pinned = false, lastPointer = '';
  function showTip(row, pin) {
    const r = current.rows.find(x => x.plan.id === row.dataset.id);
    if (!r) return;
    tip.innerHTML = tipHtml(r);
    tip.hidden = false; tip.classList.toggle('pinned', pin);
    tipFor = row.dataset.id; pinned = pin;
    results.querySelectorAll('.row').forEach(x => x.classList.toggle('active', x === row));
    const rr = row.getBoundingClientRect(), bar = row.querySelector('.r-bar').getBoundingClientRect();
    const vw = document.documentElement.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
    const left = Math.min(Math.max(12, bar.left), vw - tw - 12);
    let top = rr.bottom + 8;
    if (top + th > window.innerHeight - 8 && rr.top - th - 8 > 8) top = rr.top - th - 8;
    tip.style.left = `${left + window.scrollX}px`; tip.style.top = `${top + window.scrollY}px`;
  }
  function hideTip(force) {
    if (pinned && !force) return;
    tip.hidden = true; tipFor = null; pinned = false;
    results.querySelectorAll('.row.active').forEach(x => x.classList.remove('active'));
  }
  function gotoPlan(id) {
    const tr = document.getElementById(`plan-${id}`);
    if (!tr) return;
    hideTip(true);
    tr.scrollIntoView({behavior:reduceMotion ? 'auto' : 'smooth', block:'center'});
    tr.classList.remove('flash'); void tr.offsetWidth; tr.classList.add('flash');
  }
  results.addEventListener('pointerdown', ev => { lastPointer = ev.pointerType; });
  results.addEventListener('pointerover', ev => {
    if (ev.pointerType !== 'mouse' || pinned) return;
    const row = ev.target.closest('.row');
    if (row) { if (tipFor !== row.dataset.id) showTip(row, false); } else hideTip();
  });
  results.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') hideTip(); });
  results.addEventListener('click', ev => {
    const row = ev.target.closest('.row');
    if (!row) return;
    const touch = lastPointer === 'touch' || lastPointer === 'pen';
    lastPointer = '';
    if (!touch) return gotoPlan(row.dataset.id);
    if (pinned && tipFor === row.dataset.id) hideTip(true); else showTip(row, true);
  });
  results.addEventListener('focusin', ev => {
    const row = ev.target.closest('.row');
    if (row && row.matches(':focus-visible')) showTip(row, false);
  });
  results.addEventListener('focusout', ev => { if (ev.target.closest('.row')) hideTip(); });
  tip.addEventListener('click', ev => { const a = ev.target.closest('[data-goto]'); if (a) { ev.preventDefault(); gotoPlan(a.dataset.goto); } });
  document.addEventListener('click', ev => { if (pinned && !tip.contains(ev.target) && !ev.target.closest('.row')) hideTip(true); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') hideTip(true); });
  window.addEventListener('resize', () => hideTip(true));

  /* Emoji chart, sortable */
  const cols = [
    {key:'year', emoji:'🧾', label:'Your year'}, {key:'price', emoji:'💶', label:'Per month'},
    {key:'doctors', emoji:'🧑‍⚕️', label:'Doctors & tests', icon:'🧑‍⚕️'}, {key:'hospital', emoji:'🏥', label:'Hospital', icon:'🏥'},
    {key:'meds', emoji:'💊', label:'Medicines', icon:'💊'}, {key:'therapy', emoji:'💆', label:'Therapy', icon:'💆'},
    {key:'baby', emoji:'🤰', label:'Pregnancy', icon:'👶'}, {key:'travel', emoji:'✈️', label:'Travel', icon:'✈️'},
    {key:'israel', emoji:'🇮🇱', label:'Israel', icon:'🛡️'}, {key:'usa', emoji:'🇺🇸', label:'USA', icon:'🛡️'},
    {key:'move', emoji:'🧳', label:'Move abroad', icon:'🧳'}];
  const srcIcon = {quote:'✅', estimate:'🔮', calc:'🧮', list:'📋', bench:'❓', none:'🏛️'};
  const meter = (n, ic) => n < 0 ? `<span class="meter zero" aria-label="Not stated">❔</span>`
    : n ? `<span class="meter" aria-label="${n} of 5">${ic.repeat(n)}<i>${ic.repeat(5 - n)}</i></span>` : `<span class="meter zero" aria-label="None">❌</span>`;
  function sorted() {
    const {key, dir} = state.sort;
    const total = id => current.rows.find(r => r.plan.id === id).total;
    const cmp = {
      name: (a, b) => a.short.localeCompare(b.short),
      year: (a, b) => total(a.id) - total(b.id),
      price: (a, b) => a.monthly - b.monthly
    }[key] || ((a, b) => (b.meter[key] - a.meter[key]) || (a.monthly - b.monthly));
    return [...M.plans].sort((a, b) => dir * cmp(a, b));
  }
  function renderMatrix() {
    if (!matrix || !current) return;
    const {key, dir} = state.sort;
    // Prices and names sort low-to-high first; features sort best-first (high-to-low).
    const order = k => (['year', 'price', 'name'].includes(k) ? 1 : -1) * (key === k ? dir : 0);
    const head = (k, inner) => `<th scope="col" aria-sort="${order(k) > 0 ? 'ascending' : order(k) < 0 ? 'descending' : 'none'}"><button type="button" data-sort="${k}">${inner}<span class="arrow" aria-hidden="true">${order(k) > 0 ? '▲' : order(k) < 0 ? '▼' : '↕'}</span></button></th>`;
    const winnerId = current.winner.plan.id, noneTotal = current.none.total;
    const rows = sorted().map(p => {
      const r = current.rows.find(x => x.plan.id === p.id);
      const vs = isNoPlan(p) ? 'baseline' : r.unknown ? '+ co-pays ?' : r.total < noneTotal ? `${money(noneTotal - r.total)} less` : `${money(r.total - noneTotal)} more`;
      return `<tr id="plan-${p.id}" class="${p.id === winnerId ? 'win' : ''}">
        <th scope="row">${p.id === winnerId ? '<span class="e cup" aria-label="Cheapest for your year">🏆 </span>' : ''}${esc(p.short)}<small>${esc(p.cover)}</small><a class="q-link" href="${p.link.href}" target="_blank" rel="noreferrer">${esc(p.link.label)} ↗</a></th>
        <td class="year" data-label="🧾 Your year">${money(r.total)}${r.unknown ? '+' : ''}<small>${vs}</small></td>
        <td class="price" data-label="💶 Per month">${p.monthly ? `${p.priceFloor ? 'from ' : p.benchmark || p.source.type === 'estimate' ? '≈ ' : ''}${money(p.monthly)}` : '€0'}<small>${e(srcIcon[p.source.type])} ${esc(p.source.label)}</small></td>
        ${cols.slice(2).map(c => `<td data-label="${c.emoji} ${c.label}">${meter(p.meter[c.key], c.icon)}<span class="cap">${esc(p.cells[c.key])}</span></td>`).join('')}</tr>`;
    }).join('');
    matrix.innerHTML = `<div class="sort-bar"><label for="sort-select">Sort by</label><select id="sort-select">
        ${[['year', '🧾 Your year (cheapest)'], ['price', '💶 Price per month'], ...cols.slice(2).map(c => [c.key, `${c.emoji} Best for ${c.label}`]), ['name', '🔤 Name']].map(([k, l]) => `<option value="${k}"${k === key ? ' selected' : ''}>${l}</option>`).join('')}
      </select></div>
      <div class="card matrix-wrap"><table class="matrix">
        <caption class="sr">All plans and their features. Select a column heading to sort.</caption>
        <thead><tr>${head('name', 'Plan')}${cols.map(c => head(c.key, `${e(c.emoji)}${c.label}`)).join('')}</tr></thead>
        <tbody>${rows}</tbody></table></div>`;
  }
  if (matrix) {
    matrix.addEventListener('click', ev => {
      const b = ev.target.closest('[data-sort]');
      if (!b) return;
      const k = b.dataset.sort;
      state.sort = {key:k, dir: state.sort.key === k ? -state.sort.dir : 1};
      renderMatrix();
      matrix.querySelector(`[data-sort="${k}"]`)?.focus({preventScroll:true});
    });
    matrix.addEventListener('change', ev => {
      if (ev.target.id !== 'sort-select') return;
      state.sort = {key:ev.target.value, dir:1};
      renderMatrix();
      matrix.querySelector('#sort-select')?.focus({preventScroll:true});
    });
  }

  /* Mobile dock: the current winner, while you scroll the controls and the ranking is off screen. */
  const dock = document.getElementById('dock');
  function updateDock(p, total) {
    if (!dock) return;
    dock.innerHTML = `${e(isNoPlan(p) ? '🤷' : '🏆')}<span><b>${esc(p.short)}</b>cheapest for your year</span><em>${money(total)}</em>`;
    syncDock();
  }
  let dockFrame = 0;
  function syncDock() {
    if (!dock || dockFrame) return;
    dockFrame = requestAnimationFrame(() => {
      dockFrame = 0;
      const c = controls.getBoundingClientRect(), r = results.getBoundingClientRect(), h = window.innerHeight;
      dock.classList.toggle('show', c.bottom > 0 && c.top < h && (r.top > h - 240 || r.bottom < 120));
    });
  }
  window.addEventListener('scroll', syncDock, {passive:true});
  window.addEventListener('resize', syncDock);

  /* Controls events */
  function setLevel(key, i) {
    state.levels[key] = i;
    state.preset = (M.presets.find(p => M.care.every(c => p.levels[c.key] === state.levels[c.key])) || {}).id || '';
    renderControls(`.lvl[data-key="${key}"] [data-i="${i}"]`);
    renderResults();
  }
  controls.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.i != null) return setLevel(b.closest('.lvl').dataset.key, Number(d.i));
    if (d.preset) { state.levels = {...M.presets.find(x => x.id === d.preset).levels}; state.preset = d.preset; }
    else if (d.move) state.moving = d.move === 'yes';
    else if (d.baby) state.baby = d.baby;
    else if (d.room) state.room = d.room;
    else if (d.cause) state.cause = d.cause;
    else return;
    const attr = Object.keys(d)[0];
    renderControls(`[data-${attr}="${d[attr]}"]`);
    renderResults();
  });
  controls.addEventListener('keydown', ev => {
    const b = ev.target.closest('.lv');
    if (!b) return;
    const step = {ArrowRight:1, ArrowUp:1, ArrowLeft:-1, ArrowDown:-1}[ev.key];
    if (!step && ev.key !== 'Home' && ev.key !== 'End') return;
    ev.preventDefault();
    setLevel(b.closest('.lvl').dataset.key, ev.key === 'Home' ? 0 : ev.key === 'End' ? 4 : Math.max(0, Math.min(4, Number(b.dataset.i) + step)));
  });

  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  renderControls();
  renderResults();
})();
