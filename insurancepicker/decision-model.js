/* Decision rules use the 23 September proposal and 15 October comparison.
 * Adult and couple premiums use the actual proposal; child costs are unknown.
 * No probabilities, medical eligibility or unquoted prices are estimated.
 */
(function (root) {
  'use strict';
  const money = n => new Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2}).format(n);
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const number = (v, max = 1000000) => Math.max(0, Math.min(max, Number(v) || 0));
  const defaults = {scope:'adult', priority:'', budget:'', visits:1000, fundedVisits:0, refund:0,
    partnerVisits:1000,partnerFundedVisits:0,partnerRefund:0,classicQuote:'',premiumQuote:'',
    region:'vienna', room:'twin', provider:'flexible', reserve:'1500', known:'',
    edges:[], full:177.22, health:'', hospital:'', outpatient:''};
  const edges = [
    {id:'waiting', title:'A long wait for elective surgery', hint:'I want an earlier private option.',
      benefit:'Hospital cover may fund an eligible private operation, including illness surgery.',
      gap:'An outpatient policy does not fund an inpatient operation. No appointment date or maximum wait is guaranteed.',
      next:'Get actual dates from the surgeon and a written hospital cost guarantee before booking.'},
    {id:'accident', title:'Surgery after an accident', hint:'Is this different from illness?',
      benefit:'Generali hospital cover includes eligible illness and accident treatment.',
      gap:'The twin room deductible waiver is for covered accident consequences treated within two years. The separate accident-policy premium is not the price of hospital cover.',
      next:'Confirm the accident date, treatment link and deductible waiver. Do not replace illness hospital cover with accident-only insurance.'},
    {id:'dayclinic', title:'Day clinic or outpatient surgery', hint:'An operation without an overnight stay.',
      benefit:'Qualifying day clinic treatment can fall under the hospital guarantee.',
      gap:'A separately classified ambulatory operation instead has Generali tariff limits of €650–€3,468 by operation group.',
      next:'Ask the insurer to classify the exact procedure and confirm the payment amount in writing.'},
    {id:'implant', title:'A specific surgeon, clinic or costly implant', hint:'I want to choose the provider or prosthesis.',
      benefit:'Contract hospital treatment can include a direct cost guarantee.',
      gap:'Noncontract tariffs or excluded surgeon, anaesthesia, facility or implant charges can leave a much larger bill. €1,500 is not a global cap.',
      next:'Send the complete itemised estimate to the insurer and obtain a guarantee for each charge.'},
    {id:'checkup', title:'A routine medical check', hint:'Screening while I feel healthy.',
      benefit:'The standard Austrian preventive check is available through participating providers at public expense.',
      gap:'Private screening is a separate benefit; Generali prevention has a €205 sublimit, not the full doctor allowance.',
      next:'Book the public check first. Price optional private screening separately from diagnostic scans for symptoms.'},
    {id:'medicine', title:'A €100,000 medicine bill ÖGK refuses', hint:'A stress test, not expected yearly spending.',
      benefit:'Cigna Platinum + outpatient and Allianz Signature + outpatient are candidates for broader eligible prescribed-drug cover.',
      gap:'Generali’s €415 and Wiener’s €519/€1,038 drug limits leave almost all of this bill unpaid. No international policy is confirmed for this particular scenario.',
      next:'First establish ÖGK’s approval options. Then request Austrian eligibility, full premiums and written cover for the drug, indication, setting and ongoing renewals.'},
    {id:'offlabel', title:'Experimental or off-label treatment', hint:'A treatment outside ordinary approval.',
      benefit:'Only a specific policy coverage decision can establish whether off-label care qualifies.',
      gap:'Experimental treatment is excluded by the international candidates. Large limits and a hospital admission do not create cover.',
      next:'Get the exact medicine or procedure and indication assessed before relying on any plan.'},
    {id:'therapy', title:'Repeated physiotherapy or other claims', hint:'Several types of care in the same year.',
      benefit:'Prescribed therapy may qualify; Wiener has separate therapy allowances.',
      gap:'The visit-only cost ranking below excludes these expenses. Generali’s €415 therapy and medicine sublimits sit inside its shared €1,805 annual total; other claims reduce what remains for visits.',
      next:'Request a combined annual calculation for visits, therapy and medicines before choosing on price.'},
    {id:'newyear', title:'A hospital stay over New Year', hint:'Two calendar years in one treatment course.',
      benefit:'The stated hospital deductible has a calendar-year cap.',
      gap:'A stay across two years can encounter two annual caps. The cap is not automatically per stay.',
      next:'Confirm how days will be allocated across the two years and budget for that possibility.'},
    {id:'healthy', title:'A healthy year with no claims', hint:'What if we never use it?',
      benefit:'Hospital insurance still transfers a future covered private-treatment risk.',
      gap:'Premiums continue. Generali’s conditional refund is 15% of the eligible outpatient premium (about €81.88 for the first quoted adult); it does not refund the full package.',
      next:'Check that the annual premium is acceptable even with no claims. Treat any refund as conditional.'},
    {id:'switching', title:'Premium increases or switching later', hint:'This must work beyond the first year.',
      benefit:'Buying approved cover now may avoid a fresh health assessment for that same existing contract later.',
      gap:'The proposal has value adjustment, a 5% family discount for three years and first ordinary cancellation at the end of year three. A new insurer may underwrite you again.',
      next:'Ask for the price after the discount, adjustment rules and cancellation terms; do not cancel existing cover before new acceptance.'}
  ];

  function evaluate(input) {
    const a = {...defaults, ...input};
    a.edges = Array.isArray(a.edges) ? a.edges.filter(id => edges.some(e => e.id === id)) : [];
    a.budget = number(a.budget, 10000);
    a.visits = number(a.visits);
    a.fundedVisits = number(a.fundedVisits);
    a.refund = Math.min(number(a.refund), a.fundedVisits);
    const people=a.scope==='adult'?1:2;
    a.partnerVisits=number(a.partnerVisits);
    a.partnerFundedVisits=number(a.partnerFundedVisits);
    a.partnerRefund=Math.min(number(a.partnerRefund),a.partnerFundedVisits);
    const pools=[{net:round(a.visits+a.fundedVisits-a.refund),claim:round(.8*a.visits+(a.refund>0?a.fundedVisits-a.refund:.8*a.fundedVisits))}];
    if(people===2) pools.push({net:round(a.partnerVisits+a.partnerFundedVisits-a.partnerRefund),claim:round(.8*a.partnerVisits+(a.partnerRefund>0?a.partnerFundedVisits-a.partnerRefund:.8*a.partnerFundedVisits))});
    const net = round(pools.reduce((n,p)=>n+p.net,0));
    // An ÖGK contribution must apply to each bill in the second pool.
    // If no refund is entered, that pool uses the 80% no-public-refund rule.
    const reimbursable = round(pools.reduce((n,p)=>n+p.claim,0));
    const generaliAllowance=round(pools.reduce((n,p)=>n+Math.min(1805,p.claim,p.net),0));
    const base = [
      {id:'self',name:'ÖGK + self pay',monthly:0,limit:0,hospital:false,basis:'No private premium'},
      {id:'full',name:'Generali full package',monthly:people===1?177.22:364.19,limit:1805,hospital:true,basis:people===1?'Quoted adult proposal; underwriting pending':'Actual two-adult proposal; underwriting pending',extras:true}
    ];
    if(people===1||Number(a.classicQuote)>0) base.push({id:'classic',name:'Wiener Classic outpatient',monthly:people===1?128.07:number(a.classicQuote,10000),limit:3200,hospital:false,basis:people===1?'Age 40 price example; personal quote needed':'Two-adult price entered by you; terms must match'});
    if(people===1||Number(a.premiumQuote)>0) base.push({id:'premium',name:'Wiener Premium outpatient',monthly:people===1?185.49:number(a.premiumQuote,10000),limit:6400,hospital:false,basis:people===1?'Age 40 price example; personal quote needed':'Two-adult price entered by you; terms must match'});
    for (const [id,name,limit,hospital] of [
      ['health','Generali hospital + outpatient',1805,true],
      ['hospital','Generali hospital only + self-paid visits',0,true],
      ['outpatient','Generali outpatient only',1805,false]
    ]) {
      if (a[id] !== '' && Number(a[id]) > 0) base.push({id,name,monthly:number(a[id],10000),limit,hospital,basis:'Revised price entered by you; terms must match'});
    }
    const wantsHospital = a.priority === 'hospital' || a.priority === 'both';
    const medicine = a.priority === 'medicine' || a.edges.includes('medicine');
    const rows = base.map(p => {
      // Each person's allowance is separate; unused limits cannot transfer.
      const paid = round(pools.reduce((sum,person)=>sum+Math.min(p.limit,person.claim,person.net),0));
      const remaining = round(net-paid), annual = round(p.monthly*12);
      return {...p,annual,paid,remaining,total:round(annual+remaining),affordable:p.monthly<=a.budget,
        meetsPriority:!wantsHospital||p.hospital};
    }).sort((x,y)=>x.total-y.total || x.monthly-y.monthly);
    const qualifying = rows.filter(p => p.affordable && p.meetsPriority);
    const candidate = a.priority==='medicine' ? null : a.priority==='budget' ? rows.find(p=>p.id==='self') : (qualifying[0] || null);
    const self = rows.find(p=>p.id==='self');
    const cap = a.region==='vienna' ? (a.room==='single'?1855:1500) : a.region==='lower'&&a.room==='twin' ? 0 : null;
    const years = a.edges.includes('newyear') ? 2 : 1;
    const reserveNeeded = cap===null?null:cap*years;
    const reserveKnown = a.reserve !== 'unknown';
    const reserveMismatch = wantsHospital && (cap===null || !reserveKnown || number(a.reserve)<reserveNeeded);
    const providerCheck = wantsHospital && (a.provider!=='flexible'||a.edges.includes('implant'));
    const underwriting = a.known !== 'no';
    const widerReview = a.edges.includes('therapy') || a.edges.includes('offlabel');
    let title, status, why;
    if (a.priority==='medicine') {
      status='No confirmed fit yet'; title='Get a major-medicine coverage decision first';
      why='None of the priced local options protects against the stated €100,000 drug bill. Cigna and Allianz need Austrian quotes and a written answer for the specific treatment before either can be ranked.';
    } else if (underwriting) {
      status='Coverage decision comes first'; title='Confirm the known issue before choosing a policy';
      why='A new policy may exclude current symptoms, an existing condition or already-planned treatment. The cost comparison is only for future eligible bills; it does not predict reimbursement for the known issue.';
    } else if (!candidate && wantsHospital) {
      status='No priced hospital option within budget'; title='Request a hospital-only quote first';
      why='The proposed package exceeds your monthly limit, and an unconfirmed component price cannot be treated as an offer. Keep ÖGK and use self pay selectively while obtaining a suitable hospital quote.';
    } else if (reserveMismatch) {
      status='Deductible terms need to change or be confirmed'; title='Resolve the hospital deductible before buying';
      why=cap===null?'We have no verified deductible for this room and province combination. A plan cannot be called a fit until the insurer supplies the applicable terms.':!reserveKnown?'You have not yet set an amount you can comfortably pay when admitted. Confirm the deductible and decide on that reserve first.':`Your chosen hospital setting can require ${money(reserveNeeded)} per person under the stated deductible${years===2?' across two calendar years':''}, above your ${money(number(a.reserve))} per-person reserve. Excluded charges could add more.`;
    } else if (providerCheck) {
      status='Provider approval comes first'; title='Check your exact surgeon and hospital';
      why='The quoted deductible cap applies within the stated hospital cover. It is not a ceiling on noncontract or excluded charges. Obtain an itemised cost guarantee before treating a policy as a fit.';
    } else {
      status=a.scope==='family'?'Adult comparison only; children still need quotes':'Best fit to investigate among the priced options';
      title=candidate.name;
      if (a.priority==='budget') why='You chose the lowest fixed monthly commitment. ÖGK + self pay has no private premium, though your actual private bills may be higher than with a suitable outpatient policy.';
      else if (candidate.id==='self') why='For the eligible visits you entered, self pay has the lowest modelled annual cost among options within your budget. Paying for the full Generali package solely to reimburse these visits does not pay off in this example.';
      else if (wantsHospital) why=`You prioritised funding private hospital treatment. This is the lowest modelled premium-plus-visits total among the entered hospital options within your budget. The hospital benefit covers eligible illness surgery as well as accidents; actual surgery costs and deductibles are additional to this routine-year comparison.`;
      else why='This has the lowest modelled annual cost for your eligible visits among the compared options within your monthly budget. This is a spending calculation, not a prediction of future claims or an assessment of every insurer on the market.';
    }
    const next = [];
    if (underwriting) next.push('Obtain written underwriting for the existing issue or planned care, including exclusions, waiting periods and any surcharge. Do not book treatment expecting a new policy to pay.');
    if (candidate?.id==='self'&&!underwriting) next.push('Keep ÖGK and set aside money for the private visits you expect. You can use private appointments while waiting for better-matched quotes.');
    if (medicine) {
      next.push('Establish whether ÖGK can approve the medicine, including exceptional reimbursement routes. Identify the drug, indication and outpatient setting.');
      next.push('Request Cigna Platinum + International Outpatient and Allianz Care Signature + outpatient quotes for Austrian residence: all required modules, deductible, cost sharing maximum, eligibility and written drug coverage.');
    }
    if (wantsHospital || a.edges.includes('waiting')) {
      if (a.hospital==='') next.push(`Ask Generali for an actual hospital-only price. ${people===1?'€117.13':'€242.68'}/month is a component ${people===1?'in the current package':'sum for both adults'}, not a confirmed standalone offer. Request the health-only price too; ${people===1?'€162.62':'€334.05'} is its current component sum.`);
      next.push('Check the contract hospitals and surgeons you would use, the earliest available dates, room type, deductible and written total cost guarantee.');
      if (reserveMismatch) next.push(cap===null?'Obtain the deductible for this exact province and room before comparing hospital prices.':`Find terms you can fund: the current scenario may require ${money(reserveNeeded)} in deductibles. Ask about a lower-deductible tariff or a suitable Lower Austria contract twin room; confirm the revised premium.`);
    }
    if (a.outpatient==='' && ['routine','both'].includes(a.priority)) next.push(`Request a standalone Generali 1AJ offer. ${people===1?'€45.49':'€91.37'}/month is only the current package component ${people===1?'price':'sum for both adults'}. Add the actual standalone price here if it is offered, including any lost discounts.`);
    if (candidate && ['classic','premium'].includes(candidate.id)) next.push(`Confirm a personal, underwritten ${candidate.name} offer. ${people===1?'The displayed monthly price is an age 40 calculator example.':'The price entered must cover both adults with the modelled benefits.'} It buys outpatient cover only.`);
    if (candidate?.id==='full') next.push(`Ask whether travel and accident extras are useful to you and what the price becomes if removed. This comparison charges the entire ${people===1?'€177.22':'€364.19'}/month proposal; it does not count unmodelled travel or accident cash benefits as savings.`);
    if (widerReview) next.push('Get a combined benefits calculation for the other treatments you selected. These can consume shared limits or fall outside cover; the visit-only ranking is incomplete for those costs.');
    if (people===2&&(a.classicQuote===''||a.premiumQuote==='')) next.push('Request comparable two-adult Wiener quotes if outpatient cover is relevant. The age 40 example cannot simply be doubled for the second adult. The Generali full-package total of €364.19/month is already known from the two-adult proposal.');
    if (a.scope==='family') next.push('Obtain a child-inclusive family proposal and accepted terms for each person. The €364.19/month Generali proposal covers the two quoted adults only; no child premium or benefit is included in this model.');
    if (candidate&&candidate.id!=='self') next.push('Before buying, confirm the final underwritten premium, exclusions, waiting periods, discount expiry and cancellation terms in writing.');
    if (!next.length) next.push('Keep ÖGK, set aside a private-care budget and pay selectively. Revisit the comparison if expected eligible spending or the value you place on private hospital access changes.');
    return {answers:a,people,rows,candidate,self,net,reimbursable,generaliAllowance,wantsHospital,medicine,cap,reserveNeeded,underwriting,
      reserveMismatch,providerCheck,widerReview,title,status,why,next,
      selectedEdges:edges.filter(e=>a.edges.includes(e.id)),
      saving:candidate?round(self.total-candidate.total):null};
  }
  const api = {defaults,edges,evaluate,money};
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.InsuranceDecision=api;
})(typeof window!=='undefined'?window:globalThis);
