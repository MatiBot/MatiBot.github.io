(function () {
  'use strict';
  const M=window.InsuranceDecision, root=document.getElementById('insurance-questionnaire');
  if (!M || !root) return;
  const euro=M.money, escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let answers={...M.defaults,edges:[]}, step=0, result=null;
  const labels=['Your priority','Budget & visits','Hospital & timing','Edge cases','Actual offers'];
  const priorities={hospital:'Private hospital and surgery access',routine:'Value for private visits and scans',both:'Private surgery plus regular private care',medicine:'A major medicine bill ÖGK does not fund',budget:'The lowest fixed monthly commitment'};
  root.innerHTML=`<form id="insurance-form" novalidate><div class="picker-progress"><span id="picker-progress-label"></span><span>About 3 minutes</span></div><progress id="picker-progress" max="5" value="1" aria-label="Questionnaire progress"></progress><div id="picker-fields"></div><p id="picker-error" role="alert" hidden></p><div class="picker-actions"><button type="button" id="picker-back">Back</button><button type="submit" id="picker-next" class="picker-primary">Continue</button></div></form><div id="picker-results" hidden></div>`;
  const q=id=>root.querySelector('#'+id);
  const radios=(name,options)=>`<div class="picker-options">${options.map(([value,title,hint])=>`<label class="picker-option"><input type="radio" name="${name}" value="${value}" ${answers[name]===value?'checked':''}><span><strong>${title}</strong>${hint?`<small>${hint}</small>`:''}</span></label>`).join('')}</div>`;
  const field=(name,title,hint,min=0,max=1000000)=>`<label class="picker-field"><span>${title}</span><input type="number" name="${name}" value="${escape(answers[name])}" min="${min}" max="${max}" step="0.01" inputmode="decimal" ${['budget','visits','fundedVisits','refund'].includes(name)?'required':''}>${hint?`<small>${hint}</small>`:''}</label>`;
  const select=(name,title,options)=>`<label class="picker-field"><span>${title}</span><select name="${name}">${options.map(([v,t])=>`<option value="${v}" ${answers[name]===v?'selected':''}>${t}</option>`).join('')}</select></label>`;
  const group=(title,body,note='')=>`<fieldset><legend>${title}</legend>${note?`<p class="picker-help">${note}</p>`:''}${body}</fieldset>`;
  const hospitalWanted=()=>['hospital','both'].includes(answers.priority);
  const pair=()=>answers.scope!=='adult';
  const priceBasis=()=>pair()?'both quoted adults':'the quoted adult';
  const optionalQuotes=['health','hospital','outpatient','classicQuote','premiumQuote'];

  function renderStep(focus=false) {
    q('insurance-form').hidden=false; q('picker-results').hidden=true;
    q('picker-progress-label').textContent=`${step+1} of 5 · ${labels[step]}`;
    q('picker-progress').value=step+1;
    q('picker-back').hidden=step===0;
    q('picker-next').textContent=step===4?'Show my recommendation':'Continue';
    q('picker-error').hidden=true;
    let body='';
    if (step===0) {
      body=group('What should we solve first?',radios('priority',[
        ['hospital',priorities.hospital,'Funding an eligible private operation, with a choice of covered hospitals.'],
        ['routine',priorities.routine,'Make regular private care cost less overall.'],
        ['both',priorities.both,'Hospital cover matters; insure routine costs only if the extra premium makes sense.'],
        ['medicine',priorities.medicine,'Protection from an unusually large eligible outpatient drug bill.'],
        ['budget',priorities.budget,'Minimise recurring premiums and pay for private care as needed.']
      ]));
      body+=group('Who are we choosing for?',radios('scope',[
        ['adult','The adult in the Generali quote','Use the known per-person prices.'],
        ['couple','Both quoted adults','Use the actual €364.19/month Generali proposal and each adult’s spending.'],
        ['family','Our family, including children','Compare the known two-adult portion; child cover and prices still need a quote.']
      ]));
    }
    if (step===1) {
      body=group('What are you comfortable spending?',`<div class="picker-field-grid">${field('budget',`Maximum monthly premium for ${priceBasis()} (€)`,'Premiums only. Hospital deductibles and remaining bills are extra.',0,10000)}${field('visits',`${pair()?'First adult: annual':'Annual'} private visits / scans with no ÖGK refund (€)`,'An editable spending example. Include eligible doctor and diagnostic bills, not surgery, medicines or screening.')}${pair()?field('partnerVisits','Second adult: annual visits / scans with no ÖGK refund (€)','Each adult has a separate benefit limit; unused allowances do not transfer.'):''}</div>`,answers.scope==='family'?'Enter a budget for the two-adult portion. Children are not priced or covered by this model.':`All figures below cover ${priceBasis()}, on top of ÖGK contributions.`);
      body+=`<details class="picker-detail" ${Number(answers.fundedVisits)>0||Number(answers.partnerFundedVisits)>0?'open':''}><summary>Some visits receive an ÖGK refund</summary><p class="picker-help">Put only bills that each receive a public contribution in this second pool. Keep zero-refund bills in the first field so mixed claims are calculated correctly.</p><div class="picker-field-grid">${field('fundedVisits',`${pair()?'First adult: additional':'Additional'} annual bills with an ÖGK contribution (€)`,'Gross total; do not count these bills in the fields above.')}${field('refund',`${pair()?'First adult: total':'Total'} ÖGK refund for those additional bills (€)`,'The refund cannot exceed their gross total.')}${pair()?field('partnerFundedVisits','Second adult: additional bills with an ÖGK contribution (€)','Gross total; keep these separate from the no-refund bills.')+field('partnerRefund','Second adult: ÖGK refund for those additional bills (€)','The refund cannot exceed their gross total.'):''}</div></details>`;
      body+='<p class="picker-help">The price ranking models visits and diagnostic scans for one year, with unused limits. Other selected treatments get a separate coverage review.</p>';
    }
    if (step===2) {
      body=group(`Is there already a health issue or planned treatment${pair()?' for either adult':''}?`,radios('known',[
        ['no','No known issue relevant to this decision','We are considering cover for future care.'],
        ['yes','Yes — symptoms, a condition, or treatment already planned','Written underwriting comes before a purchase recommendation.'],
        ['unknown','I’m not sure what needs to be declared','Ask the insurer before assuming the future policy will pay.']
      ]),'No diagnosis or medical details are requested.');
      if (hospitalWanted()) {
        body+=group('What hospital cover would actually suit you?',`<div class="picker-field-grid">${select('region','Likely hospital location',[
          ['vienna','Vienna'],['lower','Lower Austria contract hospital'],['other','Another province / not yet sure']
        ])}${select('room','Room preference',[
          ['twin','Twin room is fine'],['single','Single room is important']
        ])}${select('provider','Hospital and surgeon preference',[
          ['flexible','Flexible — can use approved contract providers'],['specific','A specific surgeon or hospital'],['noncontract','A provider outside the contract network']
        ])}${select('reserve',`Comfortable deductible reserve${pair()?' per adult':''}`, [
          ['0','€0'],['500','Up to €500'],['1500','Up to €1,500'],['1855','Up to €1,855'],['3000','Up to €3,000'],['5000','Up to €5,000'],['unknown','I need to decide']
        ])}</div>`,'This reserve is for the stated hospital deductible. Excluded treatment and noncontract fees can leave additional costs.');
      } else body+='<p class="picker-help">ÖGK already funds covered necessary public hospital treatment, subject to applicable contributions. A private appointment can also be paid directly without insurance.</p>';
    }
    if (step===3) {
      body=group('Which edge cases matter to you?',`<div class="picker-edge-grid">${M.edges.map(e=>`<label class="picker-option"><input type="checkbox" name="edges" value="${e.id}" ${answers.edges.includes(e.id)?'checked':''}><span><strong>${e.title}</strong><small>${e.hint}</small></span></label>`).join('')}</div>`,'Select any that concern you. These are concerns to check, not predictions that the events will happen. You can leave all unselected.');
    }
    if (step===4) {
      body=group('Which Generali prices can we actually compare?',`<div class="picker-quote"><div><strong>Full proposed package · ${priceBasis()}</strong><small>Hospital + outpatient + travel + accident</small></div><div><strong>${pair()?'€364.19':'€177.22'} / month</strong><small>${pair()?'€4,370.28':'€2,126.64'} / year · before promotions</small></div></div><p class="picker-help">This proposal is included by default. Medical underwriting and final terms still need acceptance.${pair()?' It covers the two quoted adults, with no child cover included.':''}</p><details class="picker-detail" ${optionalQuotes.some(k=>answers[k]!=='')?'open':''}><summary>I have received revised or standalone prices</summary><p class="picker-help">Only enter actual revised offers for <strong>${priceBasis()}</strong>. Leave a field blank if it is not offered. The component figures below are references, not confirmed standalone premiums.</p><div class="picker-field-grid">${field('health','Hospital + outpatient, monthly (€)',`Current component sum: ${pair()?'€334.05':'€162.62'}. Removing extras may change the offer.`,0.01,10000)}${field('hospital','Hospital only, monthly (€)',`Current component ${pair()?'sum':'price'}: ${pair()?'€242.68':'€117.13'}. Standalone price unconfirmed.`,0.01,10000)}${field('outpatient','Outpatient only, monthly (€)',`Current component ${pair()?'sum':'price'}: ${pair()?'€91.37':'€45.49'}. Standalone availability and price unconfirmed.`,0.01,10000)}${pair()?field('classicQuote','Wiener Classic for both adults, monthly (€)','Combined actual price, with each adult on the modelled Classic benefits.',0.01,10000)+field('premiumQuote','Wiener Premium for both adults, monthly (€)','Combined actual price, with each adult on the modelled Premium benefits.',0.01,10000):''}</div></details>`);
      body+=`<div class="picker-review"><strong>Your comparison</strong><p>${escape(priorities[answers.priority])} · premium budget ${euro(Number(answers.budget))}/month for ${priceBasis()}.</p><p>${pair()?'Wiener’s two-adult premiums are unknown, so those options are not ranked unless you enter actual quotes above.':'Wiener Classic (€128.07/month) and Premium (€185.49/month) are included as age 40 price examples.'} These Wiener options do not include private inpatient hospital cover. Cigna and Allianz remain unpriced Austrian quote candidates.</p></div>`;
    }
    q('picker-fields').innerHTML=body;
    if (focus) { q('picker-progress-label').setAttribute('tabindex','-1'); q('picker-progress-label').focus({preventScroll:true}); root.scrollIntoView({block:'start',behavior:'instant'}); }
  }

  function validate() {
    let msg='';
    if (step===0&&!answers.priority) msg='Choose the problem you want to solve first.';
    if (step===1) {
      for (const name of ['budget','visits','fundedVisits','refund',...(pair()?['partnerVisits','partnerFundedVisits','partnerRefund']:[])]) {
        const n=Number(answers[name]);
        if (answers[name]===''||!Number.isFinite(n)||n<0||n>(name==='budget'?10000:1000000)) {msg='Enter valid amounts of zero or more. The monthly budget must be at most €10,000; annual bill fields at most €1,000,000.';break;}
      }
      if (!msg&&Number(answers.refund)>Number(answers.fundedVisits)) msg='The ÖGK refund cannot exceed the bills in the public-contribution pool.';
      if (!msg&&Number(answers.fundedVisits)>0&&Number(answers.refund)===0) msg='Enter the expected positive refund for the public-contribution bills, or move those bills into the no-refund field.';
      if (!msg&&pair()&&Number(answers.partnerRefund)>Number(answers.partnerFundedVisits)) msg='The second adult’s ÖGK refund cannot exceed their public-contribution bills.';
      if (!msg&&pair()&&Number(answers.partnerFundedVisits)>0&&Number(answers.partnerRefund)===0) msg='Enter the second adult’s positive ÖGK refund, or move those bills into their no-refund field.';
    }
    if (step===2&&!answers.known) msg='Select whether there is a known issue, or choose “I’m not sure”.';
    if (step===4) for (const key of optionalQuotes) if (answers[key]!==''&&(!Number.isFinite(Number(answers[key]))||Number(answers[key])<=0||Number(answers[key])>10000)) {msg='A revised monthly quote must be above €0 and at most €10,000, or leave the field blank.';break;}
    if (msg) {q('picker-error').textContent=msg;q('picker-error').hidden=false;return false;}
    return true;
  }

  function renderResults() {
    result=M.evaluate(answers);
    const r=result, c=r.candidate, full=r.rows.find(p=>p.id==='full');
    const conditional=r.underwriting||r.reserveMismatch||r.providerCheck||answers.priority==='medicine'||r.widerReview;
    const difference=full.total-r.self.total;
    const allowance=r.generaliAllowance;
    const selected=new Set(r.selectedEdges.map(e=>e.id));
    const fit=p=>!p.affordable?'Above your premium budget':!p.meetsPriority?'Does not provide the hospital cover you prioritised':p.id==='self'?'Public care + self-paid private fees':p.hospital?'Eligible illness + accident hospital cover':'Outpatient only; no private inpatient cover';
    let body=`<div class="picker-result-head"><p class="picker-eyebrow">${escape(r.status)}</p><h3 id="picker-result-title" tabindex="-1">${escape(r.title)}</h3><p>${escape(r.why)}</p></div>`;
    if (answers.scope==='family') body+='<div class="picker-alert"><strong>This is the two-adult portion, not a complete family recommendation.</strong> The known Generali proposal is €364.19/month for both quoted adults. Children need their own cover and prices before a family total or family winner can be established.</div>';
    if (answers.scope==='couple') body+='<p class="picker-help"><strong>Both adults are included:</strong> Generali uses the actual €364.19/month proposal, not twice the first adult’s price. Each person’s visit bills and annual allowance are calculated separately. Unquoted two-adult alternatives are excluded from the ranking.</p>';
    if (r.medicine) body+='<div class="picker-alert"><strong>The large-medicine risk is unresolved.</strong> None of the priced local plans solves it. The international candidates need a full Austrian quote and treatment-specific acceptance. They are not assumed to pay a €100,000 claim.</div>';
    if (r.widerReview) body+='<div class="picker-alert"><strong>The ranking covers visits only.</strong> Your other selected treatments can change the result through sublimits, shared allowances or exclusions. Obtain a combined calculation before choosing.</div>';
    if (selected.has('waiting')&&!r.wantsHospital) body+='<div class="picker-alert"><strong>You also selected surgery waiting times.</strong> Your primary decision is currently about another goal. An outpatient-only winner will not fund inpatient private surgery. Edit your first answer to prioritise hospital cover if that is essential.</div>';
    if (c) body+=`<div class="picker-cost-summary"><div><span>${conditional?'Illustrative cost leader, subject to the checks above':'Comparison choice'}</span><strong>${escape(c.name)}</strong><small>${escape(c.basis)}</small></div><div><span>Monthly premium</span><strong>${euro(c.monthly)}</strong><small>${euro(c.annual)} per year</small></div><div><span>Routine-year total</span><strong>${euro(c.total)}</strong><small>Premium + ${euro(c.remaining)} of your visits</small></div></div>`;
    body+=`<h3>Why the full package costs more</h3><p>For your modelled visits, the full Generali package costs <strong>${euro(full.total)}/year</strong>: ${euro(full.annual)} in premiums plus ${euro(full.remaining)} left to pay. Its outpatient component reimburses ${euro(full.paid)}. That is <strong>${euro(difference)} more than self pay</strong> for these visits alone. Hospital protection and the other package benefits must justify that difference for you.</p>`;
    if (answers.outpatient==='') body+=`<p>A standalone Generali outpatient offer could change the answer. For these visits, its premium for ${priceBasis()} would need to be below <strong>${euro(allowance/12)}/month</strong> to beat self pay on this calculation. The quoted ${pair()?'€91.37 component sum':'€45.49 component'} is <strong>not treated as an offer you can buy alone</strong>.</p>`;
    if (r.wantsHospital) body+=`<p><strong>Hospital deductible for your selected setting:</strong> ${r.cap===null?'not verified; request the applicable tariff':`${euro(r.cap)} per person, per calendar year under the quoted ${answers.region==='lower'?'Lower Austria':'Vienna'} ${answers.room==='single'?'single':'twin'} room terms`}${selected.has('newyear')&&r.cap!==null?`; two calendar years can mean up to ${euro(r.reserveNeeded)} per person under those deductible caps`:''}. This limits the specified deductible, not every possible charge.${pair()?' Claims by both adults can require separate deductibles.':''} Surgery is not included in the routine-year totals below.</p>`;
    body+=`<h3>What to do next, in order</h3><ol class="picker-next-list">${r.next.map(n=>`<li>${escape(n)}</li>`).join('')}</ol>`;
    if (r.medicine) body+=`<div class="picker-international"><div><strong>Cigna Global Platinum + International Outpatient</strong><p>Get the required core policy, Austrian eligibility, deductible and written medicine answer. The foreign price benchmark is not your premium.</p><a href="https://www.cignaglobal.com/individuals-families/international-health-insurance/global-professionals/optional-benefits" rel="noreferrer">Published outpatient benefits ↗</a></div><div><strong>Allianz Care Signature + outpatient</strong><p>Get the complete core-plus-outpatient quote, deductible and written drug coverage. A core-only example does not price this combination.</p><a href="https://www.allianzcare.com/content/dam/onemarketing/azcare/allianzcare/en/docs/DOC-Care-IBG-EN-1125.pdf" rel="noreferrer">Published benefit guide ↗</a></div></div>`;
    body+=`<h3>Compare the priced options</h3><p class="picker-help">${pair()?'Both quoted adults; children excluded':'One quoted adult'} · ${euro(r.net)} in private visits/scans after entered ÖGK refunds · full annual premiums · eligible claims with unused per-person limits. Ranked by premium plus remaining visit bills. Travel, accident cash benefits, therapy, drugs and actual surgery claims are not valued in this table. Highlighting follows your priority and budget, not just the cheapest row.</p><div class="comparison"><table class="picker-comparison"><thead><tr><th>Option</th><th>Premium</th><th>Visit bills</th><th>Annual total</th><th>Fit for your answers</th></tr></thead><tbody>${r.rows.map(p=>`<tr ${c?.id===p.id?'class="picker-chosen"':''}><td data-label="Option">${escape(p.name)}<small>${escape(p.basis)}</small></td><td data-label="Premium"><strong>${euro(p.monthly)}/mo</strong><small>${euro(p.annual)}/yr</small></td><td data-label="Visit bills">You: ${euro(p.remaining)}<small>Insurer: ${euro(p.paid)}</small></td><td data-label="Annual total"><strong>${euro(p.total)}</strong></td><td data-label="Fit for your answers">${fit(p)}</td></tr>`).join('')}</tbody></table></div>`;
    if (r.selectedEdges.length) body+=`<h3>Your edge cases: benefit, gap, next action</h3><div class="picker-edge-results">${r.selectedEdges.map(e=>`<details class="picker-detail"><summary>${escape(e.title)}</summary><dl><dt>How it could help</dt><dd>${escape(e.benefit)}</dd><dt>What it does not solve</dt><dd>${escape(e.gap)}</dd><dt>Your next action</dt><dd>${escape(e.next)}</dd></dl></details>`).join('')}</div>`;
    body+=`<details class="picker-detail"><summary>How this recommendation is made</summary><p>The questionnaire first respects your stated priority and monthly budget. For visits, it compares the full annual premium plus your remaining eligible bills. No-refund bills use 80% reimbursement; bills that each receive an ÖGK contribution use the remaining eligible amount, within the plan’s annual limit. Hospital priorities require a hospital policy.</p><p>Known treatment, an unaffordable or unknown deductible, a chosen provider and major-medicine uncertainty take precedence over a price winner. Standalone Generali components are excluded until you enter a revised offer. International plans are unranked because your price and eligibility are unknown. There are no invented likelihood scores or family premiums.</p><p>Sources and the full benefit comparison are <a href="#coverage">below</a>. Prices are based on the 23 September proposal and the 15 October 2026 comparison. This is a shortlist for confirmation, not a coverage guarantee.</p></details><div class="picker-actions"><button type="button" id="picker-edit">Edit answers</button><button type="button" id="picker-copy" class="picker-primary">Copy next steps</button></div><p id="picker-copy-status" class="picker-help" role="status"></p>`;
    q('insurance-form').hidden=true;
    q('picker-results').innerHTML=body;
    q('picker-results').hidden=false;
    q('picker-result-title').focus({preventScroll:true});
    root.scrollIntoView({block:'start',behavior:'instant'});
  }

  q('insurance-form').addEventListener('input',e=>{
    const input=e.target;
    if (!input.name) return;
    if (input.name==='edges') answers.edges=[...q('insurance-form').querySelectorAll('input[name="edges"]:checked')].map(el=>el.value);
    else {
      if(input.name==='scope'&&answers.scope!==input.value) {optionalQuotes.forEach(k=>answers[k]='');answers.budget='';answers.known='';}
      answers[input.name]=input.value;
    }
    q('picker-error').hidden=true;
  });
  q('insurance-form').addEventListener('change',e=>{
    if (e.target.name&&e.target.name!=='edges') answers[e.target.name]=e.target.value;
  });
  q('insurance-form').addEventListener('submit',e=>{
    e.preventDefault();
    if (!validate()) return;
    if (step<4) {step++;renderStep(true);} else renderResults();
  });
  q('picker-back').addEventListener('click',()=>{step--;renderStep(true);});
  root.addEventListener('click',async e=>{
    if (e.target.id==='picker-edit') {step=0;renderStep(true);}
    if (e.target.id==='picker-copy'&&result) {
      const text=`Insurance decision — ${result.title}\n${result.why}\n\nNext steps:\n${result.next.map((n,i)=>`${i+1}. ${n}`).join('\n')}\n\nSelected edge cases:\n${result.selectedEdges.map(x=>`${x.title}: ${x.next}`).join('\n')}\n\nPrices shown cover ${priceBasis()}; children are not priced. Final offers and coverage must be confirmed.`;
      try {await navigator.clipboard.writeText(text);q('picker-copy-status').textContent='Next steps copied. Nothing has been sent to an insurer.';}
      catch {q('picker-copy-status').textContent='Copy was unavailable. Select the next steps above and copy them manually.';}
    }
  });
  renderStep();
})();
