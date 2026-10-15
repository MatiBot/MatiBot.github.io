const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../insurancepicker/decision-model.js');
const plan=id=>M.byId(id);
const base={goal:'doctor',spend:1000,budget:'any',condition:'no'};

test('Generali prices are the quoted health parts for the 40-year-old adult',()=>{
  assert.equal(plan('gen-basic').monthly,65.38);
  assert.equal(plan('gen-classic').monthly,72.68);
  assert.equal(plan('gen-premium').monthly,164.86);
  // The full Premium quote, including optional accident insurance, stays €177.22.
  assert.equal(round(plan('gen-premium').monthly+plan('gen-premium').accident),177.22);
  assert.ok(plan('gen-basic-plus').estimate && plan('gen-premium-plus').estimate);
});
function round(n){return Math.round(n*100)/100;}

test('Doctor refunds use 80% up to each yearly limit',()=>{
  assert.equal(M.doctorPaid(plan('gen-basic'),1000),800);
  assert.equal(M.doctorPaid(plan('gen-basic'),5000),1805);
  assert.equal(M.doctorPaid(plan('ws-premium'),5000),4000);
  assert.equal(M.yearCost(plan('ws-premium'),5000).total,3225.88);
  assert.equal(M.doctorPaid(plan('oegk'),5000),0);
});
test('The higher Generali tier pays 25% of fees beyond its limit',()=>{
  const p=plan('gen-basic-plus');
  assert.equal(M.doctorPaid(p,4000),3200);
  assert.equal(M.doctorPaid(p,8000),4547.19);
});
test('Break-even bills are honest, and Premium never pays off on doctor bills alone',()=>{
  assert.equal(M.breakEven(plan('gen-basic')),981);
  assert.equal(M.breakEven(plan('ws-classic')),1922);
  assert.equal(M.breakEven(plan('ws-premium')),2783);
  assert.equal(M.breakEven(plan('gen-premium')),null);
});
test('Low doctor spending recommends keeping ÖGK and paying as you go',()=>{
  const r=M.match({...base,spend:300});
  assert.equal(r.primary.id,'oegk');assert.match(r.why,/€981/);
  assert.equal(r.alternatives[0].id,'gen-basic');
});
test('Doctor spending picks the cheapest yearly total within budget',()=>{
  assert.equal(M.match({...base,spend:1500}).primary.id,'gen-basic');
  assert.equal(M.match({...base,spend:3000,budget:'b100'}).primary.id,'gen-basic-plus');
  assert.equal(M.match({...base,spend:8000}).primary.id,'ws-premium');
  assert.equal(M.match({...base,spend:8000,budget:'b100'}).primary.id,'gen-basic-plus');
  assert.equal(M.match({...base,spend:3000,budget:'b50'}).primary.id,'oegk');
});
test('A recommended doctor plan never costs more than paying yourself',()=>{
  for(const spend of [0,500,1000,1500,2500,4000,6000,8000]) for(const budget of Object.keys(M.budgets)){
    const r=M.match({...base,spend,budget});
    assert.ok(r.saving>=0,`${spend} ${budget}`);
  }
});
test('Hospital wishes get Premium, or an honest fallback on smaller budgets',()=>{
  const h={...base,goal:'hospital'};
  assert.equal(M.match(h).primary.id,'gen-premium');
  const mid=M.match({...h,budget:'b100'});
  assert.equal(mid.primary.id,'gen-classic');assert.equal(mid.fit,'partial');
  assert.ok(mid.primary.gaps.some(g=>/not private/.test(g)));
  const low=M.match({...h,budget:'b50'});
  assert.equal(low.primary.id,'oegk');assert.equal(low.fit,'none');
});
test('Both hospital and doctors: the bigger doctor tier wins only with high bills',()=>{
  assert.equal(M.match({...base,goal:'both',spend:1000}).primary.id,'gen-premium');
  assert.equal(M.match({...base,goal:'both',spend:4000}).primary.id,'gen-premium-plus');
});
test('Huge-bill worries flag the medicine gap and point to international plans',()=>{
  const r=M.match({...base,goal:'big'});
  assert.equal(r.primary.id,'gen-premium');
  assert.ok(r.notes.some(n=>/medicines/.test(n.title)));
  assert.deepEqual(r.alternatives.map(p=>p.id).slice(-2),['cigna','allianz']);
  const cheap=M.match({...base,goal:'big',budget:'b100'});
  assert.equal(cheap.primary.id,'oegk');
  assert.ok(!cheap.alternatives.some(p=>p.id==='gen-classic'));
});
test('A known or unsure condition always adds the disclosure warning',()=>{
  for(const goal of ['hospital','doctor','both','big','unsure']) for(const condition of ['yes','unsure']){
    const r=M.match({...base,goal,condition});
    assert.match(r.notes[0].text,/declare it in writing|declare in writing/);
  }
  assert.equal(M.match(base).notes.length,0);
});
test('Unsure users get a spending answer plus the hospital option',()=>{
  const r=M.match({...base,goal:'unsure',spend:300});
  assert.equal(r.primary.id,'oegk');
  assert.ok(r.alternatives.some(p=>p.id==='gen-premium'));
});
test('Benchmarks and estimates are labelled, never presented as quotes',()=>{
  for(const p of M.plans){
    if(p.benchmark) assert.match(p.source,/benchmark|example/i);
    if(p.estimate) assert.match(p.source,/Estimate/);
  }
  assert.equal(M.match({goal:'nonsense'}),null);
});
