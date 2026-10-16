/* Plan data and yearly-cost model for the Vienna insurance picker.
 * Generali: written quotes of 23 Sep 2026 for a 40-year-old office worker insured
 * with ÖGK in Vienna, including a 5% partner discount for the first three years,
 * and Generali's written answers of 8 Oct 2026.
 * Wiener Städtische: online calculator, age 40, Vienna, ÖGK, checked 15 Oct 2026.
 * Cigna and Allianz Care: published examples from other countries; benchmarks only.
 * Outpatient bills: 80% back (the cautious case), within each plan's limits.
 * Hospital bills are examples of a private bill, not price estimates.
 */
(function (root) {
  'use strict';
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const money = (n, cents) => new Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR',
    minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0}).format(n);
  const links = {
    generali: 'https://www.generali.at/privatkunden/',
    wiener: 'https://www.wienerstaedtische.at/versicherungen/privatkunden/gesund-fit/online-abschluss-krankenversicherung.html',
    cigna: 'https://www.cignaglobal.com/',
    allianz: 'https://www.allianzcare.com/',
    checkup: 'https://www.gesundheitskasse.at/cdscontent/?contentid=10007.882097'
  };

  // Five levels per kind of care: [amount in €, emoji, label]. Hospital adds days.
  const care = [
    {key:'visits', emoji:'🧑‍⚕️', name:'Private doctor visits', hint:'≈ €150 a visit', levels:[
      [0,'😎','None'], [300,'🙂','2 visits'], [750,'🤔','5 visits'], [1500,'🤧','10 visits'], [3000,'🤒','20 visits']]},
    {key:'tests', emoji:'🔬', name:'Scans & lab tests', hint:'Private, per year', levels:[
      [0,'🙅','None'], [150,'🩸','Blood test'], [400,'🔍','Ultrasound + bloods'], [1000,'🧲','MRI + more'], [2500,'🧬','Lots of tests']]},
    {key:'therapy', emoji:'💆', name:'Physio & therapy', hint:'≈ €70 a session', levels:[
      [0,'🙅','None'], [350,'💆','5 sessions'], [700,'🧘','10 sessions'], [1400,'🏋️','20 sessions'], [2800,'🦿','40 sessions']]},
    {key:'meds', emoji:'💊', name:'Medicines ÖGK won’t pay', hint:'Per year', levels:[
      [0,'🙅','None'], [100,'💊','A little'], [500,'💉','Regular'], [2000,'🧪','Pricey'], [100000,'💀','Nightmare drug']]},
    {key:'hospital', emoji:'🏥', name:'Hospital stay', hint:'Example private bill', levels:[
      [0,'😌','None',0], [5000,'✂️','Day surgery',1], [15000,'🛏️','Op + 3 nights',3], [30000,'🩻','Big op, 1 week',7], [100000,'🚑','Serious, 3 weeks',21]]}
  ];
  const presets = [
    {id:'healthy', emoji:'😎', name:'Healthy', levels:{visits:0, tests:0, therapy:0, meds:0, hospital:0}},
    {id:'normal', emoji:'🙂', name:'Normal', levels:{visits:1, tests:1, therapy:0, meds:1, hospital:0}},
    {id:'busy', emoji:'🤧', name:'Busy', levels:{visits:2, tests:2, therapy:2, meds:2, hospital:0}},
    {id:'rough', emoji:'🩹', name:'Rough', levels:{visits:3, tests:3, therapy:3, meds:2, hospital:2}},
    {id:'worst', emoji:'😱', name:'Worst case', levels:{visits:4, tests:4, therapy:4, meds:4, hospital:4}}
  ];

  const AJ1 = {total:1805, doc:1805, therapy:415, meds:415};
  const AJ2 = {total:3705, doc:3705, therapy:685, meds:685, over:.25};
  const PREMIUM_HOSPITAL = {private:true, excess:300, excessDays:5, publicCash:130};
  const QUOTE = {type:'quote', label:'Real quote'};
  const ESTIMATE = {type:'estimate', label:'Estimate'};
  const CALC = {type:'calc', label:'Online calculator'};
  const BENCH = {type:'bench', label:'Rough benchmark'};
  // meter: 0–5 per feature, for the emoji chart. move: what happens if you leave Austria.
  const portable = p => p.meter.move >= 5;
  const plans = [
    {id:'oegk', short:'No private insurance', insurer:'ÖGK only', cover:'€0 premiums · you pay it all', monthly:0,
      source:{type:'none', label:'Paid via salary'}, out:null, hosp:{},
      meter:{doctors:0, hospital:0, meds:0, therapy:1, travel:1, move:0},
      cells:{doctors:'You pay it all', hospital:'Public ward', meds:'ÖGK-listed drugs only', therapy:'Some, with a referral', travel:'EHIC card in the EU', move:'Ends: join the new country’s system'},
      facts:['🏥 Public hospitals cover necessary treatment','🧑‍⚕️ Doctors with an ÖGK contract are free','🆓 Free yearly check-up'],
      link:{href:links.checkup, label:'ÖGK health check'}},
    {id:'gen-basic', short:'Generali Basic', insurer:'Generali', cover:'Doctors + hospital cash', monthly:65.38, accident:12.36,
      source:QUOTE, out:AJ1, hosp:{cash:50},
      meter:{doctors:2, hospital:1, meds:1, therapy:1, travel:3, move:1},
      cells:{doctors:'€1,805 a year', hospital:'€50 a day, cash', meds:'€415 a year', therapy:'€415 a year', travel:'Trips up to 6 weeks', move:'Austria only, once you live abroad'},
      facts:['🧑‍⚕️ Doctors & tests: up to €1,805 a year','💵 €50 a day in hospital, paid to you','✈️ Travel cover for trips up to 6 weeks'],
      link:{href:links.generali, label:'Get a quote'}},
    {id:'gen-basic-plus', short:'Generali Basic+', insurer:'Generali', cover:'Big doctor limit + hospital cash', monthly:99.64, accident:12.36,
      source:ESTIMATE, out:AJ2, hosp:{cash:50},
      meter:{doctors:3, hospital:1, meds:2, therapy:2, travel:3, move:1},
      cells:{doctors:'€3,705, then 25%', hospital:'€50 a day, cash', meds:'€685 a year', therapy:'€685 a year', travel:'Trips up to 6 weeks', move:'Austria only, once you live abroad'},
      facts:['🧑‍⚕️ Doctors & tests: up to €3,705 a year, then 25%','💵 €50 a day in hospital, paid to you','🔮 Estimated: Basic + the 2AJ doctor tier'],
      link:{href:links.generali, label:'Ask for this quote'}},
    {id:'gen-classic', short:'Generali Classic', insurer:'Generali', cover:'Doctors + private room after accidents', monthly:72.68, accident:12.36,
      source:QUOTE, out:AJ1, hosp:{cash:54, accidentPrivate:true, accidentCash:160},
      meter:{doctors:2, hospital:2, meds:1, therapy:1, travel:3, move:1},
      cells:{doctors:'€1,805 a year', hospital:'Private after accidents, €54/day illness', meds:'€415 a year', therapy:'€415 a year', travel:'Trips up to 6 weeks', move:'Austria only, once you live abroad'},
      facts:['🚑 Private room after an accident, €0 excess','💵 €54 a day for illness stays','🧑‍⚕️ Doctors & tests: up to €1,805 a year'],
      link:{href:links.generali, label:'Get a quote'}},
    {id:'gen-premium', short:'Generali Premium', insurer:'Generali', cover:'Doctors + private hospital', monthly:164.86, accident:12.36,
      source:QUOTE, out:AJ1, hosp:PREMIUM_HOSPITAL,
      meter:{doctors:2, hospital:4, meds:1, therapy:1, travel:3, move:1},
      cells:{doctors:'€1,805 a year', hospital:'Private room, max €1,500/yr excess', meds:'€415 a year', therapy:'€415 a year', travel:'Trips up to 6 weeks', move:'Austria only, once you live abroad'},
      facts:['🏥 Private room for illness & accidents','🧾 You pay at most €1,500 a year (Vienna)','🧑‍⚕️ Doctors & tests: up to €1,805 a year'],
      link:{href:links.generali, label:'Get a quote'}},
    {id:'gen-premium-plus', short:'Generali Premium+', insurer:'Generali', cover:'Big doctor limit + private hospital', monthly:199.12, accident:12.36,
      source:ESTIMATE, out:AJ2, hosp:PREMIUM_HOSPITAL,
      meter:{doctors:3, hospital:4, meds:2, therapy:2, travel:3, move:1},
      cells:{doctors:'€3,705, then 25%', hospital:'Private room, max €1,500/yr excess', meds:'€685 a year', therapy:'€685 a year', travel:'Trips up to 6 weeks', move:'Austria only, once you live abroad'},
      facts:['🏥 Private room for illness & accidents','🧑‍⚕️ Doctors & tests: up to €3,705 a year, then 25%','🔮 Estimated: Premium + the 2AJ doctor tier'],
      link:{href:links.generali, label:'Ask for this quote'}},
    {id:'ws-classic', short:'Wiener Städtische Classic', insurer:'Wiener Städtische', cover:'Doctors only', monthly:128.07,
      source:CALC, out:{doc:3200, therapy:613, meds:519}, hosp:{},
      meter:{doctors:3, hospital:0, meds:1, therapy:2, travel:0, move:1},
      cells:{doctors:'€3,200 a year', hospital:'Not included', meds:'€519 a year', therapy:'€613 a year', travel:'Not included', move:'Austrian plan: check the terms'},
      facts:['🧑‍⚕️ Doctors & tests: up to €3,200 a year','💆 Separate therapy allowance: €613','🚫 No hospital cover'],
      link:{href:links.wiener, label:'Calculate your price'}},
    {id:'ws-premium', short:'Wiener Städtische Premium', insurer:'Wiener Städtische', cover:'Doctors only', monthly:185.49,
      source:CALC, out:{doc:6400, therapy:1226, meds:1038}, hosp:{},
      meter:{doctors:4, hospital:0, meds:2, therapy:3, travel:0, move:1},
      cells:{doctors:'€6,400 a year', hospital:'Not included', meds:'€1,038 a year', therapy:'€1,226 a year', travel:'Not included', move:'Austrian plan: check the terms'},
      facts:['🧑‍⚕️ Doctors & tests: up to €6,400 a year','💆 Therapy €1,226, medicines €1,038','🚫 No hospital cover'],
      link:{href:links.wiener, label:'Calculate your price'}},
    {id:'cigna', short:'Cigna Global Platinum', insurer:'Cigna Global', cover:'Worldwide, with outpatient', monthly:761, benchmark:true,
      source:BENCH, out:{all:true}, hosp:{private:true},
      meter:{doctors:5, hospital:5, meds:5, therapy:4, travel:5, move:5},
      cells:{doctors:'No yearly maximum', hospital:'Private, worldwide', meds:'Broad cover', therapy:'Covered', travel:'Worldwide', move:'Moves with you'},
      facts:['🌍 Worldwide, very high limits','💊 Broad cover for expensive medicines','❓ Excess and co-pays not included'],
      link:{href:links.cigna, label:'Ask for a quote'}},
    {id:'allianz', short:'Allianz Care Signature', insurer:'Allianz Care', cover:'International, + outpatient module', monthly:254, priceFloor:true, benchmark:true,
      source:BENCH, out:{all:true}, hosp:{private:true},
      meter:{doctors:4, hospital:5, meds:5, therapy:3, travel:5, move:5},
      cells:{doctors:'60 visits a year', hospital:'Private, international', meds:'No stated cap', therapy:'Inside the 60 visits', travel:'International', move:'Moves with you'},
      facts:['🌍 International hospital cover','💊 Outpatient drugs with no stated cap','❓ Core price only: outpatient module costs extra'],
      link:{href:links.allianz, label:'Ask for a quote'}}
  ];
  const byId = id => plans.find(p => p.id === id);

  // Turn level choices into a year of bills.
  function usageFrom(levels = {}, room = 'private', cause = 'illness') {
    const pick = c => c.levels[Math.max(0, Math.min(4, Number(levels[c.key]) || 0))];
    const u = {privateRoom: room !== 'public', accident: cause === 'accident'};
    for (const c of care) {
      const l = pick(c);
      if (c.key === 'hospital') { u.hospitalBill = l[0]; u.hospitalDays = l[3]; }
      else u[c.key] = l[0];
    }
    return u;
  }
  const bills = u => round(u.visits + u.tests + u.therapy + u.meds + (u.privateRoom ? u.hospitalBill : 0));

  // What the plan pays back on outpatient bills.
  function outpatientPaid(plan, u) {
    const o = plan.out;
    const bill = u.visits + u.tests + u.therapy + u.meds;
    if (!o) return 0;
    if (o.all) return bill;
    const docBill = u.visits + u.tests;
    let doc = Math.min(.8 * docBill, o.doc);
    const other = Math.min(.8 * u.therapy, o.therapy) + Math.min(.8 * u.meds, o.meds);
    let paid;
    if (o.total) { doc = Math.min(doc, o.total); paid = doc + Math.min(other, o.total - doc); }
    else paid = doc + other;
    if (o.over && docBill > doc / .8) paid += o.over * (docBill - doc / .8);
    return round(Math.min(paid, bill));
  }
  // What a hospital stay costs you, and any daily cash the plan pays you.
  function hospitalCost(plan, u) {
    const d = u.hospitalDays || 0, h = plan.hosp || {};
    if (!d) return {pay:0, cash:0};
    let pay = 0, cash = 0;
    if (u.privateRoom) {
      pay = u.hospitalBill;
      if (h.private) pay = u.accident || !h.excess ? 0 : h.excess * Math.min(d, h.excessDays);
      else if (h.accidentPrivate && u.accident) pay = 0;
      else if (h.cash) cash = h.cash * d;
    } else if (h.publicCash) cash = h.publicCash * d;
    else if (h.accidentCash && u.accident) cash = h.accidentCash * d;
    else if (h.cash) cash = h.cash * d;
    return {pay, cash};
  }
  // A year on this plan: premiums plus what you still pay, minus cash paid to you.
  function yearCost(plan, u) {
    const premium = round(plan.monthly * 12);
    const outBill = u.visits + u.tests + u.therapy + u.meds;
    const outPaid = outpatientPaid(plan, u);
    const h = hospitalCost(plan, u);
    const youPay = round(outBill - outPaid + h.pay);
    return {plan, premium, youPay, cash:round(h.cash), total:round(premium + youPay - h.cash),
      unknown:!!plan.benchmark};
  }
  // Every plan, cheapest first. The winner must have a real or estimated Austrian price.
  function rank(u) {
    const rows = plans.map(p => yearCost(p, u)).sort((a, b) => a.total - b.total || a.plan.monthly - b.plan.monthly);
    const winner = rows.find(r => !r.unknown);
    const none = rows.find(r => r.plan.id === 'oegk');
    return {rows, winner, none, bills:bills(u), saving:round(none.total - winner.total)};
  }
  // Doctor and test bills at which a plan's premiums are paid back.
  function breakEven(plan) {
    const o = plan.out;
    if (!o || o.all || !plan.monthly) return null;
    const premium = plan.monthly * 12;
    return premium > o.doc ? null : Math.ceil(premium / .8);
  }

  const api = {care, presets, plans, byId, portable, usageFrom, bills, outpatientPaid, hospitalCost, yearCost, rank, breakEven, money, links};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InsuranceDecision = api;
})(typeof window !== 'undefined' ? window : globalThis);
