/* Plan data and matching rules for the Vienna insurance picker.
 * Generali: written quotes of 23 Sep 2026 for a 40-year-old office worker insured
 * with ÖGK in Vienna, including a 5% partner discount for the first three years.
 * Generali benefit answers: written reply of 8 Oct 2026.
 * Wiener Städtische: online calculator, age 40, Vienna, ÖGK, checked 15 Oct 2026.
 * Cigna and Allianz Care: published examples from other countries; benchmarks only.
 * Doctor bills use the cautious rule: 80% back, up to the plan's yearly limit.
 */
(function (root) {
  'use strict';
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const money = (n, cents) => new Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR',
    minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0}).format(n);
  const links = {
    generali: 'https://www.generali.at/privatkunden/',
    wiener: 'https://www.wienerstaedtische.at/versicherungen/privatkunden/gesund-fit/online-abschluss-krankenversicherung.html',
    cigna: 'https://www.cignaglobal.com/',
    allianz: 'https://www.allianzcare.com/',
    checkup: 'https://www.gesundheitskasse.at/cdscontent/?contentid=10007.882097'
  };
  const GENERALI_SOURCE = 'Real quote · Sep 2026 · age 40';
  const plans = [
    {id:'oegk', insurer:'ÖGK', name:'Public cover only', short:'No private plan', cover:'ÖGK + pay doctors yourself', monthly:0, kind:'none', source:'You already pay this through your salary',
      tagline:'Keep public cover. Pay private doctors yourself when you want one.',
      doctor:null, hospital:'public',
      features:{doctor:'You pay; ÖGK refunds a small part', hospital:'General ward, public hospital', medicines:'Most prescriptions (small fee)', therapy:'With a ÖGK referral', travel:'EHIC card in the EU'},
      covers:['Doctors with an ÖGK contract (Kassenärzte)','Necessary surgery and hospital care in public hospitals','Emergencies, most prescriptions and the free yearly check-up'],
      gaps:['No private room or choice of hospital doctor','Private doctors (Wahlärzte): you pay most of the bill','Often longer waits for planned operations and specialists'],
      next:[{text:'Put aside what you expect to spend on private doctors each year. Pay only for the visits you choose.'},
        {text:'Use the free yearly health check (Vorsorgeuntersuchung).', href:links.checkup, label:'ÖGK health check'}]},
    {id:'gen-basic', insurer:'Generali', name:'Basic', short:'Generali Basic', cover:'Doctors + hospital cash', monthly:65.38, accident:12.36, kind:'doctor', source:GENERALI_SOURCE,
      tagline:'Private doctor cover with a little hospital cash.',
      doctor:{limit:1805}, hospital:'cash',
      features:{doctor:'€1,805 a year', hospital:'€50 a day in cash, no private room', medicines:'€415 a year', therapy:'€415 physio, €415 psychotherapy', travel:'Trips up to 6 weeks, up to €250,000'},
      covers:['Private doctors, scans and lab tests: up to €1,805 a year','€50 a day paid to you for each night in hospital','Travel cover for trips up to 6 weeks'],
      gaps:['No private hospital room','Medicines, physio and psychotherapy: €415 a year each, inside the €1,805','Premiums rose about 6% a year on average'],
      next:[{text:'Ask Generali for a quote. The price is final only after their health questions.', href:links.generali, label:'Generali'},
        {text:'For +€7.30 a month, Classic adds a private room after accidents. Worth asking about.'}]},
    {id:'gen-basic-plus', insurer:'Generali', name:'Basic + bigger doctor limit', short:'Generali Basic+', cover:'Higher doctor limit + hospital cash', monthly:99.64, accident:12.36, kind:'doctor', estimate:true,
      source:'Estimate · Basic + the 2AJ doctor tier',
      tagline:'For people who see private doctors a lot.',
      doctor:{limit:3705, over:.25}, hospital:'cash',
      features:{doctor:'€3,705 a year, then 25% of fees', hospital:'€50 a day in cash, no private room', medicines:'€685 a year', therapy:'€685 physio, €685 psychotherapy', travel:'Trips up to 6 weeks, up to €250,000'},
      covers:['Private doctors, scans and lab tests: up to €3,705 a year','After that, still 25% of doctors’ fees','€50 a day paid to you for each night in hospital'],
      gaps:['Estimated price: Generali quoted this doctor tier (2AJ) for a 43-year-old, +€34.26 a month','No private hospital room','Premiums for this tier rose about 7% a year on average'],
      next:[{text:'Ask Generali to quote Basic with the higher “2AJ” doctor tier. Generali offered to price higher doctor limits.', href:links.generali, label:'Generali'}]},
    {id:'gen-classic', insurer:'Generali', name:'Classic', short:'Generali Classic', cover:'Doctors + private room after accidents', monthly:72.68, accident:12.36, kind:'accident', source:GENERALI_SOURCE,
      tagline:'Doctor cover, plus a private room if you have an accident.',
      doctor:{limit:1805}, hospital:'accident',
      features:{doctor:'€1,805 a year', hospital:'Private twin room after accidents; €54 a day in cash for illness', medicines:'€415 a year', therapy:'€415 physio, €415 psychotherapy', travel:'Trips up to 6 weeks, up to €250,000'},
      covers:['Private twin room after an accident, with no excess to pay','€54 a day paid to you when you’re in hospital for an illness','Private doctors, scans and lab tests: up to €1,805 a year'],
      gaps:['Illness, e.g. a planned operation, is not private: you get the cash, not the room','Medicines, physio and psychotherapy: €415 a year each','Non-contract hospitals pay only fixed tariff amounts'],
      next:[{text:'Ask Generali for a quote and the list of contract hospitals.', href:links.generali, label:'Generali'}]},
    {id:'gen-premium', insurer:'Generali', name:'Premium', short:'Generali Premium', cover:'Doctors + private hospital', monthly:164.86, accident:12.36, kind:'hospital', source:GENERALI_SOURCE,
      tagline:'Private hospital for illness and accidents, plus doctor cover.',
      doctor:{limit:1805}, hospital:'full',
      features:{doctor:'€1,805 a year', hospital:'Private twin room for illness and accidents, anywhere in Austria', medicines:'€415 a year', therapy:'€415 physio, €415 psychotherapy', travel:'Trips up to 6 weeks, up to €250,000'},
      covers:['Private twin room and your choice of doctor, for illness and accidents','Contract-hospital bills paid in full, doctors’ fees included. No euro limit.','You pay at most €1,500 a year in Vienna (€300 a day, 5 days). Lower Austria and Burgenland: €0.'],
      gaps:['No guaranteed surgery date','Medicines, physio and psychotherapy: €415 a year each','Non-contract hospitals pay only fixed tariff amounts'],
      next:[{text:'Ask Generali for a quote, and ask for the version with no excess. They offered both.', href:links.generali, label:'Generali'},
        {text:'Check that the hospitals and surgeons you would use are Generali contract partners.'}]},
    {id:'gen-premium-plus', insurer:'Generali', name:'Premium + bigger doctor limit', short:'Generali Premium+', cover:'Higher doctor limit + private hospital', monthly:199.12, accident:12.36, kind:'hospital', estimate:true,
      source:'Estimate · Premium + the 2AJ doctor tier',
      tagline:'Private hospital plus a high doctor limit.',
      doctor:{limit:3705, over:.25}, hospital:'full',
      features:{doctor:'€3,705 a year, then 25% of fees', hospital:'Private twin room for illness and accidents, anywhere in Austria', medicines:'€685 a year', therapy:'€685 physio, €685 psychotherapy', travel:'Trips up to 6 weeks, up to €250,000'},
      covers:['Everything in Premium','Private doctors, scans and lab tests: up to €3,705 a year, then 25%','Higher medicine, physio and psychotherapy limits: €685 each'],
      gaps:['Estimated price: the 2AJ doctor tier costs +€34.26 a month in a quote for a 43-year-old','No guaranteed surgery date','Medicines still capped at €685 a year'],
      next:[{text:'Ask Generali to quote Premium with the higher “2AJ” doctor tier.', href:links.generali, label:'Generali'},
        {text:'Check that the hospitals and surgeons you would use are Generali contract partners.'}]},
    {id:'ws-classic', insurer:'Wiener Städtische', name:'Private doctor Classic', short:'Wiener Städtische Classic', cover:'Doctors only', monthly:128.07, kind:'doctor', source:'Online calculator · Oct 2026 · age 40',
      tagline:'Higher doctor limit, no hospital cover.',
      doctor:{limit:3200}, hospital:null,
      features:{doctor:'€3,200 a year', hospital:null, medicines:'€519 a year', therapy:'€613 a year', travel:null},
      covers:['Private doctors and scans: up to €3,200 a year','Separate allowances for therapy (€613) and medicines (€519)','Price from the online calculator: easy to check yourself'],
      gaps:['No hospital cover at all','Dental is excluded','Medicines capped at €519 a year'],
      next:[{text:'Get your own price in the Wiener Städtische online calculator.', href:links.wiener, label:'Wiener Städtische calculator'}]},
    {id:'ws-premium', insurer:'Wiener Städtische', name:'Private doctor Premium', short:'Wiener Städtische Premium', cover:'Doctors only', monthly:185.49, kind:'doctor', source:'Online calculator · Oct 2026 · age 40',
      tagline:'The highest doctor limit here, no hospital cover.',
      doctor:{limit:6400}, hospital:null,
      features:{doctor:'€6,400 a year', hospital:null, medicines:'€1,038 a year', therapy:'€1,226 a year', travel:null},
      covers:['Private doctors and scans: up to €6,400 a year','Separate allowances for therapy (€1,226) and medicines (€1,038)','Price from the online calculator: easy to check yourself'],
      gaps:['No hospital cover at all','Dental is excluded','Medicines capped at €1,038 a year'],
      next:[{text:'Get your own price in the Wiener Städtische online calculator.', href:links.wiener, label:'Wiener Städtische calculator'}]},
    {id:'cigna', insurer:'Cigna Global', name:'Platinum + International Outpatient', monthly:761, kind:'international', benchmark:true,
      source:'Rough benchmark · published example abroad',
      tagline:'Worldwide cover with very high limits.',
      doctor:{limit:Infinity}, hospital:'world',
      features:{doctor:'No yearly maximum (excess and co-pay apply)', hospital:'Private hospital, worldwide', medicines:'Broad prescription cover; confirm your drug', therapy:'Covered with limits', travel:'Worldwide'},
      covers:['Hospital, specialists, scans and prescribed medicines, worldwide','No overall yearly maximum on outpatient care','One of the few options for very expensive medicines'],
      gaps:['Price is a benchmark from another country, not an Austrian quote','Expat eligibility rules apply; excess and co-pays on top','Experimental treatment is excluded'],
      next:[{text:'Ask Cigna for an Austrian quote: eligibility, excess, maximum yearly co-pay, and written cover for any specific medicine.', href:links.cigna, label:'Cigna Global'}]},
    {id:'allianz', insurer:'Allianz Care', name:'Signature + outpatient', monthly:null, from:254, kind:'international', benchmark:true,
      source:'Core plan only · published UK example',
      tagline:'International cover; outpatient module costs extra.',
      doctor:{limit:Infinity}, hospital:'world',
      features:{doctor:'Up to 60 visits a year, combined', hospital:'Private hospital, international', medicines:'Outpatient drugs, no stated cap', therapy:'Within the 60 visits', travel:'International'},
      covers:['Broad hospital cover','Outpatient prescribed drugs without a stated limit','Excess you choose yourself'],
      gaps:['Full price unknown: €254–300 a month is the core plan only','Expat eligibility rules apply','Experimental treatment is excluded'],
      next:[{text:'Ask Allianz Care for an Austrian quote including the outpatient module, and written cover for any specific medicine.', href:links.allianz, label:'Allianz Care'}]}
  ];
  const byId = id => plans.find(p => p.id === id);
  const budgets = {b50:50, b100:100, b200:200, any:Infinity};

  // What the plan pays back on a year of private doctor bills (cautious 80% rule).
  function doctorPaid(plan, bill) {
    const d = plan.doctor;
    bill = clamp(bill, 0, 1e6);
    if (!d || d.limit === Infinity) return 0;
    let paid = Math.min(.8 * bill, d.limit);
    if (d.over && .8 * bill > d.limit) paid += d.over * (bill - d.limit / .8);
    return round(Math.min(paid, bill));
  }
  // Premiums plus the part of the doctor bills you still pay.
  function yearCost(plan, bill) {
    bill = clamp(bill, 0, 1e6);
    const premium = round(plan.monthly * 12), paid = doctorPaid(plan, bill), youPay = round(bill - paid);
    return {premium, paid, youPay, total: round(premium + youPay)};
  }
  // Yearly doctor bills at which the premiums are paid back. Null when never.
  function breakEven(plan) {
    if (!plan.doctor || plan.doctor.limit === Infinity || !plan.monthly) return null;
    const premium = plan.monthly * 12;
    if (premium > plan.doctor.limit) return null;
    return Math.ceil(premium / .8);
  }
  function rank(ids, bill, budget) {
    return ids.map(byId).filter(p => p.monthly <= budget)
      .map(p => ({plan:p, ...yearCost(p, bill)}))
      .sort((a, b) => a.total - b.total || a.plan.monthly - b.plan.monthly);
  }

  const doctorPool = ['oegk', 'gen-basic', 'gen-basic-plus', 'ws-classic', 'ws-premium'];
  function match(input) {
    const a = {goal:'', spend:1000, budget:'any', condition:'no', ...input};
    if (!['hospital','doctor','both','big','unsure'].includes(a.goal)) return null;
    const bill = clamp(a.spend, 0, 1e6);
    const budget = budgets[a.budget] ?? Infinity;
    const self = yearCost(byId('oegk'), bill);
    let primary, fit = 'match', headline, why, alternatives = [], notes = [];
    const cheapestDoctor = byId('gen-basic');

    if (a.goal === 'doctor' || a.goal === 'unsure') {
      const ranked = rank(doctorPool, bill, budget);
      primary = ranked[0].plan;
      alternatives = ranked.slice(1, 3).map(r => r.plan);
      if (primary.id === 'oegk') {
        headline = 'Skip doctor insurance for now';
        why = budget < cheapestDoctor.monthly
          ? `Nothing fits under ${money(budget)} a month. The cheapest doctor cover here is Generali Basic at ${money(cheapestDoctor.monthly, true)}.`
          : `At about ${money(bill)} a year of private doctor bills, insurance costs more than it pays back. It starts paying off at around ${money(breakEven(cheapestDoctor))} a year.`;
        if (!alternatives.length) alternatives = [cheapestDoctor];
      } else {
        const r = ranked[0];
        headline = `${primary.insurer} ${primary.name}`;
        why = `At about ${money(bill)} a year of private doctor bills, this pays back about ${money(r.paid)} for ${money(r.premium)} in premiums. That’s the lowest yearly total among the plans in your budget.`;
      }
      if (a.goal === 'unsure') alternatives = [...alternatives.slice(0, 1), byId('gen-premium')];
    } else if (a.goal === 'hospital' || a.goal === 'both' || a.goal === 'big') {
      const ranked = rank(a.goal === 'both' ? ['gen-premium', 'gen-premium-plus'] : ['gen-premium'], bill, budget);
      if (ranked.length) {
        primary = ranked[0].plan;
        headline = `${primary.insurer} ${primary.name}`;
        why = a.goal === 'big'
          ? 'ÖGK already pays for necessary treatment in public hospitals. If you want a serious illness treated privately, Premium pays contract-hospital bills in full with no euro limit (Generali confirmed this in writing). Your share in Vienna is at most €1,500 a year.'
          : 'It’s the only plan here with a private twin room for illness as well as accidents. Contract-hospital bills are paid in full, doctors’ fees included.';
        if (primary.id === 'gen-premium-plus') why += ` With about ${money(bill)} a year of doctor bills, the bigger doctor limit pays for itself.`;
        alternatives = ranked.slice(1).map(r => r.plan);
        if (a.goal !== 'big') alternatives.push(byId('gen-classic'));
      } else if (a.goal === 'big') {
        primary = byId('oegk'); fit = 'none';
        headline = 'Public cover already pays big hospital bills';
        why = 'ÖGK pays for necessary treatment in public hospitals, however expensive it gets. Private hospital cover (Generali Premium, €164.86 a month) buys comfort and choice. It isn’t what stops a huge bill.';
        alternatives = [byId('gen-premium')];
      } else if (budget >= byId('gen-classic').monthly) {
        primary = byId('gen-classic'); fit = 'partial';
        headline = 'Generali Classic';
        why = `Full private hospital cover (Generali Premium, ${money(164.86, true)} a month) is above your budget. Classic gets you a private room after accidents, cash for illness stays, and doctor cover.`;
        alternatives = [byId('gen-premium')];
      } else {
        primary = byId('oegk'); fit = 'none';
        headline = 'Stay with public cover for now';
        why = 'Private hospital cover starts at €72.68 a month (accidents only) and €164.86 a month (illness too). Public hospitals already cover necessary treatment.';
        alternatives = [byId('gen-classic'), byId('gen-premium')];
      }
      if (a.goal === 'big') {
        alternatives = [...alternatives.filter(p => p.kind !== 'accident'), byId('cigna'), byId('allianz')];
        notes.push({tone:'warn', title:'Very expensive medicines are the real gap',
          text:'Austrian plans cap prescription medicines at €415–€1,038 a year. Generali confirmed the cap applies even to a €100,000 drug that ÖGK won’t pay. Only international plans offer broad drug cover, and only for eligible expats. Ask ÖGK about approval first.'});
      }
    }
    if (a.condition !== 'no') notes.unshift({tone:'warn', title:'About your health condition',
      text:'Tell the insurer everything before you sign. Treatment that started before the contract is never covered. A condition you declare in writing is covered unless they exclude it in writing. You’ll only see your exclusions and final price after their health check.'});
    const year = {self: self.total, plan: yearCost(primary, bill)};
    const next = [...primary.next];
    if (a.condition !== 'no' && primary.id !== 'oegk') next.unshift({text:'Disclose your condition and get the insurer’s answer in writing before you rely on the policy.'});
    if (primary.id !== 'oegk') next.push({text:'Don’t cancel any existing cover until the new policy is issued.'});
    return {answers:a, primary, fit, headline, why, alternatives:alternatives.filter((p, i, l) => p && p.id !== primary.id && l.indexOf(p) === i).slice(0, 3),
      notes, year, next, saving: round(year.self - year.plan.total)};
  }

  const api = {plans, byId, budgets, doctorPaid, yearCost, breakEven, match, money, links};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InsuranceDecision = api;
})(typeof window !== 'undefined' ? window : globalThis);
