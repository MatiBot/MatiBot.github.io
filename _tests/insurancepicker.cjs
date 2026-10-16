const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../insurancepicker/decision-model.js');
const plan=id=>M.byId(id);
const year=(levels,room,cause)=>M.usageFrom({visits:0,tests:0,therapy:0,meds:0,hospital:0,...levels},room,cause);
const cost=(id,u)=>M.yearCost(plan(id),u);

test('Generali prices are the quoted health parts for the 40-year-old adult',()=>{
  assert.equal(plan('gen-basic').monthly,65.38);
  assert.equal(plan('gen-classic').monthly,72.68);
  assert.equal(plan('gen-premium').monthly,164.86);
  assert.equal(Math.round((plan('gen-premium').monthly+plan('gen-premium').accident)*100)/100,177.22);
});
test('No private insurance is always ranked: €0 premiums, every bill out of pocket',()=>{
  for(const p of M.presets) for(const room of ['private','public']){
    const u=M.usageFrom(p.levels,room,'illness'), r=M.rank(u);
    assert.equal(r.rows.length,M.plans.length);
    assert.equal(r.none.premium,0);
    assert.equal(r.none.total,M.bills(u));
  }
});
test('Every kind of care has five levels, and presets use them',()=>{
  for(const c of M.care) assert.equal(c.levels.length,5);
  for(const p of M.presets) for(const c of M.care) assert.ok(p.levels[c.key]>=0&&p.levels[c.key]<=4);
});
test('Outpatient bills: 80% back within each limit, and Generali’s shared total',()=>{
  const u=year({visits:4});
  assert.equal(M.outpatientPaid(plan('gen-basic'),u),1805);
  assert.equal(M.outpatientPaid(plan('ws-premium'),u),2400);
  // Generali's €1,805 is shared by doctors, therapy and medicines.
  assert.equal(M.outpatientPaid(plan('gen-basic'),year({visits:4,therapy:4,meds:3})),1805);
  // Wiener's therapy and medicine allowances sit on top of the doctor limit.
  assert.equal(M.outpatientPaid(plan('ws-classic'),year({visits:4,therapy:4,meds:3})),2400+613+519);
});
test('The bigger Generali doctor tier pays 25% beyond its limit',()=>{
  const u=year({visits:4,tests:4});
  assert.equal(M.outpatientPaid(plan('gen-basic-plus'),u),Math.round((3705+.25*(5500-3705/.8))*100)/100);
});
test('A €100k medicine leaves almost the whole bill with Austrian plans',()=>{
  const u=year({meds:4});
  assert.equal(cost('gen-premium',u).youPay,100000-415);
  assert.equal(cost('ws-premium',u).youPay,100000-1038);
  assert.equal(cost('cigna',u).youPay,0);assert.ok(cost('cigna',u).unknown);
});
test('Private hospital: Premium caps the Vienna excess at five days',()=>{
  const u=year({hospital:4},'private','illness');
  assert.equal(cost('gen-premium',u).youPay,1500);
  assert.equal(cost('oegk',u).youPay,100000);
  assert.equal(cost('gen-premium',year({hospital:1})).youPay,300);
  assert.equal(cost('gen-premium',year({hospital:4},'private','accident')).youPay,0);
});
test('Classic: private after accidents, daily cash for illness',()=>{
  const ill=cost('gen-classic',year({hospital:2},'private','illness'));
  assert.equal(ill.youPay,15000);assert.equal(ill.cash,162);
  assert.equal(cost('gen-classic',year({hospital:2},'private','accident')).youPay,0);
  assert.equal(cost('gen-classic',year({hospital:2},'public','accident')).cash,480);
});
test('Public ward: ÖGK pays, and some plans pay cash per day',()=>{
  const u=year({hospital:2},'public');
  assert.equal(M.bills(u),0);
  assert.equal(cost('oegk',u).total,0);
  assert.equal(cost('gen-basic',u).cash,150);
  assert.equal(cost('gen-premium',u).cash,390);
  assert.equal(cost('ws-classic',u).cash,0);
});
test('The winner always has an Austrian price; benchmarks only get a note',()=>{
  for(const p of M.presets) for(const room of ['private','public']){
    const r=M.rank(M.usageFrom(p.levels,room,'illness'));
    assert.ok(!r.winner.unknown);
    assert.equal(r.saving,Math.round((r.none.total-r.winner.total)*100)/100);
  }
});
test('Typical years pick sensible winners',()=>{
  const pick=id=>M.rank(M.usageFrom(M.presets.find(p=>p.id===id).levels,'private','illness')).winner.plan.id;
  assert.equal(pick('healthy'),'oegk');
  assert.equal(pick('normal'),'oegk');
  assert.equal(pick('busy'),'gen-basic');
  assert.equal(pick('rough'),'gen-premium-plus');
});
test('Only the international plans move with you',()=>{
  for(const p of M.plans) assert.equal(M.portable(p),p.id==='cigna'||p.id==='allianz');
  for(const p of M.plans) assert.ok(p.cells.move&&p.meter.move>=0);
});
test('Estimates and benchmarks are labelled',()=>{
  for(const p of M.plans){
    if(p.benchmark) assert.equal(p.source.type,'bench');
    if(p.id.endsWith('-plus')) assert.equal(p.source.type,'estimate');
  }
  assert.equal(M.breakEven(plan('gen-basic')),981);
  assert.equal(M.breakEven(plan('gen-premium')),null);
});
test('Breakdown: what you pay plus what the insurer pays equals your bills',()=>{
  for(const p of M.presets) for(const room of ['private','public']) for(const baby of ['none','public','private']){
    const u=M.usageFrom(p.levels,room,'illness',baby);
    for(const plan of M.plans){
      const c=M.yearCost(plan,u);
      assert.equal(Math.round(c.youPay+c.insurerPays),Math.round(M.bills(u)),`${plan.id} ${p.id} ${room} ${baby}`);
      assert.equal(Math.round(c.parts.doctors+c.parts.therapy+c.parts.meds+c.parts.hospital),Math.round(c.youPay));
    }
  }
});
test('Birth: Generali pays cash or covers a private room, and shares Premium’s 5-day excess',()=>{
  const pub=M.usageFrom({},'private','illness','public');
  assert.equal(M.bills(pub),0);
  assert.equal(cost('gen-premium',pub).cash,1517);
  assert.equal(cost('gen-basic',pub).cash,300);
  assert.equal(cost('gen-classic',pub).cash,324);
  const priv=M.usageFrom({},'private','illness','private');
  assert.equal(cost('oegk',priv).youPay,6000);
  assert.equal(cost('gen-premium',priv).youPay,1200);
  // A 3-night stay plus a 4-night birth still caps the excess at 5 days.
  const both=M.usageFrom({hospital:2},'private','illness','private');
  assert.equal(cost('gen-premium',both).youPay,1500);
});
test('Every plan says something about pregnancy, Israel and the USA',()=>{
  for(const p of M.plans) for(const k of ['baby','israel','usa']){
    assert.ok(p.cells[k]&&p.cells[k]!=='Checking',`${p.id} ${k}`);
    assert.ok(p.meter[k]>=-1&&p.meter[k]<=5);
  }
});
test('PassportCard: real price list, no deductible, medicines without a separate cap',()=>{
  const p=plan('passportcard');
  assert.equal(p.monthly,480);assert.ok(!p.benchmark);assert.equal(p.source.type,'list');
  const worst=M.usageFrom(M.presets.find(x=>x.id==='worst').levels,'private','illness');
  const c=M.yearCost(p,worst);
  // Everything is paid except physio beyond 24 visits at €38 each.
  assert.equal(c.parts.meds,0);assert.equal(c.parts.doctors,0);assert.equal(c.parts.hospital,0);
  assert.equal(c.parts.therapy,2800-912);
  assert.equal(M.rank(worst).winner.plan.id,'passportcard');
});
