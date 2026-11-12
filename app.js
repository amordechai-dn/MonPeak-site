import {getFieldHelp,getResultHelp} from './help-content.js?v=1.9.0';
import {money,invest,freedom,loan,mortgage,goalPlan} from './finance.js?v=1.9.0';
const icons={compound:'↗',freedom:'☀',goal:'⚑',property:'⌂',loan:'⇄'};
const tools={compound:{title:'ריבית דריבית',short:'ריבית דריבית',desc:'צמיחת חיסכון לאורך זמן.',initial:0,monthly:2000,years:10,rate:8,assetFee:.7,depositFee:0,feesEnabled:false,tax:25},freedom:{title:'חופש כלכלי',short:'חופש כלכלי',desc:'הון נדרש להכנסה חודשית.',age:30,targetAge:55,initial:100000,monthly:5000,income:10000,withdrawal:4,rate:8,assetFee:.7,depositFee:0,feesEnabled:false,tax:25},goal:{title:'יעד כספי',short:'יעד כספי',desc:'כמה צריך לחסוך בכל חודש כדי להגיע ליעד?',target:100000,years:3,initial:20000,rate:4,inflation:1.6,tax:25,taxEnabled:true,goalModel:'cash-v2'},property:{title:'נדל״ן ומשכנתא',short:'נדל״ן ומשכנתא',desc:'הון עצמי, תשלומים ומשכנתא.',price:2000000,buyer:'single',equity:500000,costs:0,upfront:20,delivery:3,linkShare:0,buildIndex:2,years:25,mix:'thirds',fixedShare:34,indexShare:33,fixed:4.89,indexed:3.54,prime:4.75,spread:0,inflation:2,income:20000,obligations:0,bridge:0,bridgeRate:6,subsidy:0,saving:2000,savingRate:8,assetFee:.7,depositFee:0,feesEnabled:false,tax:25,stress:0},loan:{title:'מחשבון הלוואות',short:'החזר הלוואה',desc:'החזר חודשי ועלות הריבית.',amount:50000,years:5,rate:8,rateType:'nominal',method:'spitzer',variable:'no',reset:12,change:0,setup:0,monthlyFee:0}};
const labels={initial:'יתרה התחלתית',monthly:'הפקדה חודשית',years:'תקופה בשנים',rate:'תשואה שנתית צפויה',assetFee:'דמי ניהול מצבירה',depositFee:'דמי ניהול מהפקדה',tax:'מס על הרווח',age:'גיל נוכחי',targetAge:'גיל יעד',income:'הכנסה חודשית רצויה נטו',withdrawal:'שיעור משיכה שנתי',target:'עלות היעד כיום',priceGrowth:'עליית מחיר היעד בשנה',price:'מחיר הדירה',equity:'הון עצמי קיים',costs:'הוצאות רכישה נוספות',upfront:'תשלום בחתימה',delivery:'שנים עד המסירה',linkShare:'חלק מהיתרה הצמוד לתשומות בנייה',buildIndex:'עליית מדד תשומות בנייה בשנה',fixed:'ריבית קל״צ',indexed:'ריבית צמודת מדד',prime:'ריבית פריים בסיס',spread:'מרווח מהפריים',inflation:'אינפלציה שנתית להמחשה',obligations:'התחייבויות חודשיות קבועות',bridge:'סכום הלוואת בלון',bridgeRate:'ריבית שנתית לבלון',subsidy:'אחוז הריבית שהקבלן משלם',saving:'חיסכון חודשי עד המסירה',savingRate:'תשואה על החיסכון עד המסירה',stress:'תוספת ריבית לתרחיש',fixedShare:'חלק הקל״צ בתמהיל',indexShare:'חלק המסלול הצמוד',amount:'סכום ההלוואה',reset:'שינוי ריבית כל כמה חודשים',change:'שינוי ריבית בכל תחנה',setup:'עמלה חד־פעמית',monthlyFee:'עמלה חודשית'};
const options={buyer:[['single','דירה יחידה'],['replacement','דירה חליפית'],['investment','דירה להשקעה']],mix:[['thirds','שלישים: קל״צ / צמודה / פריים'],['fixed','100% קל״צ'],['half','חצי קל״צ, חצי פריים'],['custom','תמהיל מותאם אישית']],method:[['spitzer','שפיצר — תשלום חודשי שווה'],['equal','קרן שווה'],['balloon','בלון — ריבית שוטפת, קרן בסוף']],rateType:[['nominal','ריבית שנתית נומינלית'],['effective','ריבית שנתית אפקטיבית']],variable:[['no','קבועה'],['yes','משתנה לפי תרחיש']]};
const selectLabels={buyer:'סוג הרכישה',mix:'תמהיל משכנתא להשוואה',method:'שיטת החזר',rateType:'סוג הריבית שהוזנה',variable:'מסלול ריבית'};
const percentages=new Set(['rate','assetFee','depositFee','tax','withdrawal','priceGrowth','upfront','linkShare','buildIndex','fixed','indexed','prime','spread','inflation','subsidy','savingRate','stress','fixedShare','indexShare','change','bridgeRate']);
const currencies=new Set(['initial','monthly','income','target','price','equity','costs','obligations','bridge','saving','amount','setup','monthlyFee']);
let active='home',lastRows=[],exportOmit=[],comparison=null; const states={};let saved=[];try{saved=JSON.parse(localStorage.getItem('monpeak-saved')||'[]');if(!Array.isArray(saved))saved=[];}catch{}
const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sliderRanges={initial:[0,1000000,500],monthly:[0,20000,100],years:[1,40,1],rate:[0,15,.5],assetFee:[0,3,.05],depositFee:[0,10,.1],tax:[0,50,1],age:[18,80,1],targetAge:[30,90,1],income:[0,50000,500],withdrawal:[1,8,.1],target:[0,1000000,1000],priceGrowth:[-5,10,.1],price:[500000,10000000,50000],equity:[0,3000000,10000],upfront:[0,100,1],delivery:[1,10,1],saving:[0,20000,100],fixed:[0,12,.05],indexed:[0,10,.05],prime:[0,15,.05],spread:[-3,3,.05],inflation:[0,10,.1],fixedShare:[0,100,1],indexShare:[0,100,1],stress:[-3,5,.25],linkShare:[0,100,1],buildIndex:[0,10,.1],subsidy:[0,100,1],savingRate:[0,15,.5],amount:[0,500000,1000],bridgeRate:[0,15,.1]};
function normalizeAmountText(value){return String(value).replace(/[,\s\u200e\u200f\u202a-\u202e\u2066-\u2069₪]/g,'');}
function parseAmount(value){const raw=normalizeAmountText(value);return /^\d*(?:\.\d*)?$/.test(raw)&&/\d/.test(raw)?Number(raw):NaN;}
function formatAmount(value){
 let raw=normalizeAmountText(value);
 if(typeof value==='number'&&Number.isFinite(value)&&/[eE]/.test(raw))raw=value.toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:20});
 if(!/^\d*(?:\.\d*)?$/.test(raw))return String(value);
 const [whole,fraction]=raw.split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction!==undefined?'.'+fraction:'');
}
function formatMoneyField(input){
 const start=input.selectionStart,end=input.selectionEnd,focused=document.activeElement===input;
 const prefix=normalizeAmountText(input.value.slice(0,start??0)).length,suffix=normalizeAmountText(input.value.slice(0,end??0)).length;
 input.value=formatAmount(input.value);
 const number=parseAmount(input.value);input.setCustomValidity(input.value===''||Number.isFinite(number)&&number>=0?'':'יש להזין סכום תקין, למשל 1,000,000');
 if(focused&&start!==null){const caret=count=>{if(count===0)return 0;let n=0;for(let i=0;i<input.value.length;i++){if(input.value[i]!==',')n++;if(n===count)return i+1;}return input.value.length;};input.setSelectionRange(caret(prefix),caret(suffix));}
}
function initializeMoneyFields(){
 document.querySelectorAll('[data-money]').forEach(input=>{
  formatMoneyField(input);
  input.addEventListener('input',()=>formatMoneyField(input));
  input.addEventListener('beforeinput',event=>{const at=input.selectionStart;if(at!==input.selectionEnd)return;if(event.inputType==='deleteContentBackward'&&input.value[at-1]===',')input.setSelectionRange(at-1,at-1);if(event.inputType==='deleteContentForward'&&input.value[at]===',')input.setSelectionRange(at+1,at+1);});
 });
}
function sliderRange(key){return active==='goal'&&key==='years'?[.5,30,.5]:sliderRanges[key];}
function syncSlider(key){
 const number=document.getElementById('value-'+key),slider=document.querySelector(`[data-slider="${key}"]`);
 if(!number||!slider||number.value==='')return;
 if(number.hasAttribute('data-money'))formatMoneyField(number);
 const value=currencies.has(key)?parseAmount(number.value):Number(number.value),[min,max,step]=sliderRange(key);
 if(!Number.isFinite(value))return;
 // Extend along the original step grid; typing a precise value never rounds the number field.
 slider.min=Number((min+Math.min(0,Math.floor((value-min)/step))*step).toFixed(8));
 slider.max=Number((min+Math.max(Math.ceil((max-min)/step),Math.ceil((value-min)/step))*step).toFixed(8));
 if(active==='goal'&&key==='years')slider.min=.5;
 slider.step=step;slider.value=value;
 const sliderValue=Number(slider.value),fill=(sliderValue-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100;
 slider.style.setProperty('--fill',`${fill}%`);slider.setAttribute('aria-valuetext',`${sliderValue} ${currencies.has(key)?'שקלים':percentages.has(key)?'אחוזים':''}`);
}
function helpButton(key,title,kind='field'){return `<button type="button" class="help-button" data-help="${esc(key)}" data-help-kind="${kind}" data-help-title="${esc(title)}" aria-label="הסבר על ${esc(title)}" aria-haspopup="dialog" aria-controls="helpDialog"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.25"/><path d="M10 9v4M10 6.5h.01"/></svg></button>`;}
function fields(keys,p){return keys.map(k=>{if(options[k])return `<div class="field"><div class="field-label"><span id="label-${k}">${selectLabels[k]}</span>${helpButton(k,selectLabels[k])}</div><select name="${k}" aria-labelledby="label-${k}">${options[k].map(([v,t])=>`<option value="${v}" ${p[k]===v?'selected':''}>${t}</option>`).join('')}</select></div>`;let label=active==='goal'?({target:'עלות היעד כיום',initial:'כמה כבר חסכת?',years:'בעוד כמה שנים?',inflation:'אינפלציה שנתית',rate:'תשואה שנתית לפני מס',tax:'מס על הרווח הריאלי'}[k]||labels[k]):labels[k];if(active==='loan'&&k==='rate')label='ריבית שנתית';if(active==='property'&&k==='income')label='הכנסה חודשית נטו למשק הבית';const max=k==='assetFee'?20:k==='depositFee'?100:k==='tax'||k==='upfront'||k==='linkShare'||k==='subsidy'||k.endsWith('Share')?100:k==='withdrawal'?20:k==='rate'||k==='savingRate'?40:k==='years'?60:k==='delivery'?15:k==='age'||k==='targetAge'?110:undefined;const min=['spread','change','priceGrowth','stress'].includes(k)?-10:k==='rate'?-50:k==='years'&&active==='goal'?1/12:k==='years'||k==='delivery'||k==='reset'?1:0;const range=sliderRange(k);return `<div class="field"><div class="field-label"><label for="value-${k}">${label}</label>${helpButton(k,label)}</div><span class="input-wrap"><input id="value-${k}" name="${k}" type="${currencies.has(k)?'text':'number'}" ${currencies.has(k)?'data-money autocomplete="off" dir="ltr"':''} min="${min}" ${max?`max="${max}"`:''} step="${percentages.has(k)||currencies.has(k)||(active==='goal'&&k==='years')?'any':'1'}" value="${currencies.has(k)?formatAmount(p[k]):p[k]}" required inputmode="decimal"><span class="unit">${percentages.has(k)?'%':currencies.has(k)?'₪':''}</span></span>${range?`<input class="value-slider" type="range" data-slider="${k}" min="${Math.min(range[0],p[k])}" max="${Math.max(range[1],p[k])}" step="${range[2]}" value="${p[k]}" aria-label="גרירת ${label}">`:''}</div>`;}).join('');}
function group(title,keys,p,advanced=false){return advanced?`<details class="advanced"><summary>${title}</summary><div class="fields">${fields(keys,p)}</div></details>`:`<section class="field-section"><h3>${title}</h3><div class="fields">${fields(keys,p)}</div></section>`;}

const closeSelectPanels=()=>document.querySelectorAll('.select-options').forEach(panel=>{if(panel.matches(':popover-open'))panel.hidePopover();});
window.addEventListener('resize',closeSelectPanels);
document.addEventListener('pointerdown',event=>document.querySelectorAll('.select-options').forEach(panel=>{if(panel.matches(':popover-open')&&!panel.parentElement.contains(event.target))panel.hidePopover();}));
document.addEventListener('scroll',e=>{if(e.target instanceof Element&&e.target.closest('.select-options'))return;closeSelectPanels();},true);
function enhanceSelects(){
 if(!('showPopover' in HTMLElement.prototype))return;
 document.querySelectorAll('#calculator select').forEach(select=>{
  const key=select.name, items=[...select.options];
  const shell=document.createElement('div');shell.className='select-control';
  shell.innerHTML=`<button type="button" class="select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="choices-${key}" aria-labelledby="label-${key} choice-${key}"><span id="choice-${key}"></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg></button><div id="choices-${key}" class="select-options" role="listbox" aria-labelledby="label-${key}" popover="manual">${items.map(o=>`<button type="button" role="option" tabindex="-1" class="select-option" data-value="${esc(o.value)}" aria-selected="false"><span>${esc(o.text)}</span><span class="option-check" aria-hidden="true">✓</span></button>`).join('')}</div>`;
  select.after(shell);select.hidden=true;
  const trigger=shell.querySelector('.select-trigger'),panel=shell.querySelector('.select-options'),choices=[...panel.querySelectorAll('[role=option]')];
  const update=()=>{shell.querySelector(`#choice-${key}`).textContent=select.selectedOptions[0].text;choices.forEach(o=>o.setAttribute('aria-selected',String(o.dataset.value===select.value)));};
  const position=()=>{const r=trigger.getBoundingClientRect();panel.style.width=`${r.width}px`;panel.style.maxHeight=`${Math.max(32,Math.min(320,innerHeight-r.bottom-12))}px`;panel.style.left=`${r.left}px`;panel.style.top=`${r.bottom-1}px`;panel.style.bottom='auto';};
  let opening=false,openFrame=0;
  const close=()=>{opening=false;cancelAnimationFrame(openFrame);openFrame=0;if(panel.matches(':popover-open'))panel.hidePopover();};
  const open=(key)=>{
   if(opening)return;
   const reveal=()=>{openFrame=0;opening=false;if(!trigger.isConnected)return;closeSelectPanels();position();panel.showPopover();const choice=key==='Home'?choices[0]:key==='End'?choices.at(-1):choices.find(o=>o.dataset.value===select.value)||choices[0];choice.focus({preventScroll:true});choice.scrollIntoView({block:'nearest',behavior:'instant'});};
   const needed=Math.min(260,choices.length*52+12),room=innerHeight-trigger.getBoundingClientRect().bottom-12;
   if(room<Math.min(needed,innerHeight*.4)){opening=true;trigger.scrollIntoView({block:'center',behavior:'instant'});openFrame=requestAnimationFrame(reveal);}else reveal();
  };
  trigger.onclick=()=>opening||panel.matches(':popover-open')?close():open();
  trigger.onkeydown=e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();open(e.key);}};
  panel.addEventListener('beforetoggle',e=>trigger.setAttribute('aria-expanded',String(e.newState==='open')));
  choices.forEach(choice=>choice.onclick=()=>{select.value=choice.dataset.value;update();close();trigger.focus({preventScroll:true});select.dispatchEvent(new Event('change',{bubbles:true}));});
  panel.onkeydown=e=>{const index=choices.indexOf(document.activeElement);let next;
   if(e.key==='ArrowDown')next=(index+1)%choices.length;
   if(e.key==='ArrowUp')next=(index-1+choices.length)%choices.length;
   if(e.key==='Home')next=0;if(e.key==='End')next=choices.length-1;
   if(next!==undefined){e.preventDefault();choices[next].focus({preventScroll:true});choices[next].scrollIntoView({block:'nearest'});}
   if(e.key==='Escape'){e.preventDefault();close();trigger.focus({preventScroll:true});}
   if(e.key==='Tab'){close();trigger.focus({preventScroll:true});}
   if(e.key.length===1&&e.key!==' '){const match=choices.find((o,i)=>i>index&&o.textContent.trim().startsWith(e.key))||choices.find(o=>o.textContent.trim().startsWith(e.key));if(match){e.preventDefault();match.focus({preventScroll:true});}}
  };
  update();
 });
}

function normalizeGoal(p){return {target:p.target??100000,years:p.years??3,initial:p.initial??20000,rate:p.goalModel==='cash-v2'?(p.rate??4):4,inflation:p.inflation??p.priceGrowth??1.6,tax:p.goalModel==='cash-v2'?(p.tax??25):25,taxEnabled:p.taxEnabled!==false,goalModel:'cash-v2'};}
function normalizeFees(p){return {...p,assetFee:p.assetFee??p.fee??.7,depositFee:p.depositFee??0,feesEnabled:p.feesEnabled!==false,taxEnabled:p.taxEnabled!==false,tax:p.tax??25};}
function feeControls(p){return `<section class="field-section fee-section"><div class="fee-heading"><h3>דמי ניהול</h3><label class="fee-toggle"><input type="checkbox" name="noFees" ${p.feesEnabled?'':'checked'} aria-controls="feeFields"><span>ללא דמי ניהול</span></label></div><fieldset id="feeFields" class="fields fee-fields" ${p.feesEnabled?'':'disabled hidden'}><legend class="sr-only">סוגי דמי הניהול</legend>${fields(['depositFee','assetFee'],p)}</fieldset></section>`;}
function syncFeeControls(){const checkbox=$('[name=noFees]'),fieldset=$('#feeFields');if(checkbox&&fieldset){fieldset.disabled=checkbox.checked;fieldset.hidden=checkbox.checked;}}
function taxControls(p){return `<section class="field-section tax-section"><div class="fee-heading"><h3>מס</h3><label class="fee-toggle"><input type="checkbox" name="noTax" ${p.taxEnabled===false?'checked':''} aria-controls="taxFields"><span>ללא מס</span></label></div><fieldset id="taxFields" class="fields fee-fields" ${p.taxEnabled===false?'disabled hidden':''}><legend class="sr-only">שיעור המס</legend>${fields(['tax'],p)}</fieldset></section>`;}
function syncTaxControls(){const checkbox=$('[name=noTax]'),fieldset=$('#taxFields');if(checkbox&&fieldset){fieldset.disabled=checkbox.checked;fieldset.hidden=checkbox.checked;}}
function formHTML(id,p){let html='';if(id==='compound')html=group('התוכנית שלך',['initial','monthly','years','rate'],p)+feeControls(p)+taxControls(p);if(id==='freedom')html=group('החיים שתכננת',['age','targetAge','income','withdrawal'],p)+group('ההשקעות בדרך',['initial','monthly','rate'],p)+feeControls(p)+taxControls(p);if(id==='goal')html=group('היעד שלך',['target','years','initial','inflation'],p)+`<div class="goal-saving-mode" id="goalSavingMode"></div>`+`<details class="advanced"><summary>הנחות החיסכון והמס</summary><div class="fields">${fields(['rate'],p)}</div>${taxControls(p)}<p class="small-text">התשואה אחרי דמי ניהול ולפני מס אישי. המס מחושב על הרווח שמעל האינפלציה. ברירת המחדל מבוססת על מיטב כספית שקלית כשרה (5136544), תשואת 12 חודשים ל־12.11.2026.</p></details>`;if(id==='loan')html=group('פרטי ההלוואה',['amount','years','rate','method'],p)+group('ריבית ועמלות',['rateType','variable','reset','change','setup','monthlyFee'],p,true);if(id==='property')html=group('הרכישה שלך',['price','buyer','equity','costs'],p)+group('תשלומים עד המסירה',['upfront','delivery','saving'],p)+`<div class="presets"><button type="button" data-plan="10">10% עכשיו / 90% במסירה</button><button type="button" data-plan="20">20% עכשיו / 80% במסירה</button></div>`+group('המשכנתא שלך',['years','mix','income','obligations'],p)+group('ריביות ותמהיל מפורט',['fixed','indexed','prime','spread','inflation','fixedShare','indexShare','stress'],p,true)+`<details class="advanced"><summary>חיסכון, הצמדה והלוואת בלון</summary><div class="fields">${fields(['savingRate','linkShare','buildIndex','bridge','bridgeRate','subsidy'],p)}</div>${taxControls(p)}</details>`+`<details class="advanced"><summary>דמי ניהול על החיסכון</summary>${feeControls(p)}</details>`;return html;}
function home(){return `<section class="home-hero"><div class="hero-copy"><h1>מחשבונים<br>פיננסיים.</h1><a href="#compound" class="primary">מתחילים לחשב <span>↖</span></a></div><div class="peak-illustration" aria-hidden="true"><svg viewBox="0 0 520 360"><defs><linearGradient id="mount" x2="0" y2="1"><stop stop-color="#b49b60" stop-opacity=".3"/><stop offset="1" stop-color="#b49b60" stop-opacity="0"/></linearGradient></defs><path d="M0 295H520M0 220H520M0 145H520M0 70H520" stroke="#ffffff12"/><path d="M20 322 140 175 203 247 319 52 497 322Z" fill="url(#mount)"/><path d="M20 322 140 175 203 247 319 52 497 322" fill="none" stroke="#b49b60" stroke-width="2"/><path d="m303 80 16-28 25 38-21-8-9 8Z" fill="#e2d2a7"/><circle cx="319" cy="52" r="7" fill="#d8c18a"/><path d="M20 319q150 3 239-70T484 80" stroke="#ede8da" stroke-width="2" fill="none" stroke-dasharray="5 7"/></svg></div></section><section class="tools-section"><div class="section-heading"><h2>המחשבונים</h2></div><div class="tool-grid">${Object.entries(tools).map(([id,t])=>`<a href="#${id}" class="tool-card"><span class="tool-icon">${icons[id]}</span><h3>${t.short}</h3><p>${t.desc}</p><span class="card-link">למחשבון <span>↖</span></span></a>`).join('')}</div></section>`;}
function render(){active=location.hash.slice(1)||'home';if(!tools[active])active='home';$('#nav').innerHTML=Object.entries(tools).map(([id,t])=>`<a href="#${id}" ${id===active?'aria-current="page"':''}>${t.short}</a>`).join('');document.title=active==='home'?'MonPeak — מחשבונים פיננסיים':`${tools[active].short} | MonPeak`;if(active==='home'){$('#main').innerHTML=home();return;}const t=tools[active],p=active==='goal'?normalizeGoal(states[active]||t):normalizeFees(states[active]||{...t});$('#main').innerHTML=`<section class="calc-hero"><a href="#home" class="back-link">דף הבית / ${t.short}</a><div class="calc-heading"><span class="tool-icon">${icons[active]}</span><h1>${t.title}</h1></div><p>${t.desc}</p></section><section class="workspace ${active==='goal'?'goal-workspace':''}"><form id="calculator"><div class="form-top"><h2>הנתונים שלך</h2><button type="button" id="reset" class="text-button">איפוס לדוגמה</button></div>${formHTML(active,p)}<div id="error" role="alert"></div><button class="primary calculate" type="submit">חשב <span>↖</span></button></form><section class="results" aria-label="תוצאות החישוב"><div id="resultBody"></div></section></section>`;$('#calculator').addEventListener('submit',e=>{e.preventDefault();calculate();});$('#calculator').addEventListener('input',e=>{if(e.target.name==='noFees')syncFeeControls();if(e.target.name==='noTax')syncTaxControls();if(e.target.dataset.slider){const key=e.target.dataset.slider;document.getElementById('value-'+key).value=e.target.value;syncSlider(key);}else if(e.target.name)syncSlider(e.target.name);if($('#calculator').checkValidity())calculate();});enhanceSelects();initializeMoneyFields();Object.keys(sliderRanges).forEach(syncSlider);$('#calculator').addEventListener('change',calculate);$('#reset').onclick=()=>{delete states[active];navigate({scroll:false,focus:false});};document.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>{$('[name=upfront]').value=b.dataset.plan;syncSlider('upfront');calculate();});calculate();}
let currencyObserver;
function fitCurrencyValues(){
 currencyObserver?.disconnect();
 const fit=()=>document.querySelectorAll('.metric .money-value,.freedom-income .money-value').forEach(value=>{
  value.style.removeProperty('font-size');
  const card=value.closest('.metric')||value.parentElement,style=getComputedStyle(card),available=Math.min(value.clientWidth,card.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
  if(available>0&&value.scrollWidth>available){
   const size=parseFloat(getComputedStyle(value).fontSize),fitted=Math.max(14,Math.floor(size*available/value.scrollWidth*4)/4);
   value.style.fontSize=`${fitted}px`;
  }
 });
 fit();currencyObserver=new ResizeObserver(fit);
 document.querySelectorAll('.metric').forEach(card=>currencyObserver.observe(card));
 document.fonts.ready.then(fit);
}
function card(label,value,note='',accent=false,kind=''){return `<article class="metric ${accent?'accent':''} ${kind}"><span class="metric-label"><span>${label}</span>${helpButton(label,label,'result')}</span><strong class="${String(value).includes('₪')?'money-value':''}">${value}</strong><small>${note}</small></article>`;}
function summaryFor(id,p){if(id==='goal')return goalPlan(normalizeGoal(p)).monthly;if(id==='loan')return loan({...p,variable:p.variable==='yes'}).total;if(id==='property')return mortgage({...p,fixed:p.fixed+p.stress,indexed:p.indexed+p.stress,prime:p.prime+p.stress}).total;return invest({...p,years:id==='freedom'?p.targetAge-p.age:p.years}).net;}
function comparisonHTML(){if(!comparison||comparison.tool!==active)return '';const a=summaryFor(active,states[active]),b=summaryFor(active,comparison.data);return `<section class="chart-panel"><h3>השוואה לתרחיש השמור</h3><div class="breakdown"><span>התוכנית הנוכחית <b>${money(a)}</b></span><span>התרחיש השמור <b>${money(b)}</b></span><span>הפרש <b>${money(a-b)}</b></span></div><p class="muted small-text">${active==='loan'||active==='property'?'השוואת סך התשלומים לאורך התקופה':active==='goal'?'השוואת החיסכון החודשי הנדרש':'השוואת שווי התיק נטו בסוף התקופה'}. תשואה / ריבית בתרחיש השמור: ${active==='goal'?normalizeGoal(comparison.data).rate:comparison.data.rate??comparison.data.fixed}%.</p></section>`;}
function calculate(){const form=$('#calculator');syncFeeControls();syncTaxControls();if(!form.checkValidity())return;const p=Object.fromEntries(new FormData(form));delete p.noFees;delete p.noTax;for(const k in p)if(!options[k])p[k]=currencies.has(k)?parseAmount(p[k]):Number(p[k]);if($('[name=noFees]')){p.feesEnabled=!$('[name=noFees]').checked;p.assetFee=Number($('[name=assetFee]').value);p.depositFee=Number($('[name=depositFee]').value);}if($('[name=noTax]')){p.taxEnabled=!$('[name=noTax]').checked;p.tax=Number($('#value-tax').value);}if(active==='goal')p.goalModel='cash-v2';exportOmit=[];states[active]={...p};const error=$('#error');error.textContent='';if(active==='freedom'&&(p.targetAge<=p.age||p.withdrawal<=0)){error.textContent='גיל היעד צריך להיות גדול מהגיל הנוכחי, ושיעור המשיכה גדול מאפס.';return;}if(active==='property'&&(p.fixedShare+p.indexShare>100||p.income<=p.obligations)){error.textContent='סכום חלקי התמהיל לא יכול לעבור 100%, וההכנסה צריכה להיות גבוהה מההתחייבויות.';return;}
 if(active==='loan'&&p.variable==='yes'&&p.rate+Math.floor((Math.round(p.years*12)-1)/p.reset)*p.change<=-100){error.textContent='שינויי הריבית יוצרים ריבית נמוכה מ־100%-; עדכן את התרחיש.';return;}if(active==='property'&&p.bridge>p.price*p.upfront/100){error.textContent='בדוגמה זו הבלון מממן את התשלום בחתימה. הסכום צריך להיות עד גובה התשלום בחתימה.';return;}
 if(active==='goal'){renderGoalResult(p);return;}
 if(active==='freedom'){renderFreedomResult(p);return;}
 let r,metrics='',insight='',legend='',chartKeys=[],table='';
 if(active==='compound'){r=invest(p);
 lastRows=r.rows;chartKeys=[['paid','הפקדות','#9bada1'],['gross','ברוטו','#b59b61'],...(r.hasFees?[['balance','אחרי דמי ניהול','#7b8ba0']]:[]),['net','נטו','#253e31']];table=annualTable(r.rows,r.hasFees);if(!r.hasFees)exportOmit=['balance','fees','assetFees','depositFees'];
 if(active==='compound'){
 const same=(a,b)=>Math.abs(a-b)<0.5;
 const outcomes=[];
 if(!same(r.gross,r.net))outcomes.push(compoundOutcomeCard('שווי תיק ברוטו',r.gross,'רווח ברוטו',r.gross-r.paid));
 if(!same(r.balance,r.gross)&&!same(r.balance,r.net))outcomes.push(compoundOutcomeCard('שווי תיק אחרי דמי ניהול',r.balance,'רווח אחרי דמי ניהול',r.balance-r.paid,'after-fees'));
 outcomes.push(compoundOutcomeCard('שווי תיק נטו',r.net,'רווח נטו',r.net-r.paid,'accent'));
 const contributions=`<div class="contributions-line"><span class="metric-label"><span>סך ההפקדות</span>${helpButton('סך ההפקדות','סך ההפקדות','result')}</span><strong>${money(r.paid)}</strong></div>`;
 legend=`${contributions}<section class="outcome-comparison compound-comparison" style="--outcome-count:${outcomes.length}" aria-label="שווי התיק והרווח בסוף התקופה">${outcomes.join('')}</section>`;
 const uniqueKeys=[];
 for(const series of [...chartKeys].reverse())if(!uniqueKeys.some(([key])=>r.rows.every(row=>same(row[key],row[series[0]]))))uniqueKeys.unshift(series);
 chartKeys=uniqueKeys;
 }

 }else if(active==='loan'){r=loan({...p,variable:p.variable==='yes'});metrics=card('החזר חודשי ראשון',money(r.first),'כולל עמלה חודשית',true)+card('סך התשלומים',money(r.total),'קרן, ריבית ועמלות')+card('סך הריבית',money(r.interest),'לכל תקופת ההלוואה')+card('תשלום חודשי מרבי',money(r.max),p.method==='balloon'?'כולל הקרן בתשלום האחרון':'לפי תרחיש הריבית');insight=p.method==='balloon'?`בסיום התקופה תידרש לשלם את הקרן הנותרת. העלות הכוללת כוללת עמלות בסך ${money(r.fees)}.`:`על כל שקל שלווית, התשלום הכולל הוא כ־${(r.total/p.amount||0).toFixed(2)} ₪.`;lastRows=r.rows;chartKeys=[['balance','יתרת ההלוואה','#b59b61']];table=loanTable(r.rows);
 }else{const original={...p};p.fixed+=p.stress;p.indexed+=p.stress;p.prime+=p.stress;r=mortgage(p);metrics=card('החזר חודשי ראשון',money(r.first),`${r.ratio.toFixed(1)}% מהכנסה פנויה`,true)+card('משכנתא משוערת',money(r.amount),`עד ${(r.ltv*100).toFixed(0)}% מימון לפי סוג הרכישה`)+card('מזומן נדרש במסירה',money(r.atDelivery),'אחרי המשכנתא, כולל פירעון בלון')+card('פער למימון במסירה',money(r.deliveryGap),'כולל החיסכון העתידי והוצאות שהוזנו');legend=`<div class="breakdown"><span><span class="metric-label"><span>בחתימה</span>${helpButton('בחתימה','בחתימה','result')}</span><b>${money(r.signing)}</b></span><span><span class="metric-label"><span>סך החזרי משכנתא</span>${helpButton('סך החזרי משכנתא','סך החזרי משכנתא','result')}</span><b>${money(r.total)}</b></span><span><span class="metric-label"><span>החזר מרבי בתרחיש</span>${helpButton('החזר מרבי בתרחיש','החזר מרבי בתרחיש','result')}</span><b>${money(r.max)}</b></span></div>`;insight=`לוח התשלומים: ${original.upfront}% עכשיו ו־${100-original.upfront}% במסירה. ${r.ratio>40?'ההחזר ההתחלתי עולה על 40% מההכנסה הפנויה. ':''}${r.signingGap?`חסר בתשלום בחתימה: ${money(r.signingGap)}. `:""}תוספת הצמדה משוערת: ${money(r.linked)}. ${original.bridge?`בלון: ${money(r.bridgeDue)} קרן לפירעון במסירה, וריבית על חשבונך ${money(r.bridgeInterest)}. הבלון מממן חלק מהחתימה ונפרע במסירה; הריבית שלא סובסדה נכללת בעלויות המסירה.`:''}`;lastRows=r.rows;chartKeys=[['balance','יתרת המשכנתא','#b59b61']];table=loanTable(r.rows);}
 if(!Number.isFinite(r.total??r.net)){error.textContent='התרחיש גדול מדי לחישוב. הקטן את התקופה או הריבית.';return;}
 $('#resultBody').innerHTML=`<div class="result-toolbar"><button id="save" class="text-button">＋ שמירת תרחיש</button></div>${['compound','freedom','goal'].includes(active)?legend:''}${active==='compound'?metrics:`<div class="metrics supporting-metrics">${metrics}</div>`}${['compound','freedom','goal'].includes(active)?'':legend}${comparisonHTML()}${insight?`<div class="insight"><span>✦</span><p>${insight}</p></div>`:""}${active==='compound'?compoundDetails(r):''}<section class="chart-panel"><div class="panel-heading"><h3>${active==='loan'||active==='property'?'איך היתרה יורדת לאורך הזמן':'איך התוכנית שלך גדלה'}</h3><button class="text-button" id="export">הורדת CSV</button></div>${chart(lastRows,chartKeys)}<div class="chart-legend" aria-label="קווים בגרף">${chartKeys.map(([key,name,color])=>chartKeys.length>1?`<button type="button" class="chart-key" data-series="${key}" aria-pressed="true" aria-label="הצגת ${name}"><i style="background:${color}" aria-hidden="true"></i><span>${name}</span></button>`:`<span><i style="background:${color}" aria-hidden="true"></i>${name}</span>`).join('')}</div></section><details class="table-panel"><summary>פירוט החישוב ${active==='loan'||active==='property'?'לפי חודש':'לפי שנה'}</summary><div class="table-scroll">${table}</div></details>`;
 fitCurrencyValues();initChart(lastRows,chartKeys);$('#save').onclick=saveScenario;$('#export').onclick=exportCSV;}

function compoundOutcomeCard(label,value,profitLabel,profit,kind=''){
 return `<article class="metric compound-outcome ${kind}"><span class="metric-label"><span>${label}</span>${helpButton(label,label,'result')}</span><strong class="money-value">${money(value)}</strong><div class="outcome-profit"><span class="metric-label"><span>${profitLabel}</span>${helpButton(profitLabel,profitLabel,'result')}</span><strong class="money-value">${money(profit)}</strong></div></article>`;
}

function compoundDetails(r){
 const row=(label,value,help='')=>`<div><dt>${label}${help?helpButton(help,label,'result'):''}</dt><dd>${money(value)}</dd></div>`;
 return `<details class="table-panel compound-details"><summary>פירוט מס ודמי ניהול</summary><dl>${row('מס משוער במימוש',r.tax,'מס משוער במימוש')}${r.hasFees?row('דמי ניהול מהפקדות',r.depositFees)+row('דמי ניהול מצבירה',r.assetFees)+row('השפעת דמי הניהול על היתרה',r.gross-r.balance):''}</dl>${r.hasFees?'<p class="small-text">ההשפעה על היתרה כוללת את דמי הניהול ואת התשואה שלא נצברה עליהם.</p>':''}</details>`;
}

function ageText(age){const total=Math.round(age*12),years=Math.floor(total/12),months=total%12;return months?`${years} ו־${months===1?'חודש':months===2?'חודשיים':months+' חודשים'}`:String(years);}
function renderFreedomResult(p){
 const r=freedom(p);if(!Number.isFinite(r.net)||!Number.isFinite(r.requiredCapital)){$('#error').textContent='התרחיש גדול מדי לחישוב. עדכן את הנתונים.';return;}
 const age=r.reached===null?'לא עד גיל 110':r.reachedMonths===0?'כבר היום':`גיל ${ageText(r.reached)}`;
 const monthGap=r.reachedMonths===null?0:Math.round((p.targetAge-p.age)*12)-r.reachedMonths;
 const duration=m=>{const y=Math.floor(m/12),n=m%12;return [y?(y===1?'שנה':y===2?'שנתיים':y+' שנים'):'',n?(n===1?'חודש':n===2?'חודשיים':n+' חודשים'):''].filter(Boolean).join(' ו־');};
 const gap=r.reached===null?'לפי ההפקדה החודשית הנוכחית':r.reachedMonths===0?'ההון הקיים מספיק להכנסה שהזנת לפי שיעור המשיכה':monthGap===0?'בגיל היעד שבחרת':`${duration(Math.abs(monthGap))} ${monthGap>0?'לפני':'אחרי'} גיל היעד`;
 const progress=Math.min(100,p.income>0?r.monthlyIncome/p.income*100:100);
 const detailCards=[];
 const same=(a,b)=>Math.abs(a-b)<.5;
 if(!same(r.gross,r.net))detailCards.push(compoundOutcomeCard('שווי תיק ברוטו',r.gross,'רווח ברוטו',r.gross-r.paid));
 if(!same(r.balance,r.gross)&&!same(r.balance,r.net))detailCards.push(compoundOutcomeCard('שווי תיק אחרי דמי ניהול',r.balance,'רווח אחרי דמי ניהול',r.balance-r.paid,'after-fees'));
 detailCards.push(compoundOutcomeCard('שווי תיק נטו',r.net,'רווח נטו',r.net-r.paid,'accent'));
 lastRows=r.projectionRows;exportOmit=[];
 const chartKeys=[['balance',r.hasFees?'שווי תיק אחרי דמי ניהול':'שווי התיק','#253e31'],['requiredCapital','הון דרוש להכנסה נטו','#b59b61']];
 const legend=chartKeys.map(([key,name,color])=>`<button type="button" class="chart-key" data-series="${key}" aria-pressed="true" aria-label="הצגת ${name}"><i style="background:${color}" aria-hidden="true"></i><span>${name}</span></button>`).join('');
 $('#resultBody').innerHTML=`<div class="result-toolbar"><button id="save" class="text-button">＋ שמירת תרחיש</button></div><section class="freedom-primary metrics">${card('גיל פרישה משוער',age,gap,true)}</section><div class="metrics freedom-support">${card('הון דרוש בגיל היעד',money(r.requiredCapital),`להכנסה נטו של ${money(p.income)} בחודש בגיל ${p.targetAge}`)}${card('הפקדה חודשית נדרשת',Number.isFinite(r.required)?money(Math.ceil(r.required)):'לא ניתן להגיע',`כדי להגיע בגיל ${p.targetAge}`)}</div><section class="freedom-income"><h3>הכנסה חודשית בגיל ${p.targetAge}</h3><div class="freedom-income-values"><div><span>ההכנסה שרצית</span><strong class="money-value">${money(p.income)}</strong></div><div><span class="metric-label"><span>לפי התוכנית שלך, נטו</span>${helpButton('retirementMonthlyIncome','הכנסה חודשית נטו','result')}</span><strong class="money-value">${money(r.monthlyIncome)}</strong></div></div><div class="freedom-progress" role="meter" aria-label="כיסוי יעד ההכנסה" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div></section>${comparisonHTML()}<details class="table-panel freedom-details"><summary>שווי התיק והרווח בגיל ${p.targetAge}</summary><div class="contributions-line"><span>סך ההפקדות</span><strong>${money(r.paid)}</strong></div><section class="outcome-comparison compound-comparison" style="--outcome-count:${detailCards.length}">${detailCards.join('')}</section><p class="small-text">הנטו בפירוט זה הוא במימוש מלא. ההכנסה החודשית למעלה מחושבת במשיכה חלקית.</p></details><details class="table-panel freedom-details"><summary>פירוט המשיכה, המס ודמי הניהול</summary><dl class="freedom-breakdown"><div><dt>משיכה חודשית לפני מס</dt><dd>${money(r.monthlyGross)}</dd></div><div><dt>מס על הרווח שבמשיכה</dt><dd>${money(r.monthlyTax)}</dd></div><div><dt>הכנסה חודשית נטו</dt><dd>${money(r.monthlyIncome)}</dd></div>${r.hasFees?`<div><dt>דמי ניהול מהפקדות עד גיל ${p.targetAge}</dt><dd>${money(r.depositFees)}</dd></div><div><dt>דמי ניהול מצבירה עד גיל ${p.targetAge}</dt><dd>${money(r.assetFees)}</dd></div>`:''}</dl></details><section class="chart-panel freedom-chart"><div class="panel-heading"><h3>הדרך לחופש כלכלי</h3><button class="text-button" id="export">הורדת CSV</button></div>${chart(lastRows,chartKeys)}<div class="chart-legend">${legend}</div></section><details class="table-panel"><summary>פירוט ההתקדמות לפי גיל</summary><div class="table-scroll"><table><thead><tr><th>גיל</th><th>שווי התיק</th><th>הון דרוש</th><th>הכנסה חודשית נטו</th></tr></thead><tbody>${lastRows.map(row=>`<tr><td>${ageText(row.age)}</td><td>${money(row.balance)}</td><td>${money(row.requiredCapital)}</td><td>${money(row.monthlyIncome)}</td></tr>`).join('')}</tbody></table></div></details>`;
 fitCurrencyValues();initChart(lastRows,chartKeys);$('#save').onclick=saveScenario;$('#export').onclick=exportCSV;
}

function renderGoalResult(p){
 const tableOpen=$('.goal-progress .table-panel')?.open||false;
 const plan=goalPlan(p);if(!Number.isFinite(plan.monthly)||!Number.isFinite(plan.net)||!Number.isFinite(plan.target)){$('#error').textContent='הסכום גדול מדי לחישוב. עדכן את היעד או התקופה.';return;}
 const period=`${plan.months} חודשים`,rate=new Intl.NumberFormat('he-IL',{maximumFractionDigits:3}).format(p.rate);
 $('#goalSavingMode').innerHTML=`<span>קרן כספית · ${rate}% לשנה לפני מס</span><a href="https://kerencaspit.co.il/functions/getSeoFundTable" target="_blank" rel="noopener">ברירת מחדל לפי תשואת 12 חודשים · 12.11.2026</a>`;
 const chartKeys=[['net','חיסכון צפוי','#253e31'],['target','עלות היעד','#b59b61']];lastRows=plan.rows;exportOmit=['gross','balance','tax','fees','assetFees','depositFees'];
 const table=`<table><caption>התקדמות החיסכון לפי התוכנית</caption><thead><tr><th>שנה</th><th>סך ההפקדות</th><th>חיסכון צפוי</th><th>עלות היעד</th></tr></thead><tbody>${plan.rows.map(row=>`<tr><td>${new Intl.NumberFormat('he-IL',{maximumFractionDigits:2}).format(row.year)}</td><td>${money(row.paid)}</td><td>${money(row.net)}</td><td>${money(row.target)}</td></tr>`).join('')}</tbody></table>`;
 $('#resultBody').innerHTML=`<div class="result-toolbar"><span>החיסכון החודשי שלך</span><button id="save" class="text-button">＋ שמירת תרחיש</button></div><div class="metrics goal-outcome">${card('צריך לחסוך בכל חודש',money(plan.monthly),plan.monthly===0?(p.initial>=plan.target?'כבר חסכת את סכום היעד':'החיסכון הקיים צפוי להספיק לפי הנחת התשואה'):`למשך ${period}`,true)}</div>${p.inflation?`<div class="goal-target-summary"><span class="metric-label"><span>עלות היעד לאחר אינפלציה</span>${helpButton('goalFutureTarget','עלות היעד לאחר אינפלציה','result')}</span><bdi>${money(plan.target)}</bdi></div>`:''}${comparisonHTML()}<section class="goal-progress"><section class="chart-panel"><div class="panel-heading"><h3>הדרך ליעד</h3><button id="export" class="text-button">הורדת CSV</button></div>${chart(plan.rows,chartKeys)}<div class="chart-legend" aria-label="קווים בגרף">${chartKeys.map(([key,name,color])=>`<button type="button" class="chart-key" data-series="${key}" aria-pressed="true" aria-label="הצגת ${name}"><i style="background:${color}" aria-hidden="true"></i><span>${name}</span></button>`).join('')}</div></section><details class="table-panel" ${tableOpen?'open':''}><summary>פירוט לפי שנה</summary><div class="table-scroll">${table}</div></details></section>`;
 fitCurrencyValues();initChart(lastRows,chartKeys);$('#save').onclick=saveScenario;$('#export').onclick=exportCSV;
}

window.addEventListener('resize',()=>document.querySelectorAll('.chart-tooltip,.chart-cursor,.chart-marker').forEach(element=>element.hidden=true));
function chartGeometry(rows,keys){
 const max=Math.max(1,...rows.flatMap(r=>keys.map(([key])=>r[key]))),period=r=>r.year??r.month;
 const first=period(rows[0]),last=period(rows.at(-1)),x=r=>2+(period(r)-first)/Math.max(.000001,last-first)*695,y=value=>230-value/max*220;
 return {max,period,x,y};
}
function chart(rows,keys){
 const sample=rows.filter((r,i)=>i%Math.max(1,Math.ceil(rows.length/100))===0||i===rows.length-1),{max,x,y,period}=chartGeometry(rows,keys);
 return `<div class="chart-frame"><div class="chart-values" aria-hidden="true">${[1,.75,.5,.25,0].map(f=>`<span>${compact(max*f)}</span>`).join('')}</div><div class="chart-plot" dir="ltr" role="slider" tabindex="0" aria-label="בחירת תקופה בגרף" aria-valuemin="${period(rows[0])}" aria-valuemax="${period(rows.at(-1))}" aria-valuenow="${period(rows.at(-1))}" aria-valuetext="${rows[0].year!==undefined?'שנה':'חודש'} ${period(rows.at(-1))}" aria-orientation="horizontal"><svg class="chart" viewBox="0 0 700 240" preserveAspectRatio="none" aria-hidden="true">${[0,.25,.5,.75,1].map(f=>`<line x1="2" y1="${y(max*f)}" x2="697" y2="${y(max*f)}" stroke="#e6e8e2" vector-effect="non-scaling-stroke"/>`).join('')}${keys.map(([key,,color])=>`<polyline data-line="${key}" points="${sample.map(r=>`${x(r)},${y(r[key])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('')}</svg><div class="chart-cursor" hidden aria-hidden="true"></div>${keys.map(([key,,color])=>`<span class="chart-marker" data-marker="${key}" style="--series-color:${color}" hidden aria-hidden="true"></span>`).join('')}<div class="chart-tooltip" hidden aria-hidden="true" dir="rtl"><strong class="chart-period"></strong>${keys.map(([key,name,color])=>`<div class="chart-tooltip-row" data-value-row="${key}"><span><i style="background:${color}"></i>${name}</span><bdi data-chart-value="${key}"></bdi></div>`).join('')}</div></div></div><div class="chart-timeline" aria-hidden="true"><span>${rows[0].age!==undefined?'גיל '+rows[0].age:'תחילת התקופה'}</span><span>${rows.at(-1).age!==undefined?'גיל '+new Intl.NumberFormat('he-IL',{maximumFractionDigits:1}).format(rows.at(-1).age):'סוף התקופה'}</span></div>`;
}
function initChart(rows,keys){
 const plot=$('.chart-plot');if(!plot||!rows.length)return;
 const {x,y,period}=chartGeometry(rows,keys),tooltip=plot.querySelector('.chart-tooltip'),cursor=plot.querySelector('.chart-cursor'),visible=new Set(keys.map(([key])=>key));
 let selected=rows.length-1,frame=0,pointerX=0;
 const periodLabel=row=>`${row.age!==undefined?'גיל':row.year!==undefined?'שנה':'חודש'} ${new Intl.NumberFormat('he-IL',{maximumFractionDigits:2}).format(row.age??period(row))}`;
 function show(index){
  selected=Math.max(0,Math.min(rows.length-1,index));const row=rows[selected],percent=x(row)/700*100;
  tooltip.hidden=false;cursor.hidden=false;cursor.style.left=`${percent}%`;
  tooltip.querySelector('.chart-period').textContent=periodLabel(row);
  const readings=[];
  [...keys].sort((a,b)=>row[b[0]]-row[a[0]]).forEach(([key,name],rank)=>{plot.querySelector(`[data-value-row="${key}"]`).style.order=rank;const on=visible.has(key),marker=plot.querySelector(`[data-marker="${key}"]`);marker.hidden=!on;marker.style.left=`${percent}%`;marker.style.top=`${y(row[key])/240*100}%`;plot.querySelector(`[data-value-row="${key}"]`).hidden=!on;plot.querySelector(`[data-chart-value="${key}"]`).textContent=money(row[key]);if(on)readings.push(`${name}: ${money(row[key])}`);});
  plot.setAttribute('aria-valuenow',period(row));plot.setAttribute('aria-valuetext',`${periodLabel(row)}, ${readings.join(', ')}`);
  const width=plot.clientWidth,tipWidth=tooltip.offsetWidth,px=x(row)/700*width;
  tooltip.style.left=`${Math.max(6,Math.min(width-tipWidth-6,px+14+tipWidth<width?px+14:px-tipWidth-14))}px`;
 }
 function hide(){cancelAnimationFrame(frame);frame=0;tooltip.hidden=true;cursor.hidden=true;plot.querySelectorAll('.chart-marker').forEach(marker=>marker.hidden=true);}
 function inspectPointer(){
  frame=0;const rect=plot.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(pointerX-rect.left)/rect.width)),target=period(rows[0])+(fraction*700-2)/695*(period(rows.at(-1))-period(rows[0]));
  let low=0,high=rows.length-1;while(low<high){const mid=Math.floor((low+high)/2);if(period(rows[mid])<target)low=mid+1;else high=mid;}
  show(low>0&&Math.abs(period(rows[low-1])-target)<Math.abs(period(rows[low])-target)?low-1:low);
 }
 function queuePointer(e){pointerX=e.clientX;if(!frame)frame=requestAnimationFrame(inspectPointer);}
 plot.addEventListener('pointermove',queuePointer);
 plot.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')plot.setPointerCapture(e.pointerId);queuePointer(e);});
 plot.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hide();});
 plot.addEventListener('pointercancel',hide);
 plot.addEventListener('focus',()=>show(selected));plot.addEventListener('blur',hide);
 plot.addEventListener('keydown',e=>{let next=selected;if(e.key==='ArrowRight'||e.key==='ArrowUp')next++;else if(e.key==='ArrowLeft'||e.key==='ArrowDown')next--;else if(e.key==='Home')next=0;else if(e.key==='End')next=rows.length-1;else if(e.key==='Escape'){hide();return;}else return;e.preventDefault();show(next);});
 const buttons=[...document.querySelectorAll('.chart-key')];
 buttons.forEach(button=>button.onclick=()=>{const key=button.dataset.series;if(visible.has(key)){if(visible.size===1)return;visible.delete(key);}else visible.add(key);buttons.forEach(b=>{const on=visible.has(b.dataset.series);b.setAttribute('aria-pressed',String(on));b.disabled=on&&visible.size===1;plot.querySelector(`[data-line="${b.dataset.series}"]`).style.display=on?'':'none';});if(!tooltip.hidden)show(selected);});
}

function compact(n){return new Intl.NumberFormat('he',{notation:'compact',maximumFractionDigits:1}).format(n);}
function annualTable(rows,hasFees=true){const columns=hasFees?['paid','gross','balance','tax','net']:['paid','gross','tax','net'];return `<table><caption>ערכי תיק משוערים בסוף כל שנה</caption><thead><tr><th>שנה</th><th>הפקדות</th><th>ברוטו</th>${hasFees?'<th>אחרי דמי ניהול</th>':''}<th>מס במימוש</th><th>נטו</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.year}</td>${columns.map(k=>`<td>${money(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}

function loanTable(rows){return `<table><caption>לוח החזרים משוער</caption><thead><tr><th>חודש</th><th>תשלום</th><th>יתרה אחרי תשלום</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.month}</td><td>${money(r.payment)}</td><td>${money(r.balance)}</td></tr>`).join('')}</tbody></table>`;}
function exportCSV(){if(!lastRows.length)return;const keys=Object.keys(lastRows[0]).filter(k=>!exportOmit.includes(k));const blob=new Blob(['\ufeff'+keys.join(',')+'\n'+lastRows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`MonPeak-${active}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function persist(){try{localStorage.setItem('monpeak-saved',JSON.stringify(saved));$('#saveCount').textContent=saved.length;return true;}catch{toast('לא ניתן לשמור בדפדפן הזה. ניתן להוריד את התוצאות כ־CSV.');return false;}}
function saveScenario(){if(saved.length>=30){toast('ניתן לשמור עד 30 תרחישים. מחק תרחיש ישן כדי להוסיף חדש.');return;}const s={id:Date.now(),tool:active,data:{...states[active]},date:new Date().toLocaleDateString('he-IL')};saved.push(s);if(persist())toast('התרחיש נשמר');else saved.pop();}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let pageAnimation=null,dialogEpoch=0,dialogAnimation=null,dialogClosing=null;
function navigate({scroll=true,focus=true}={}){
 pageAnimation?.cancel();
 render();
 if(scroll){const previous=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);document.documentElement.style.scrollBehavior=previous;}
 if(focus)$('#main').focus({preventScroll:true});
 const heading=document.querySelector('.calc-heading, .hero-copy');
 pageAnimation=null;
 if(heading&&!motionPreference.matches)pageAnimation=heading.animate([{transform:'translateY(4px)'},{transform:'translateY(0)'}],{duration:140,easing:'ease-out'});
}
function openSavedDialog(){
 const dialog=$('#savedDialog');if(dialog.open&&!dialog.classList.contains('is-closing'))return;
 ++dialogEpoch;dialogAnimation?.cancel();dialogClosing=null;dialog.classList.remove('is-closing');
 if(!dialog.open)dialog.showModal();
 if(!motionPreference.matches)dialogAnimation=dialog.animate([{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:150,easing:'cubic-bezier(.2,.7,.2,1)'});
}
function closeSavedDialog(){
 const dialog=$('#savedDialog');if(!dialog.open)return Promise.resolve();if(dialogClosing)return dialogClosing;
 const epoch=++dialogEpoch;dialogAnimation?.cancel();
 if(motionPreference.matches){dialog.close();return Promise.resolve();}
 dialog.classList.add('is-closing');
 dialogAnimation=dialog.animate([{transform:'translateY(0)'},{transform:'translateY(4px)'}],{duration:100,easing:'ease-in',fill:'both'});
 dialogClosing=dialogAnimation.finished.catch(()=>{}).then(()=>{if(epoch!==dialogEpoch)return;dialog.close();dialog.classList.remove('is-closing');dialogAnimation.cancel();dialogAnimation=null;dialogClosing=null;});
 return dialogClosing;
}

function showSaved(){$('#savedList').innerHTML=saved.length?saved.map(s=>`<article class="saved-item"><div><strong>${esc(tools[s.tool]?.short||'תרחיש')}</strong><small>${esc(s.date)}</small></div><button class="quiet" data-load="${s.id}">פתיחה</button><button class="quiet" data-compare="${s.id}" ${s.tool!==active?'disabled':''}>השוואה</button><button class="text-button" data-delete="${s.id}">מחיקה</button></article>`).join(''):'<p>אין תרחישים שמורים.</p>';document.querySelectorAll('[data-load]').forEach(b=>b.onclick=async()=>{const s=saved.find(s=>s.id===Number(b.dataset.load));states[s.tool]={...s.data};await closeSavedDialog();if(location.hash===`#${s.tool}`)navigate({scroll:false});else location.hash=s.tool;});document.querySelectorAll('[data-compare]').forEach(b=>b.onclick=async()=>{comparison=saved.find(s=>s.id===Number(b.dataset.compare));await closeSavedDialog();calculate();});document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{saved=saved.filter(s=>s.id!==Number(b.dataset.delete));persist();showSaved();});openSavedDialog();}

// Reload a published release only after its HTML is available; keep in-progress work per tab.
const runningVersion=new URL(import.meta.url).searchParams.get('v');
const updateDraftKey='monpeak-update-draft';
function restoreUpdateDraft(){
 let draft;
 try{draft=JSON.parse(sessionStorage.getItem(updateDraftKey)||'null');sessionStorage.removeItem(updateDraftKey);}catch{return;}
 if(!draft||Date.now()-draft.at>300000)return;
 for(const [key,value] of Object.entries(draft.states||{}))if(tools[key]&&value&&typeof value==='object')states[key]=value;
 comparison=draft.comparison||null;
 render();
 if(draft.tool===active){
  for(const [key,value] of Object.entries(draft.fields||{})){
   if(active==='goal'&&draft.states?.goal?.goalModel!=='cash-v2'&&!['target','years','initial'].includes(key))continue;
   const input=document.querySelector(`#calculator [name="${CSS.escape(key)}"]`);
   if(!input)continue;if(input.type==='checkbox')input.checked=value;else input.value=value;
  }
  document.querySelectorAll('#calculator select').forEach(select=>{const label=document.getElementById('choice-'+select.name);if(label)label.textContent=select.selectedOptions[0]?.text||'';document.querySelectorAll(`#choices-${select.name} [role=option]`).forEach(o=>o.setAttribute('aria-selected',String(o.dataset.value===select.value)));});
  document.querySelectorAll('[data-money]').forEach(formatMoneyField);Object.keys(sliderRanges).forEach(syncSlider);syncFeeControls();syncTaxControls();
  if($('#calculator')?.checkValidity())calculate();
  for(const i of draft.details||[])if($('#calculator')?.querySelectorAll('details')[i])$('#calculator').querySelectorAll('details')[i].open=true;
  requestAnimationFrame(()=>{window.scrollTo(0,draft.scroll||0);const input=draft.focus&&document.querySelector(`#calculator [name="${CSS.escape(draft.focus)}"]`);input?.focus({preventScroll:true});});
 }
}
function preserveUpdateDraft(){
 const fields={};document.querySelectorAll('#calculator [name]').forEach(input=>fields[input.name]=input.type==='checkbox'?input.checked:input.value);
 try{sessionStorage.setItem(updateDraftKey,JSON.stringify({at:Date.now(),tool:active,states,comparison,fields,scroll:scrollY,focus:document.activeElement?.name,details:[...document.querySelectorAll('#calculator details')].flatMap((d,i)=>d.open?[i]:[])}));return true;}catch{return false;}
}
if(!$('#helpDialog')){
 const dialog=document.createElement('dialog');dialog.id='helpDialog';dialog.className='help-dialog';dialog.setAttribute('aria-labelledby','helpTitle');dialog.setAttribute('aria-describedby','helpText');
 dialog.innerHTML='<div class="dialog-head"><h2 id="helpTitle"></h2><button type="button" id="closeHelp" class="quiet">סגירה ✕</button></div><p id="helpText"></p>';document.body.append(dialog);
}
let helpOpener=null,helpAnimation=null,helpClosing=null;
function openHelpDialog(trigger){
 const text=trigger.dataset.helpKind==='result'?getResultHelp(trigger.dataset.help,active):getFieldHelp(trigger.dataset.help,active);if(!text)return;
 closeSelectPanels();helpOpener=trigger;helpAnimation?.cancel();
 $('#helpTitle').textContent=trigger.dataset.helpTitle;$('#helpText').textContent=text;
 const dialog=$('#helpDialog');if(!dialog.open)dialog.showModal();
 if(!motionPreference.matches)helpAnimation=dialog.animate([{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:140,easing:'ease-out'});
}
function closeHelpDialog(){
 const dialog=$('#helpDialog');if(!dialog.open)return Promise.resolve();if(helpClosing)return helpClosing;helpAnimation?.cancel();
 const finish=()=>{dialog.close();helpAnimation?.cancel();helpAnimation=null;helpClosing=null;if(helpOpener?.isConnected)helpOpener.focus({preventScroll:true});};
 if(motionPreference.matches){finish();return Promise.resolve();}
 helpAnimation=dialog.animate([{transform:'translateY(0)'},{transform:'translateY(4px)'}],{duration:100,easing:'ease-in',fill:'both'});
 helpClosing=helpAnimation.finished.catch(()=>{}).then(finish);return helpClosing;
}
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-help]');if(trigger)openHelpDialog(trigger);});
$('#closeHelp').onclick=closeHelpDialog;
$('#helpDialog').addEventListener('cancel',event=>{event.preventDefault();closeHelpDialog();});
$('#helpDialog').addEventListener('click',event=>{const r=event.currentTarget.getBoundingClientRect();if(event.target===event.currentTarget&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))closeHelpDialog();});
function cleanVersionAddress(){
 const url=new URL(location.href);if(!url.searchParams.has('v'))return;
 url.searchParams.delete('v');history.replaceState(history.state,'',url.pathname+url.search+url.hash);
}
function startAutoUpdates(){
 cleanVersionAddress();restoreUpdateDraft();
 let registration,checking=false,lastInput=0;
 document.addEventListener('input',()=>lastInput=Date.now());
 const newer=v=>{if(!/^\d+\.\d+\.\d+$/.test(v)||!runningVersion)return false;const a=v.split('.').map(Number),b=runningVersion.split('.').map(Number);for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;};
 async function check(){
  if(checking||document.visibilityState==='hidden'||!navigator.onLine)return;
  checking=true;
  try{
   const endpoint=new URL('./version.json',location.href);endpoint.searchParams.set('_',Date.now());
   const response=await fetch(endpoint,{cache:'no-store'});if(!response.ok)return;
   const {version}=await response.json();if(!newer(version))return;
   // Defer while typing or choosing an option; the next check retries automatically.
   if(Date.now()-lastInput<3000||$('#savedDialog').open||$('#helpDialog').open||[...document.querySelectorAll('.select-options')].some(panel=>panel.matches(':popover-open')))return;
   const url=new URL(location.href);url.searchParams.set('v',version);
   if(url.href===location.href)return;
   const htmlResponse=await fetch(url,{cache:'no-store'});if(!htmlResponse.ok)return;
   const html=await htmlResponse.text();if(!html.includes(`app.js?v=${version}`)||!html.includes(`style.css?v=${version}`))return;
   if(!preserveUpdateDraft())return;
   registration?.update().catch(()=>{});
   location.replace(url.href);
  }catch{/* Offline or a release still deploying: retain this working page and retry. */}
  finally{checking=false;}
 }
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>{registration=r;}).catch(()=>{});
 window.setInterval(check,30000);
 window.addEventListener('focus',check);window.addEventListener('online',check);window.addEventListener('pageshow',check);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 check();
}

$('.skip').onclick=e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView();};$('#savedToggle').onclick=showSaved;$('#closeSaved').onclick=closeSavedDialog;$('#savedDialog').addEventListener('cancel',e=>{e.preventDefault();closeSavedDialog();});$('#savedDialog').addEventListener('click',e=>{const rect=e.currentTarget.getBoundingClientRect();if(e.target===e.currentTarget&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))closeSavedDialog();});$('#saveCount').textContent=saved.length;window.addEventListener('hashchange',()=>navigate());render();startAutoUpdates();
