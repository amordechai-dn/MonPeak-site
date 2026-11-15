import {funds,categories,catalogVersion} from './fund-catalog.js?v=1.16.0';
import {normalizePortfolio,analyzePortfolio,convertPortfolioMode,equalizePortfolio,filterFunds,parsePortfolioNumber} from './portfolio-model.js?v=1.16.0';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(n,digits=2)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(n);
const amount=n=>`<bdi>${number(n)} <span class="portfolio-shekel">₪</span></bdi>`;
const pct=n=>`<bdi>${number(n,4)}%</bdi>`;
const reviewDate=value=>String(value).split('-').reverse().join('.');
const info=(key,label)=>`<button type="button" class="help-button" data-portfolio-help="${key}" aria-label="הסבר על ${label}" aria-haspopup="dialog"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.25"/><path d="M10 9v4M10 6.5h.01"/></svg></button>`;
const help={
 budget:['סכום התיק','השווי הכולל בשקלים שעל פיו מתכננים את החלוקה. במצב אחוזים, הסכום לכל קרן מחושב מתוך השווי הזה. במצב סכומים, מזינים שווי בשקלים לכל החזקה — לא מספר יחידות ולא מחיר מסחר.'],
 fee:['דמי ניהול שנתיים משוקללים','מחברים את שיעור ההוצאות השנתי של כל קרן כפול המשקל שלה בחלק שהוקצה. הסכום בשקלים הוא אומדן לשנה לפי השווי שהוזן, ללא שינוי בשווי. הוצאות הקרנות מנוכות בתוך הקרן לאורך השנה; זה אינו חיוב חד־פעמי או תשלום נוסף לברוקר. לא נכללות עמלות מסחר, המרת מטבע, דמי פלטפורמה או מס.'],
 allocation:['חלוקת התיק','ההקצאה נמדדת מול סכום התיק שהזנת. חוסר מסומן כיתרה שלא הוקצתה; הקצאה מעל 100% דורשת תיקון. הוספת קרן אינה משנה את המשקלים שכבר בחרת. ״חלוקה שווה״ משנה את ההקצאות רק בלחיצה שלך.'],
 exposure:['חלוקה לפי סוג נכס','כל קרן משויכת לסוג נכס כללי. הגרף מציג את החלוקה מתוך הסכום שהוקצה בפועל, ולא את ההחזקות בתוך כל קרן. הוא אינו מודד חפיפות בין מניות או פיזור גאוגרפי בתוך הקרנות.'],
 catalog:['נתוני הספרייה','מאגר התחלתי של מוצרים נסחרים בארה״ב. דמי הניהול נבדקו מול קישורי המנפיקים בתאריך המוצג; הנתונים אינם מתעדכנים בזמן אמת. כל הסכומים בתיק מוזנים בשקלים. מטבע המסחר של המוצר אינו מבטל חשיפה למטבע או יוצר גידור לשקל.']
};

export function mountPortfolio(root,{initial,onChange=()=>{},onSave=()=>{},onOpenSaved=()=>{},notify=()=>{}}={}){
 let draft;try{draft=JSON.parse(localStorage.getItem('monpeak-portfolio-draft')||'null');}catch{}
 let state=normalizePortfolio(initial??draft??{}),tab=state.rows.length?'builder':'library',query='',category='all',sort='default',storageWarned=false;
 const find=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
 const motion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const persist=()=>{onChange(JSON.parse(JSON.stringify(state)));try{localStorage.setItem('monpeak-portfolio-draft',JSON.stringify(state));}catch{if(!storageWarned){notify('השמירה במכשיר אינה זמינה בדפדפן הזה. אפשר להוריד CSV.');storageWarned=true;}}};
 root.innerHTML=`<div class="portfolio-layout">
 <section class="portfolio-main" aria-label="בניית תיק השקעות">
  <div class="portfolio-tabs" role="tablist" aria-label="תיק וספריית קרנות"><button type="button" id="portfolio-builder-tab" role="tab" data-portfolio-tab="builder" aria-controls="portfolioView">התיק שלי <span id="portfolioCount">0</span></button><button type="button" id="portfolio-library-tab" role="tab" data-portfolio-tab="library" aria-controls="portfolioView">ספריית קרנות</button></div>
  <div id="portfolioView" role="tabpanel" tabindex="-1"></div>
 </section>
 <aside id="portfolioSummary" class="portfolio-summary" aria-label="סיכום התיק" tabindex="-1"></aside>
 </div><dialog class="help-dialog portfolio-dialog" id="portfolioDialog" aria-labelledby="portfolioDialogTitle"><div class="dialog-head"><h2 id="portfolioDialogTitle"></h2><button type="button" class="quiet" data-close-portfolio-dialog>סגירה ✕</button></div><div class="help-copy" id="portfolioDialogBody"></div></dialog>`;

 function showDialog(title,body){
  find('#portfolioDialogTitle').textContent=title;find('#portfolioDialogBody').innerHTML=body;
  const dialog=find('#portfolioDialog');if(!dialog.open)dialog.showModal();
  if(!motion())dialog.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:150,easing:'ease-out'});
 }
 let closing=false;
 function closeDialog(){const dialog=find('#portfolioDialog');if(closing||!dialog.open)return;if(motion()){dialog.close();return;}closing=true;dialog.animate([{opacity:1},{opacity:0}],{duration:100}).finished.catch(()=>{}).then(()=>{dialog.close();closing=false;});}
 find('#portfolioDialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
 find('#portfolioDialog').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();});

 function update(){persist();renderSummary();updateRows();}
 function setTab(next,{focus=false}={}){tab=next;renderView();if(focus){find('#portfolioView').focus({preventScroll:true});find('.portfolio-tabs').scrollIntoView({behavior:motion()?'instant':'smooth',block:'start'});}}
 function renderView(){
  all('[data-portfolio-tab]').forEach(button=>{const selected=button.dataset.portfolioTab===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  find('#portfolioView').setAttribute('aria-labelledby',`portfolio-${tab}-tab`);
  if(tab==='library')renderLibrary();else renderBuilder();renderSummary();
 }
 function renderLibrary(){
  find('#portfolioView').innerHTML=`<div class="portfolio-library-head"><div><h2>בוחרים מה נכנס לתיק</h2><p>${funds.length} קרנות ומוצרים · נתוני מנפיקים</p></div>${info('catalog','נתוני הספרייה')}</div>
  <label class="portfolio-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span class="sr-only">חיפוש קרנות</span><input type="search" id="portfolioSearch" placeholder="שם, סימול או מדד…" autocomplete="off" value="${esc(query)}"></label>
  <div class="portfolio-filterbar"><div class="portfolio-chips" role="group" aria-label="סוג נכס">${[['all','הכול'],...Object.entries(categories).filter(([k])=>k!=='unknown').map(([k,v])=>[k,v.name])].map(([key,label])=>`<button type="button" data-category="${key}" aria-pressed="${category===key}">${label}</button>`).join('')}</div><div class="portfolio-sort" role="group" aria-label="מיון קרנות"><button type="button" data-sort="fee" aria-pressed="${sort==='fee'}">דמי ניהול ↑</button><button type="button" data-sort="name" aria-pressed="${sort==='name'}">שם</button></div></div>
  <div class="sr-only" id="portfolioSearchStatus" role="status"></div><div id="portfolioFundGrid" class="portfolio-fund-grid"></div>`;
  renderCards();
 }
 function renderCards(){
  const selected=state.rows.map(r=>r.id),matches=filterFunds(funds,{query,category,sort,selected});
  find('#portfolioSearchStatus').textContent=`${matches.length} קרנות נמצאו`;
  find('#portfolioFundGrid').innerHTML=matches.length?matches.map(f=>{
   const added=selected.includes(f.id);
   return `<article class="portfolio-fund"><div class="portfolio-fund-heading"><span class="portfolio-ticker" dir="ltr">${f.id}</span><span class="portfolio-category">${categories[f.category].name}</span></div><h3>${esc(f.label)}</h3><p class="portfolio-fund-name" dir="ltr">${esc(f.name)}</p><p class="portfolio-fund-description">${esc(f.description)}</p><dl class="portfolio-fund-facts"><div><dt>דמי ניהול בשנה</dt><dd>${pct(f.fee)}</dd></div><div><dt>מטבע מסחר</dt><dd dir="ltr">${f.currency}</dd></div><div><dt>חלוקה</dt><dd>${f.distribution}</dd></div></dl><div class="portfolio-fund-actions"><button type="button" class="text-button" data-fund-details="${f.id}" aria-label="פרטי ${f.id}">פרטים ומקור</button><button type="button" class="primary portfolio-add ${added?'is-added':''}" data-add-fund="${f.id}" ${added?'disabled':''} aria-label="${added?'כבר בתיק':'הוספת'} ${f.id}">${added?'✓ בתיק':'＋ הוספה לתיק'}</button></div></article>`;
  }).join(''):`<div class="portfolio-empty-search"><h3>לא נמצאו קרנות</h3><p>נסו שם אחר או הסירו את הסינון.</p><button type="button" class="text-button" data-clear-filters>איפוס חיפוש וסינון</button></div>`;
 }
 function renderBuilder(){
  const summary=analyzePortfolio(state,funds);
  find('#portfolioView').innerHTML=`<div class="portfolio-editor-head"><div class="field portfolio-name-field"><label for="portfolioName">שם התיק</label><input id="portfolioName" type="text" maxlength="60" value="${esc(state.name)}" autocomplete="off"></div><button type="button" class="text-button" data-open-library>＋ הוספת קרן</button></div>
  <div class="portfolio-editor-settings"><div class="field"><div class="field-label"><label for="portfolioBudget">סכום התיק</label>${info('budget','סכום התיק')}</div><span class="input-wrap"><input id="portfolioBudget" type="text" inputmode="decimal" dir="ltr" value="${esc(summary.validBudget?number(summary.budget):state.budget)}" required aria-describedby="portfolioBudgetError"><span class="unit">₪</span></span><span id="portfolioBudgetError" class="portfolio-field-error" hidden>הזינו סכום גדול מאפס, עד טריליון ₪.</span></div><div><span class="portfolio-mode-label">הקצאה לפי</span><div class="portfolio-mode" role="group" aria-label="שיטת הקצאה"><button type="button" data-mode="percent" aria-pressed="${state.mode==='percent'}">אחוזים</button><button type="button" data-mode="amount" aria-pressed="${state.mode==='amount'}">סכומים</button></div></div></div>
  <div class="portfolio-holdings-heading"><h2>הקרנות בתיק <span>${state.rows.length}</span></h2>${state.rows.length>1?'<button type="button" class="text-button" data-equalize>חלוקה שווה</button>':''}</div>
  <div class="portfolio-holdings">${state.rows.length?summary.rows.map((r,i)=>`<article class="portfolio-holding" data-holding="${esc(r.id)}"><div class="portfolio-holding-title"><button type="button" class="portfolio-holding-link" data-fund-details="${esc(r.id)}"><bdi>${esc(r.id)}</bdi><span>${esc(r.fund?.label||'נייר לא זמין בספרייה')}</span></button><button type="button" class="portfolio-remove" data-remove-fund="${esc(r.id)}" aria-label="הסרת ${esc(r.id)}">✕</button></div><div class="portfolio-holding-values"><div class="field"><label class="sr-only" for="portfolio-row-${i}">הקצאת ${esc(r.id)} ${state.mode==='percent'?'באחוזים':'בשקלים'}</label><span class="input-wrap"><input id="portfolio-row-${i}" type="text" inputmode="decimal" dir="ltr" data-row-value="${esc(r.id)}" value="${esc(state.mode==='amount'&&Number.isFinite(parsePortfolioNumber(r.value))?number(parsePortfolioNumber(r.value)):r.value)}" required><span class="unit">${state.mode==='percent'?'%':'₪'}</span></span></div><span class="portfolio-row-equivalent" data-row-equivalent="${esc(r.id)}">${state.mode==='percent'?amount(r.amount):pct(r.weight)}</span><button type="button" class="portfolio-fill" data-fill-fund="${esc(r.id)}">השלמה</button></div><input type="range" class="value-slider portfolio-allocation-slider" data-row-slider="${esc(r.id)}" min="0" max="${state.mode==='percent'?100:summary.budget}" step="${state.mode==='percent'?.5:100}" value="${Number(r.value)||0}" aria-label="גרירת הקצאת ${esc(r.id)}"><p class="portfolio-row-error" data-row-error="${esc(r.id)}" hidden>הזינו ${state.mode==='percent'?'אחוז בין 0 ל־100':'סכום תקין בשקלים'}.</p></article>`).join(''):`<div class="portfolio-empty"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 49V31h10v18m5 0V20h10v29m5 0V10h10v39M8 55h48"/></svg><h3>אילו קרנות יהיו בתיק שלך?</h3><p>בחרו קרנות מהספרייה והגדירו את החלוקה.</p><button type="button" class="primary" data-open-library>לבחירת קרנות</button></div>`}</div>
  ${state.rows.length?'<button type="button" class="portfolio-show-summary text-button" data-show-summary>לסיכום התיק ↓</button>':''}`;
  updateRows();
 }
 function updateRows(){
  if(tab!=='builder')return;
  const summary=analyzePortfolio(state,funds),budgetInput=find('#portfolioBudget');
  if(budgetInput){budgetInput.setAttribute('aria-invalid',String(!summary.validBudget));find('#portfolioBudgetError').hidden=summary.validBudget;}
  summary.rows.forEach(row=>{
   const input=all('[data-row-value]').find(x=>x.dataset.rowValue===row.id),slider=all('[data-row-slider]').find(x=>x.dataset.rowSlider===row.id),equivalent=all('[data-row-equivalent]').find(x=>x.dataset.rowEquivalent===row.id),error=all('[data-row-error]').find(x=>x.dataset.rowError===row.id),fill=all('[data-fill-fund]').find(x=>x.dataset.fillFund===row.id);
   input?.setAttribute('aria-invalid',String(!row.valid));if(error)error.hidden=row.valid;
   if(equivalent)equivalent.innerHTML=row.valid&&summary.validBudget?(state.mode==='percent'?amount(row.amount):pct(row.weight)):'—';
   if(slider){const max=state.mode==='percent'?100:(summary.validBudget?summary.budget:100000);slider.max=max;slider.value=Number(row.value)||0;slider.style.setProperty('--fill',`${Math.min(100,Math.max(0,Number(slider.value)/max*100))}%`);slider.setAttribute('aria-valuetext',`${number(Number(row.value)||0)} ${state.mode==='percent'?'אחוזים':'שקלים'}`);}
   if(fill)fill.disabled=!summary.validBudget||summary.invalid||summary.remaining<=.000001;
  });
 }
 function renderSummary(){
  const s=analyzePortfolio(state,funds);find('#portfolioCount').textContent=state.rows.length;
  const hasMoney=s.allocated>0,invalid=!s.validBudget||s.invalid,status=invalid?'יש ערך שצריך לתקן':s.over?'ההקצאה גבוהה מסכום התיק':s.complete?'התיק מוקצה במלואו':hasMoney?'נותר סכום להקצאה':'ממתין להקצאה';
  const statusClass=invalid||s.over?'target-missed':s.complete?'target-met':'';
  const ring=s.groups.length?`<svg class="portfolio-donut" viewBox="0 0 120 120" role="img" aria-label="חלוקה מתוך הסכום שהוקצה"><circle cx="60" cy="60" r="44" fill="none" stroke="#e6e8dd" stroke-width="13"/>${s.groups.map((g,i)=>{const offset=s.groups.slice(0,i).reduce((n,x)=>n+x.share,0);return `<circle cx="60" cy="60" r="44" pathLength="100" fill="none" stroke="${(categories[g.key]||categories.unknown).color}" stroke-width="13" stroke-dasharray="${g.share} ${100-g.share}" stroke-dashoffset="${-offset}" transform="rotate(-90 60 60)"/>`;}).join('')}<text x="60" y="58" text-anchor="middle">${state.rows.filter(r=>parsePortfolioNumber(r.value)>0).length}</text><text class="portfolio-donut-label" x="60" y="75" text-anchor="middle">החזקות</text></svg>`:'';
  find('#portfolioSummary').innerHTML=`<div class="portfolio-summary-heading"><h2>סיכום התיק</h2>${info('allocation','חלוקת התיק')}</div>
   <div class="portfolio-allocation-status ${statusClass}"><span>${s.complete?'✓':s.over||invalid?'✕':'○'} ${status}</span><strong>${invalid?'—':pct(s.weight)}</strong></div>
   <div class="portfolio-allocation-track" aria-hidden="true"><span style="width:${invalid?0:Math.min(100,s.weight)}%"></span></div>
   <dl class="portfolio-summary-amounts"><div><dt>הוקצו</dt><dd>${invalid?'—':amount(s.allocated)}</dd></div><div><dt>${s.over?'חריגה':'טרם הוקצו'}</dt><dd>${invalid?'—':amount(Math.abs(s.remaining))}</dd></div></dl>
   <section class="portfolio-cost"><div><h3>דמי ניהול בשנה</h3>${info('fee','דמי ניהול שנתיים משוקללים')}</div><strong>${s.weightedFee===null?'—':pct(s.weightedFee)}</strong><span>${s.annualCost===null?'':`${amount(s.annualCost)} לפי השווי שהוקצה`}</span>${!s.complete&&hasMoney?'<small>על החלק שהוקצה בלבד</small>':''}${hasMoney&&!s.allFeesKnown?`<p class="portfolio-missing">נתוני עלות קיימים עבור ${pct(s.coverage)} מהסכום שהוקצה. העלות הכוללת אינה ידועה.</p>`:''}</section>
   ${ring?`<section class="portfolio-breakdown"><div class="portfolio-summary-heading"><h3>חלוקת ההשקעה</h3>${info('exposure','חלוקה לפי סוג נכס')}</div>${ring}<ul>${s.groups.map(g=>`<li><span><i style="background:${(categories[g.key]||categories.unknown).color}"></i>${(categories[g.key]||categories.unknown).name}</span><bdi>${number(g.share)}%</bdi></li>`).join('')}</ul><small>מתוך הסכום שהוקצה</small></section>`:''}
   <div class="portfolio-summary-actions"><button type="button" class="primary" data-save-portfolio ${!state.rows.length||invalid||s.over?'disabled':''}>שמירת תיק</button><button type="button" class="text-button" data-open-portfolio-saved>תיקים ותרחישים שמורים</button>${state.rows.length?'<button type="button" class="text-button" data-export-portfolio>הורדת CSV</button>':''}</div><p class="portfolio-data-date">נתוני קרנות נבדקו: <bdi>${reviewDate(catalogVersion)}</bdi></p>`;
 }
 function fundDetails(id){
  const f=funds.find(x=>x.id===id);if(!f){showDialog(id,'<p>הנייר אינו נמצא בספרייה הנוכחית. העלות שלו לא נכללת כאפס בחישוב.</p>');return;}
  showDialog(`${f.id} · ${f.label}`,`<p dir="ltr">${esc(f.name)}</p><p>${esc(f.description)}</p><dl class="portfolio-detail-list">${[['מדד / נכס ייחוס',f.benchmark],['דמי ניהול שנתיים',number(f.fee,4)+'%'],['מנפיק',f.issuer],['מדינת התאגדות',f.domicile],['מטבע מסחר',f.currency],['מדיניות חלוקה',f.distribution],['שיטת עקיבה',f.replication],['גידור',f.hedging],['תאריך בדיקה',reviewDate(f.verifiedAt)]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><a class="help-source" href="${f.source}" target="_blank" rel="noopener noreferrer">נתוני הקרן באתר המנפיק ↗</a>`);
 }
 function save(){const s=analyzePortfolio(state,funds);if(!state.rows.length||!s.validBudget||s.invalid||s.over)return;onSave({...normalizePortfolio(state),catalogVersion});}
 function exportCSV(){
  const s=analyzePortfolio(state,funds);if(s.invalid||!s.validBudget){notify('יש לתקן את הערכים לפני הייצוא.');return;}
  const cell=v=>{const value=String(v??'');return '"'+(/^[=+\-@\t\r]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';};
  const rows=[['סימול','שם','משקל מתוך סכום התיק (%)','שווי מתוכנן (₪)','דמי ניהול שנתיים (%)','עלות שנתית לפי השווי (₪)','מקור','תאריך בדיקה'],...s.rows.map(r=>[r.id,r.fund?.name||'מידע חסר',r.weight,r.amount,r.fund?.fee??'',r.annualCost??'',r.fund?.source||'',r.fund?.verifiedAt||''])];
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='MonPeak-portfolio.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 root.addEventListener('input',event=>{
  const input=event.target;
  if(input.id==='portfolioSearch'){query=input.value;renderCards();return;}
  if(input.id==='portfolioName'){state.name=input.value;persist();return;}
  if(input.id==='portfolioBudget'){state.budget=input.value;update();return;}
  if(input.dataset.rowValue!==undefined){const row=state.rows.find(r=>r.id===input.dataset.rowValue);if(row){row.value=input.value;update();}return;}
  if(input.dataset.rowSlider!==undefined){const row=state.rows.find(r=>r.id===input.dataset.rowSlider);if(!row)return;row.value=Number(input.value);const field=all('[data-row-value]').find(x=>x.dataset.rowValue===row.id);if(field)field.value=state.mode==='amount'?number(row.value):row.value;update();}
 });
 root.addEventListener('focusout',event=>{
  const input=event.target;if(input.id==='portfolioBudget'||input.dataset.rowValue!==undefined&&state.mode==='amount'){const n=parsePortfolioNumber(input.value);if(Number.isFinite(n))input.value=number(n,8);}
 });
 root.addEventListener('keydown',event=>{
  const button=event.target.closest('[data-portfolio-tab]');if(button&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'builder':event.key==='End'?'library':tab==='builder'?'library':'builder';setTab(next);find(`[data-portfolio-tab=${next}]`).focus();}
  if(event.key==='Enter'&&event.target.matches('[data-row-value],#portfolioBudget')){event.preventDefault();const summary=analyzePortfolio(state,funds);if(!summary.invalid&&summary.validBudget){find('#portfolioSummary').focus({preventScroll:true});find('#portfolioSummary').scrollIntoView({behavior:motion()?'instant':'smooth',block:'start'});}}
 });
 root.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.portfolioTab){setTab(button.dataset.portfolioTab,{focus:true});return;}
  if(button.hasAttribute('data-open-library')){setTab('library',{focus:true});return;}
  if(button.dataset.addFund){if(!state.rows.some(r=>r.id===button.dataset.addFund)){state.rows.push({id:button.dataset.addFund,value:0});update();renderCards();find(`[data-fund-details="${button.dataset.addFund}"]`)?.focus({preventScroll:true});notify(`${button.dataset.addFund} נוספה לתיק. ההקצאה נשארה לבחירתך.`);}return;}
  if(button.dataset.removeFund){const index=state.rows.findIndex(r=>r.id===button.dataset.removeFund);state.rows=state.rows.filter(r=>r.id!==button.dataset.removeFund);update();renderBuilder();const next=all('[data-remove-fund]')[Math.min(index,state.rows.length-1)];(next||find('[data-open-library]'))?.focus({preventScroll:true});return;}
  if(button.dataset.fillFund){const s=analyzePortfolio(state,funds),row=state.rows.find(r=>r.id===button.dataset.fillFund);if(!row||s.remaining<=0)return;row.value=Number((parsePortfolioNumber(row.value)+(state.mode==='amount'?s.remaining:100-s.weight)).toPrecision(14));update();renderBuilder();return;}
  if(button.hasAttribute('data-equalize')){const s=analyzePortfolio(state,funds);if(!s.validBudget){notify('הזינו סכום תיק תקין לפני חלוקה שווה.');return;}state=equalizePortfolio(state);update();renderBuilder();return;}
  if(button.dataset.mode){const next=convertPortfolioMode(state,button.dataset.mode);if(!next){notify('הזינו סכום תיק והקצאות תקינים לפני החלפת שיטה.');return;}state=next;update();renderBuilder();return;}
  if(button.dataset.category){category=button.dataset.category;all('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));renderCards();return;}
  if(button.dataset.sort){sort=sort===button.dataset.sort?'default':button.dataset.sort;all('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sort===sort)));renderCards();return;}
  if(button.hasAttribute('data-clear-filters')){query='';category='all';sort='default';renderLibrary();find('#portfolioSearch').focus();return;}
  if(button.dataset.fundDetails){fundDetails(button.dataset.fundDetails);return;}
  if(button.dataset.portfolioHelp){const [title,text]=help[button.dataset.portfolioHelp]||help.catalog;showDialog(title,`<p>${esc(text)}</p>`);return;}
  if(button.hasAttribute('data-close-portfolio-dialog')){closeDialog();return;}
  if(button.hasAttribute('data-save-portfolio')){save();return;}
  if(button.hasAttribute('data-open-portfolio-saved')){onOpenSaved();return;}
  if(button.hasAttribute('data-export-portfolio')){exportCSV();return;}
  if(button.hasAttribute('data-show-summary')){find('#portfolioSummary').focus({preventScroll:true});find('#portfolioSummary').scrollIntoView({behavior:motion()?'instant':'smooth',block:'start'});}
 });
 persist();renderView();
}
