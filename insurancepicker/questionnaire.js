(function () {
  'use strict';
  const host=document.getElementById('insurance-questionnaire');
  const model=window.InsuranceDecision;
  if (!host || !model) return;
  const answers={priority:'',budget:'',use:'',known:''};
  const options=(name,items)=>items.map(([value,label])=>`<label class="quick-option"><input type="radio" name="${name}" value="${value}"><span>${label}</span></label>`).join('');
  host.innerHTML=`<div class="quick-layout"><form class="quick-questions" aria-label="Choose insurance for both adults">
    <fieldset><legend><span>1</span> What matters most?</legend><div class="quick-options priorities">${options('priority',[
      ['hospital','Private surgery'],['routine','Visits & scans'],['medicine','Very costly medicines'],['cost','Keep costs low']
    ])}</div></fieldset>
    <fieldset id="quick-budget" hidden><legend><span>2</span> Is €364/month OK for both?</legend><p class="quick-hint">That is the full Generali package, with hospital cover.</p><div class="quick-options thirds">${options('budget',[
      ['yes','Yes'],['no','Too much'],['unsure','Not sure']
    ])}</div></fieldset>
    <fieldset id="quick-use" hidden><legend><span>2</span> How often would we go privately?</legend><div class="quick-options thirds">${options('use',[
      ['occasional','Sometimes'],['frequent','Often'],['unsure','Not sure']
    ])}</div></fieldset>
    <fieldset id="quick-known" hidden><legend><span id="known-number">2</span> Any known condition or planned care?</legend><div class="quick-options thirds">${options('known',[
      ['no','No'],['yes','Yes'],['unsure','Not sure']
    ])}</div></fieldset>
  </form><div id="picker-results" class="quick-result" role="status" aria-live="polite" aria-atomic="true"><p class="quick-kicker">Our suggested next step</p><h3>A few taps to decide.</h3><p>Choose what matters most. You’ll see the best starting point and what to do next.</p></div></div>`;
  const result=host.querySelector('#picker-results');
  const budget=host.querySelector('#quick-budget');
  const use=host.querySelector('#quick-use');
  const known=host.querySelector('#quick-known');
  function render() {
    budget.hidden=answers.priority!=='hospital';
    use.hidden=answers.priority!=='routine';
    known.hidden=!answers.priority;
    host.querySelector('#known-number').textContent=['hospital','routine'].includes(answers.priority)?'3':'2';
    const r=model.quickRecommendation(answers);
    if (!r) {
      result.innerHTML='<p class="quick-kicker">Our suggested next step</p><h3>Finish the choices above.</h3><p>No numbers to calculate. Change any answer to compare another option.</p>';
      return;
    }
    result.innerHTML=`<p class="quick-kicker">Our suggested next step · both adults</p><h3>${r.title}</h3><p>${r.why}</p><p class="quick-cost">${r.cost}</p><p class="quick-gap"><strong>Watch out:</strong> ${r.gap}</p><div class="quick-next"><strong>Do this next</strong><p>${r.next}</p></div>${answers.priority==='routine'&&answers.use!=='frequent'?'<small class="quick-footnote">*Eligible visits, no ÖGK refund, 80% reimbursed. An illustration, not your predicted spending.</small>':''}${answers.priority==='hospital'?'<details class="quick-detail"><summary>What does the €1,500 cap mean?</summary><p>For covered Vienna twin-room stays, your deductible is €300/day for at most five days per person per year: €1,500. This is not the most you could ever pay; excluded charges can be extra. Other rooms, regions and year boundaries change the amount.</p></details>':''}<a class="quick-reference" href="#full-comparison">See prices & all scenarios ↓</a>`;
  }
  host.querySelector('form').addEventListener('change',event=>{
    const input=event.target;
    if (input.type!=='radio' || !Object.hasOwn(answers,input.name)) return;
    answers[input.name]=input.value;
    render();
  });
  const comparison=document.getElementById('full-comparison');
  function revealReference() {
    if (!location.hash || location.hash==='#picker' || location.hash==='#guide') return;
    const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && (target===comparison || comparison.contains(target))) {
      comparison.open=true;
      target.scrollIntoView({block:'start'});
    }
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if (!link) return;
    const target=document.getElementById(link.getAttribute('href').slice(1));
    if (target && (target===comparison || comparison.contains(target))) comparison.open=true;
  });
  window.addEventListener('hashchange',revealReference);
  revealReference();
})();
