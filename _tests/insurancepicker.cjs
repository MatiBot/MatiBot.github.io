const {test}=require('node:test');
const assert=require('node:assert/strict');
const {evaluate}=require('../insurancepicker/decision-model.js');
const baseline={priority:'routine',known:'no',budget:200,visits:1000};
test('Full bundle never masquerades as a €45.49 outpatient offer',()=>{
  const r=evaluate(baseline);
  assert.equal(r.candidate.id,'self');
  assert.equal(r.rows.find(p=>p.id==='full').total,2326.64);
  assert.equal(r.rows.find(p=>p.id==='full').annual,2126.64);
  assert.ok(!r.rows.some(p=>p.id==='outpatient'));
});
test('An actual outpatient quote can change the answer',()=>{
  const r=evaluate({...baseline,outpatient:45.49});
  assert.equal(r.candidate.id,'outpatient');assert.equal(r.candidate.total,745.88);assert.equal(r.saving,254.12);
});
test('Revised quotes use the entered price, not old component figures',()=>{
  const r=evaluate({...baseline,outpatient:90});
  assert.equal(r.candidate.id,'self');assert.equal(r.rows.find(p=>p.id==='outpatient').total,1280);
});
test('Hospital priority requires hospital cover and the full premium',()=>{
  const r=evaluate({...baseline,priority:'hospital'});
  assert.equal(r.candidate.id,'full');assert.equal(r.candidate.monthly,177.22);assert.equal(r.cap,1500);
});
test('Hospital budget shortfall produces a quote request, no invented offer',()=>{
  const r=evaluate({...baseline,priority:'hospital',budget:150});
  assert.equal(r.candidate,null);assert.match(r.title,/hospital-only quote/);
});
test('A hospital-only offer can beat a bundle when routine use is low',()=>{
  const r=evaluate({...baseline,priority:'both',visits:0,hospital:117.13});
  assert.equal(r.candidate.id,'hospital');assert.equal(r.candidate.total,1405.56);
});
test('Higher outpatient use can favor Premium or Classic within budget',()=>{
  const r=evaluate({...baseline,visits:5000});
  assert.equal(r.candidate.id,'premium');assert.equal(r.candidate.total,3225.88);
  assert.equal(evaluate({...baseline,visits:5000,budget:160}).candidate.id,'classic');
});
test('Mixed public refunds are calculated bill-pool by bill-pool',()=>{
  const r=evaluate({...baseline,outpatient:45.49,visits:1000,fundedVisits:1000,refund:200});
  const p=r.rows.find(p=>p.id==='outpatient');
  assert.equal(r.net,1800);assert.equal(p.paid,1600);assert.equal(p.remaining,200);assert.equal(p.total,745.88);
});
test('Annual doctor caps still apply after public reimbursement',()=>{
  const r=evaluate({...baseline,outpatient:45.49,visits:5000,fundedVisits:1000,refund:200});
  assert.equal(r.rows.find(p=>p.id==='outpatient').paid,1805);
});
test('Known care overrides the illustrative price winner',()=>{
  const r=evaluate({...baseline,outpatient:45.49,known:'yes'});
  assert.equal(r.underwriting,true);assert.match(r.title,/known issue/);
  assert.equal(r.candidate.id,'outpatient');
});
test('A medicine priority never names a local plan as the answer',()=>{
  const r=evaluate({...baseline,priority:'medicine'});
  assert.equal(r.status,'No confirmed fit yet');assert.equal(r.medicine,true);assert.match(r.title,/coverage decision/);assert.equal(r.candidate,null);
});
test('Medicine as a secondary concern remains explicitly unresolved',()=>{
  const r=evaluate({...baseline,edges:['medicine']});
  assert.equal(r.candidate.id,'self');assert.equal(r.medicine,true);assert.ok(r.next.some(x=>x.includes('Cigna')));
});
test('Hospital deductible, room, province and year boundaries matter',()=>{
  const b={...baseline,priority:'hospital',reserve:'1500'};
  assert.equal(evaluate({...b,room:'single'}).reserveMismatch,true);
  assert.equal(evaluate({...b,region:'lower',reserve:'0'}).reserveMismatch,false);
  assert.equal(evaluate({...b,region:'lower',room:'single'}).cap,null);
  const ny=evaluate({...b,edges:['newyear']});
  assert.equal(ny.reserveNeeded,3000);assert.equal(ny.reserveMismatch,true);
});
test('A noncontract provider requires written confirmation',()=>{
  const r=evaluate({...baseline,priority:'hospital',provider:'noncontract'});
  assert.equal(r.providerCheck,true);assert.match(r.title,/exact surgeon/);
});
test('No claims and lowest recurring premium can favor self pay',()=>{
  assert.equal(evaluate({...baseline,visits:0}).candidate.total,0);
  assert.equal(evaluate({...baseline,priority:'budget',visits:5000,outpatient:45.49}).candidate.id,'self');
});
test('Family scope prices the known adults only and requires child quotes',()=>{
  const r=evaluate({...baseline,scope:'family'});
  assert.match(r.status,/children still need quotes/);assert.equal(r.rows.find(p=>p.id==='full').monthly,364.19);
  assert.ok(r.next.some(x=>x.includes('child-inclusive')));
});
test('Therapy flag makes the visit-only ranking explicitly incomplete',()=>{
  const r=evaluate({...baseline,edges:['therapy']});
  assert.equal(r.widerReview,true);assert.ok(r.next.some(x=>x.includes('combined benefits')));
});
test('Couple mode uses the actual proposal rather than doubling one adult',()=>{
  const r=evaluate({...baseline,scope:'couple',budget:400,priority:'both'});
  assert.equal(r.candidate.id,'full');assert.equal(r.candidate.annual,4370.28);
  assert.equal(r.candidate.paid,1600);assert.equal(r.candidate.total,4770.28);
  assert.ok(!r.rows.some(p=>p.id==='classic'||p.id==='premium'));
});
test('One partner cannot borrow the other partner’s unused allowance',()=>{
  const r=evaluate({...baseline,scope:'couple',budget:400,visits:10000,partnerVisits:0});
  assert.equal(r.rows.find(p=>p.id==='full').paid,1805);
  assert.equal(r.generaliAllowance,1805);
});
test('An entered couple quote can rank, using separate per-person limits',()=>{
  const r=evaluate({...baseline,scope:'couple',budget:400,visits:5000,partnerVisits:5000,classicQuote:265});
  assert.equal(r.candidate.id,'classic');assert.equal(r.candidate.paid,6400);
  assert.equal(r.candidate.total,6780);
});
