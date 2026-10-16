/* Build your year: emoji levels in, every plan ranked out. Nothing leaves the page. */
(function () {
  'use strict';
  const M = window.InsuranceDecision;
  const controls = document.getElementById('controls');
  const results = document.getElementById('results');
  if (!M || !controls || !results) return;
  const money = M.money;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const e = s => `<span class="e" aria-hidden="true">${s}</span>`;
  const state = {levels:{...M.presets[1].levels}, room:'private', cause:'illness', preset:'normal', moving:false};

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
      ${hospital && i ? `<div class="hosp-opts">
        <span class="seg" role="group" aria-label="Room"><button type="button" data-room="private" aria-pressed="${state.room === 'private'}">🛎️ Private room</button><button type="button" data-room="public" aria-pressed="${state.room === 'public'}">🏥 Public ward</button></span>
        <span class="seg" role="group" aria-label="Cause"><button type="button" data-cause="illness" aria-pressed="${state.cause === 'illness'}">🤒 Illness</button><button type="button" data-cause="accident" aria-pressed="${state.cause === 'accident'}">🚑 Accident</button></span></div>
        <p class="hosp-note">${state.room === 'private' ? 'Example bill for a private room and doctor. In a public ward, ÖGK pays.' : 'ÖGK pays the public ward (plus a small daily fee). Some plans pay you cash per day.'}</p>` : ''}
    </div>`;
  }
  function renderControls(focusKey, focusIndex) {
    const u = M.usageFrom(state.levels, state.room, state.cause);
    controls.innerHTML = `<div class="panel-title"><h2>${e('🗓️')} Your year</h2></div>
      <p class="panel-sub">Tap a level for each kind of care, or try a year:</p>
      <div class="presets" role="group" aria-label="Example years">${M.presets.map(p =>
        `<button type="button" class="chip" data-preset="${p.id}" aria-pressed="${state.preset === p.id}">${e(p.emoji)}${p.name}</button>`).join('')}</div>
      ${M.care.map(levelRow).join('')}
      <div class="lvl"><div class="lvl-top"><span class="lvl-ico">${e('✈️')}</span>
        <span class="lvl-txt"><strong>Moving out of Austria?</strong><small>Austrian plans stay behind</small></span>
        <span class="seg" role="group" aria-label="Moving out of Austria"><button type="button" data-move="no" aria-pressed="${!state.moving}">🏠 No</button><button type="button" data-move="yes" aria-pressed="${state.moving}">🧳 Maybe</button></span></div></div>
      <div class="bill-total"><span>${e('🧾')} Your bills, no insurance</span><strong>${money(M.bills(u))}</strong></div>`;
    if (focusKey) {
      const b = controls.querySelector(`.lvl[data-key="${focusKey}"] [data-i="${focusIndex}"]`);
      if (b) { b.focus({preventScroll:true}); if (!reduceMotion) b.classList.add('pop'); }
    }
  }

  /* Ranking */
  const sub = r => {
    const p = r.plan;
    const parts = [p.cover];
    if (state.moving) parts.unshift(M.portable(p) ? '🧳 Moves with you' : p.id === 'oegk' ? '📍 Ends if you move' : '📍 Stays in Austria');
    if (p.monthly) parts.push(`${p.priceFloor ? 'from ' : ''}${money(p.monthly)}/mo`);
    if (r.cash) parts.push(`💵 ${money(r.cash)} back`);
    return parts.join(' · ');
  };
  function rowHtml(r, i, max, none, winnerId) {
    const p = r.plan, isNone = p.id === 'oegk', isTop = p.id === winnerId;
    const pay = Math.max(0, r.youPay - r.cash);
    const vs = Math.round(r.total - none.total);
    const val = r.unknown ? `${money(r.total)}+<small>+ co-pays ?</small>`
      : `${money(r.total)}<small class="${vs < 0 ? 'good' : ''}">${isNone ? 'baseline' : vs < 0 ? `${money(-vs)} less` : vs > 0 ? `${money(vs)} more` : 'same'}</small>`;
    return `<a class="row${isTop ? ' top' : ''}${isNone ? ' none' : ''}" href="#plan-${p.id}" data-id="${p.id}">
      <span class="r-rank">${isTop ? e('🏆') : isNone ? e('😬') : i < 0 ? e('❓') : i + 1}</span>
      <span class="r-name">${esc(p.short)}<small>${esc(sub(r))}</small></span>
      <span class="r-bar" role="img" aria-label="${esc(p.short)}: ${money(r.premium)} premiums, ${money(pay)} you pay${r.unknown ? ', plus unknown co-pays' : ''}">
        <span class="clip"><span class="seg-p" style="width:${r.premium / max * 100}%"></span><span class="seg-y" style="width:${pay / max * 100}%"></span>${r.unknown ? '<span class="seg-q"></span>' : ''}</span>
        <span class="base-line" style="left:${none.total / max * 100}%"></span></span>
      <span class="r-val">${val}</span></a>`;
  }
  function renderResults() {
    const u = M.usageFrom(state.levels, state.room, state.cause);
    const R = M.rank(u);
    const w = R.winner, wp = w.plan, none = R.none;
    const max = Math.max(1, ...R.rows.map(r => r.premium + Math.max(0, r.youPay - r.cash)), none.total) * 1.04;
    const cheaperBench = R.rows.filter(r => r.unknown && r.total < w.total).map(r => r.plan.short);
    const save = wp.id === 'oegk'
      ? `<strong>€0</strong><span>premiums</span>`
      : `<strong>${money(R.saving)}</strong><span>less than no insurance</span>`;
    // Remember row positions so re-ranked rows can glide to their new place.
    const before = new Map([...results.querySelectorAll('.row')].map(el => [el.dataset.id, el.getBoundingClientRect().top]));
    results.innerHTML = `<div class="winner" aria-live="polite">
        <span class="trophy e" aria-hidden="true">${wp.id === 'oegk' ? '🤷' : '🏆'}</span>
        <p class="w-label">Cheapest for your year</p>
        <p class="w-name">${esc(wp.short)}</p>
        <p class="w-meta"><strong>${money(w.total)}</strong> a year · ${wp.monthly ? `${money(wp.monthly, true)}/month` : 'no premiums'}${wp.source.type === 'estimate' ? ' · estimated price' : ''}</p>
        <p class="w-save">${save}</p>
        <ul class="w-facts">${(wp.id === 'oegk' ? ['🙌 Insurance doesn’t pay off for this year', ...wp.facts.slice(0, 2)] : wp.facts).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <a class="w-link" href="${wp.link.href}" target="_blank" rel="noreferrer">${esc(wp.link.label)} ↗</a></div>
      ${state.moving ? `<p class="w-note">${e('✈️')} <strong>Moving abroad?</strong> Austrian plans only cover treatment in Austria once you live elsewhere. Generali lets you cancel at the end of the month you move. Cigna and Allianz Care move with you, if you’re eligible.</p>` : ''}
      ${cheaperBench.length ? `<p class="w-note">${e('🌍')} ${esc(cheaperBench.join(' and '))} could cost less in a year like this, if you’re eligible and they confirm cover. Their Austrian prices and co-pays are unknown.</p>` : ''}
      <div class="rank-head" id="ranking"><h3>All plans for your year</h3>
        <p class="legend"><span><i class="k-prem"></i>Premiums</span><span><i class="k-pay"></i>You pay</span><span><i class="k-base"></i>No insurance</span></p></div>
      <div class="rows">${(() => { let n = 0; return R.rows.map(r => rowHtml(r, r.unknown ? -1 : n++, max, none, wp.id)).join(''); })()}</div>
      <p class="rank-note">Per adult, per year. Plans pay back 80% of outpatient bills within their limits (the cautious case). Hospital bills are examples.</p>`;
    if (!reduceMotion && before.size) {
      results.querySelectorAll('.row').forEach(el => {
        const dy = (before.get(el.dataset.id) ?? 0) - el.getBoundingClientRect().top;
        if (!dy) return;
        el.animate([{transform:`translateY(${dy}px)`}, {transform:'none'}], {duration:420, easing:'cubic-bezier(.2,.8,.2,1)'});
      });
    }
    updateDock(wp, w.total);
    markMatrixWinner(wp.id);
  }

  /* Emoji chart */
  const cols = [['doctors','🧑‍⚕️','Doctors & tests'], ['hospital','🏥','Hospital'], ['meds','💊','Medicines'], ['therapy','💆','Therapy'], ['travel','✈️','Travel'], ['move','🧳','If you move abroad']];
  const srcIcon = {quote:'✅', estimate:'🔮', calc:'🧮', bench:'❓', none:'🏛️'};
  const meter = (n, ic) => n ? `<span class="meter" aria-label="${n} of 5">${ic.repeat(n)}<i>${ic.repeat(5 - n)}</i></span>` : `<span class="meter zero" aria-label="None">❌</span>`;
  function renderMatrix() {
    const body = document.getElementById('matrix-body');
    if (!body) return;
    body.innerHTML = M.plans.map(p => `<tr id="plan-${p.id}" data-id="${p.id}">
      <th scope="row">${esc(p.short)}<small>${esc(p.cover)}</small><a class="q-link" href="${p.link.href}" target="_blank" rel="noreferrer">${esc(p.link.label)} ↗</a></th>
      <td class="price">${p.monthly ? `${p.priceFloor ? 'from ' : p.benchmark || p.source.type === 'estimate' ? '≈ ' : ''}${money(p.monthly)}` : '€0'}<small><span class="e" aria-hidden="true">${srcIcon[p.source.type]}</span> ${esc(p.source.label)}</small></td>
      ${cols.map(([k, ic]) => `<td>${meter(p.meter[k], ic)}<span class="cap">${esc(p.cells[k])}</span></td>`).join('')}</tr>`).join('');
  }
  function markMatrixWinner(id) {
    document.querySelectorAll('#matrix-body tr').forEach(tr => {
      const win = tr.dataset.id === id;
      tr.classList.toggle('win', win);
      const th = tr.querySelector('th');
      th.querySelector('.cup')?.remove();
      if (win) th.insertAdjacentHTML('afterbegin', '<span class="e cup" aria-label="Cheapest for your year">🏆 </span>');
    });
  }

  /* Mobile dock: the current winner, while you scroll the controls and the ranking is off screen. */
  const dock = document.getElementById('dock');
  function updateDock(p, total) {
    if (!dock) return;
    dock.innerHTML = `${e(p.id === 'oegk' ? '🤷' : '🏆')}<span><b>${esc(p.short)}</b>cheapest for your year</span><em>${money(total)}</em>`;
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

  /* Events */
  function setLevel(key, i, focus) {
    state.levels[key] = i;
    state.preset = (M.presets.find(p => M.care.every(c => p.levels[c.key] === state.levels[c.key])) || {}).id || '';
    renderControls(focus ? key : null, i);
    renderResults();
  }
  controls.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.i != null) setLevel(b.closest('.lvl').dataset.key, Number(b.dataset.i), true);
    else if (b.dataset.preset) {
      const p = M.presets.find(x => x.id === b.dataset.preset);
      state.levels = {...p.levels}; state.preset = p.id;
      renderControls(); renderResults();
      controls.querySelector(`[data-preset="${p.id}"]`)?.focus({preventScroll:true});
    } else if (b.dataset.move) {
      state.moving = b.dataset.move === 'yes';
      renderControls(); renderResults();
      controls.querySelector(`[data-move="${b.dataset.move}"]`)?.focus({preventScroll:true});
    } else if (b.dataset.room || b.dataset.cause) {
      if (b.dataset.room) state.room = b.dataset.room; else state.cause = b.dataset.cause;
      renderControls(); renderResults();
      controls.querySelector(b.dataset.room ? `[data-room="${b.dataset.room}"]` : `[data-cause="${b.dataset.cause}"]`)?.focus({preventScroll:true});
    }
  });
  controls.addEventListener('keydown', ev => {
    const b = ev.target.closest('.lv');
    if (!b) return;
    const step = {ArrowRight:1, ArrowUp:1, ArrowLeft:-1, ArrowDown:-1}[ev.key];
    if (!step && ev.key !== 'Home' && ev.key !== 'End') return;
    ev.preventDefault();
    const i = ev.key === 'Home' ? 0 : ev.key === 'End' ? 4 : Math.max(0, Math.min(4, Number(b.dataset.i) + step));
    setLevel(b.closest('.lvl').dataset.key, i, true);
  });

  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  renderMatrix();
  renderControls();
  renderResults();
})();
