import {templates,portfolioFromTemplate,portfolioInsights,comparePortfolios,portfolioFindings,compareFundAdvantages,comparePortfolioAdvantages,comparisonPriorities,rankComparisonMetric} from './portfolio-insights.js?v=1.21.0';
import {funds,categories,catalogVersion,fundGroups} from './fund-catalog.js?v=1.21.0';
import {normalizePortfolio,analyzePortfolio,equalizePortfolio,filterFunds,parsePortfolioNumber,allocatePortfolioFund,percentagePortfolio,projectPortfolio,holdingAnnualReturn,parseAnnualReturn} from './portfolio-model.js?v=1.21.0';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(n,digits=2)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(n);
const pct=n=>!Number.isFinite(n)?'—':`<bdi>${number(n,4)}%</bdi>`;
const annualFundCost=f=>Number.isFinite(f.fee)?f.fee+(Number.isFinite(f.extraFee)?f.extraFee:0):null;
const returnPct=n=>!Number.isFinite(n)?'—':`<bdi>${number(n,2)}%</bdi>`;
const reviewDate=value=>value?String(value).split('-').reverse().join('.'):'טרם אומת';
const info=(key,label)=>`<button type="button" class="help-button" data-portfolio-help="${key}" aria-label="הסבר על ${label}" aria-haspopup="dialog"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.25"/><path d="M10 9v4M10 6.5h.01"/></svg></button>`;
const help={
 returns:['תשואה שנתית משוערת','ברירת המחדל מבוססת על תשואה היסטורית שנתית מצטברת ממוצעת (CAGR), עד 15 שנה. לכל החזקה מוצגים המקור והתקופה הזמינה. קרן חדשה עשויה להשתמש במדד או במכשיר מייצג; חלק מהתקופות קצרות מ־15 שנה. הנתונים הומרו לשקלים כשהדבר אפשרי; מקור וקירוב חריג מפורטים ליד הערך. זו אינה תחזית לשנה הבאה. 0% מוחרג מהממוצע: מחלקים את סכום משקל כפול תשואה בסך המשקלים שאינם אפס. זהו ממוצע של הנכסים שנכללו, ולא תשואה של כל ההון. אפשר לערוך בין ‎-100% ל־1000%.'],
 fee:['עלות שנתית משוקללת','מכפילים את שיעור ההוצאות השנתי של כל קרן, כולל עלויות נוספות ידועות, במשקל שלה בחלק שהוקצה. נתונים שלא אומתו כלולים רק בבחירה מפורשת ומסומנים כאומדן. עמלות מסחר, המרת מטבע ומסים אינם כלולים.'],
 allocation:['חלוקת התיק','ההקצאה נמדדת באחוזים מתוך התיק. חוסר מסומן כיתרה שלא הוקצתה; הקצאה מעל 100% דורשת תיקון. הוספת קרן אינה משנה את המשקלים שכבר בחרת. ״חלוקה שווה״ משנה את ההקצאות רק בלחיצה שלך.'],
 exposure:['חלוקה לפי סוג נכס','כל קרן משויכת לסוג נכס כללי. הגרף מציג אחוזים מכלל התיק, כולל היתרה שטרם הוקצתה. הוא אינו מציג את ההחזקות בתוך כל קרן. הוא אינו מודד חפיפות בין מניות או פיזור גאוגרפי בתוך הקרנות.'],
 catalog:['נתוני הספרייה','ספרייה של מוצרים הנסחרים בישראל, בארה״ב ובאירופה. נתון שסומן כלא מאומת נשמר בנפרד מהנתון הרשמי. אפשר לבחור להשתמש בערכי המקור כאומדן בלבד. דמי ניהול, עלות Swap ודמי נאמנות הם רכיבים נפרדים; הנתונים אינם מתעדכנים בזמן אמת. ברירת המחדל מסדרת קבוצות נפוצות יחד; זהו סדר עריכתי, לא דירוג פופולריות מדוד. מטבע המסחר של המוצר אינו מבטל חשיפה למטבע או יוצר גידור לשקל.']
};

export function mountPortfolio(root,{initial,onChange=()=>{},onSave=()=>{},onOpenSaved=()=>{},getSaved=()=>[],notify=()=>{}}={}){
 let draft;try{draft=JSON.parse(localStorage.getItem('monpeak-portfolio-draft')||'null');}catch{}
 let state=percentagePortfolio(initial??draft??{}),tab=state.rows.length?'builder':'library',query='',category='all',sort='default',distribution='all',domicile='all',storageWarned=false,libraryTarget='current',previousState=null,comparison=null,libraryView='list',fundSelection=[],pendingAllocation=null,comparisonPriority='balanced';
 try{const stored=JSON.parse(localStorage.getItem('monpeak-portfolio-comparison')||'null');if(stored)comparison=percentagePortfolio(stored);}catch{}
 const persistComparison=()=>{try{localStorage.setItem('monpeak-portfolio-comparison',JSON.stringify(comparison));}catch{notify('לא ניתן לשמור את ההשוואה במכשיר.');}};
 const find=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
 const motion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const persist=()=>{onChange(JSON.parse(JSON.stringify(state)));try{localStorage.setItem('monpeak-portfolio-draft',JSON.stringify(state));}catch{if(!storageWarned){notify('השמירה במכשיר אינה זמינה בדפדפן הזה. אפשר להוריד CSV.');storageWarned=true;}}};
 root.innerHTML=`<div class="portfolio-layout">
 <section class="portfolio-main" aria-label="בניית תיק השקעות">
  <div class="portfolio-tabs" role="tablist" aria-label="תיק וספריית קרנות"><button type="button" id="portfolio-builder-tab" role="tab" data-portfolio-tab="builder" aria-controls="portfolioView">התיק שלי</button><button type="button" id="portfolio-library-tab" role="tab" data-portfolio-tab="library" aria-controls="portfolioView">ספריית קרנות</button><button type="button" id="portfolio-examples-tab" role="tab" data-portfolio-tab="examples" aria-controls="portfolioView">תיקים לדוגמה</button><button type="button" id="portfolio-compare-tab" role="tab" data-portfolio-tab="compare" aria-controls="portfolioView">השוואה</button></div>
  <div id="portfolioView" role="tabpanel" tabindex="-1"></div>
 </section>
 <aside id="portfolioSummary" class="portfolio-summary" aria-label="סיכום התיק" tabindex="-1"></aside>
 </div><div class="portfolio-mobile-bar" id="portfolioMobileBar"></div><dialog class="help-dialog portfolio-dialog" id="portfolioDialog" aria-labelledby="portfolioDialogTitle"><div class="dialog-head"><h2 id="portfolioDialogTitle"></h2><button type="button" class="quiet" data-close-portfolio-dialog>סגירה ✕</button></div><div class="help-copy" id="portfolioDialogBody"></div></dialog>`;

 function showDialog(title,body){
  find('#portfolioDialogTitle').textContent=title;find('#portfolioDialogBody').innerHTML=body;
  const dialog=find('#portfolioDialog');if(!dialog.open)dialog.showModal();
  if(!motion())dialog.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:150,easing:'ease-out'});
 }
 let closing=false;
 function closeDialog(){const dialog=find('#portfolioDialog');if(closing||!dialog.open)return;if(motion()){dialog.close();return;}closing=true;return dialog.animate([{opacity:1},{opacity:0}],{duration:100}).finished.catch(()=>{}).then(()=>{dialog.close();closing=false;});}
 find('#portfolioDialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
 find('#portfolioDialog').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();});

 function update(){persist();renderSummary();updateRows();if(tab==='compare')renderComparisonResults();}
 function setTab(next,{focus=false}={}){tab=next;if(next!=='library')libraryTarget='current';renderView();if(focus){find('#portfolioView').focus({preventScroll:true});find('.portfolio-tabs').scrollIntoView({behavior:motion()?'instant':'smooth',block:'start'});}}
 function renderView(){
  root.dataset.portfolioView=tab;root.classList.toggle('is-library',tab==='library');
  all('[data-portfolio-tab]').forEach(button=>{const selected=button.dataset.portfolioTab===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  find('#portfolioView').setAttribute('aria-labelledby',`portfolio-${tab}-tab`);
  if(tab==='library')renderLibrary();else if(tab==='examples')renderExamples();else if(tab==='compare')renderComparison();else renderBuilder();renderSummary();
 }
 function renderLibrary(){
  find('#portfolioView').innerHTML=`<div class="portfolio-library-head"><div><h2>${libraryTarget==='comparison'?'מוסיפים לתיק ההשוואה':'ספריית קרנות'}</h2><p>${funds.length} קרנות ומוצרים</p></div>${libraryTarget==='comparison'?'<button type="button" class="text-button" data-back-comparison>חזרה להשוואה</button>':info('catalog','נתוני הספרייה')}</div>
  <label class="portfolio-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span class="sr-only">חיפוש קרנות</span><input type="search" id="portfolioSearch" placeholder="שם, סימול או מדד…" autocomplete="off" value="${esc(query)}"></label>
  <details class="portfolio-filters"><summary>סינון ומיון <span>${esc(category==='all'?'כל הקטגוריות':fundGroups[category]||category)}</span></summary><div class="portfolio-filter-options"><div class="portfolio-chips" role="group" aria-label="קטגוריות">${[['all','הכול'],...Object.entries(fundGroups)].map(([key,label])=>`<button type="button" data-category="${key}" aria-pressed="${category===key}">${label} <small>${key==='all'?funds.length:funds.filter(f=>f.group===key).length}</small></button>`).join('')}</div><div class="portfolio-chips" role="group" aria-label="חלוקת דיבידנד">${['all','צוברת','מחלקת','ללא חלוקה'].map(value=>`<button type="button" data-distribution="${value}" aria-pressed="${distribution===value}">${value==='all'?'כל סוגי החלוקה':value}</button>`).join('')}</div><div class="portfolio-chips" role="group" aria-label="מדינת התאגדות">${['all',...new Set(funds.map(f=>f.domicile))].map(value=>`<button type="button" data-domicile="${esc(value)}" aria-pressed="${domicile===value}">${value==='all'?'כל המדינות':value}</button>`).join('')}</div><div class="portfolio-sort" role="group" aria-label="מיון קרנות"><button type="button" data-sort="default" aria-pressed="${sort==='default'}">קבוצות נפוצות</button><button type="button" data-sort="fee" aria-pressed="${sort==='fee'}">דמי ניהול ↑</button><button type="button" data-sort="name" aria-pressed="${sort==='name'}">שם</button></div></div></details>
  <div class="sr-only" id="portfolioSearchStatus" role="status"></div><div class="portfolio-library-tools"><div class="portfolio-view-switch" role="group" aria-label="תצוגת הספרייה"><button type="button" data-library-view="list">רשימה</button><button type="button" data-library-view="cards">כרטיסים</button></div><div id="portfolioSelectionBar"></div><div id="portfolioLibraryBalance"></div></div><div id="portfolioFundGrid"></div>`;
  renderCards();
 }
 function fundIdentity(f){
  return `<label class="portfolio-listing-code"><input type="checkbox" data-select-fund="${f.id}" aria-label="השוואת ${f.id}" ${fundSelection.includes(f.id)?'checked':''} ${fundSelection.length>=3&&!fundSelection.includes(f.id)?'disabled':''}><bdi class="portfolio-ticker">${f.id}</bdi></label>`;
 }
 function renderCards(){
  const target=libraryTarget==='comparison'?comparison:state,selected=target.rows.map(r=>r.id),matches=filterFunds(funds,{query,category,sort,selected,distribution,domicile});
  renderMobileBar(analyzePortfolio(state,funds));
  find('#portfolioSearchStatus').textContent=`${matches.length} קרנות נמצאו`;
  find('#portfolioFundGrid').className=`portfolio-catalog ${libraryView==='cards'?'is-card-view':''}`;
  all('[data-library-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.libraryView===libraryView)));
  find('#portfolioSelectionBar').innerHTML=fundSelection.length?`<span>${fundSelection.length} נבחרו</span><button type="button" class="text-button" data-open-fund-comparison ${fundSelection.length<2?'disabled':''}>השוואת קרנות</button><button type="button" class="quiet" data-clear-fund-selection>ניקוי</button>`:'<span>סמנו 2–3 קרנות להשוואה</span>';
  const balance=analyzePortfolio(target,funds);
  find('#portfolioLibraryBalance').innerHTML=`<strong class="${balance.over?'target-missed':balance.complete?'target-met':''}">${balance.invalid?'יש לתקן הקצאות':balance.over?'חריגה '+pct(balance.weight-100):'נותרו '+pct(Math.max(0,100-balance.weight))}</strong><button type="button" class="text-button" ${libraryTarget==='comparison'?'data-back-comparison':'data-edit-current'}>${libraryTarget==='comparison'?'לחלופה':'לתיק שלי'}</button>`;
  let previousGroup=null;
  find('#portfolioFundGrid').innerHTML=matches.length?`<table class="portfolio-catalog-table"><caption class="sr-only">ספריית קרנות להשוואה ולהוספה לתיק</caption><thead><tr>${['סימול / מספר','שם','שם רשמי','עלות בשנה','התאגדות','מטבע מסחר','חלוקת דיבידנדים','עקיבה וגידור','פעולות'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${matches.map(f=>{
   const added=selected.includes(f.id),cost=annualFundCost(f),siblings=funds.filter(x=>x.id!==f.id&&x.fundKey===f.fundKey),group=sort==='default'&&previousGroup!==f.group?`<tr class="portfolio-group-heading"><th colspan="9" scope="colgroup">${esc(fundGroups[f.group]||'נוספים')}</th></tr>`:'';previousGroup=f.group;
   return `${group}<tr class="portfolio-catalog-fund"><td class="portfolio-code-cell">${fundIdentity(f)}</td><td data-label="שם" class="portfolio-label-cell"><strong dir="auto">${esc(f.label)}</strong></td><td data-label="שם רשמי" class="portfolio-official-cell"><span dir="${/[א-ת]/.test(f.name)?'rtl':'ltr'}">${esc(f.name)}</span>${siblings.length?`<small>אותה קרן גם ב־<bdi>${siblings.map(x=>esc(x.id)).join(' / ')}</bdi></small>`:''}</td><td data-label="עלות בשנה" class="portfolio-cost-cell">${cost===null?'<span class="portfolio-unverified">לא אומתה</span>':pct(cost)}</td><td data-label="התאגדות">${esc(f.domicile)}</td><td data-label="מטבע מסחר"><bdi>${esc(f.currency)}</bdi></td><td data-label="חלוקת דיבידנדים">${esc(f.distribution)}</td><td data-label="עקיבה וגידור" class="portfolio-method-cell"><span>${esc(f.replication)}</span><span>${esc(f.hedging)}</span></td><td class="portfolio-catalog-actions"><button type="button" class="primary" data-add-fund="${f.id}" ${added?'disabled':''} aria-label="${added?'כבר בתיק':'הוספת'} ${f.id}">${added?'✓ בתיק':'＋ הוספה'}</button><button type="button" class="text-button" data-fund-details="${f.id}" aria-label="פרטי ${f.id}">פרטים ומקור</button></td></tr>`;
  }).join('')}</tbody></table>`:`<div class="portfolio-empty-search"><h3>לא נמצאו קרנות</h3><button type="button" class="text-button" data-clear-filters>איפוס חיפוש וסינון</button></div>`;
 }
 function advantageCell(metric,index,value,{win='יתרון במדד',other='פחות עדיף במדד',historical=false}={}){
  let label,kind='neutral';
  if(metric.status==='missing')label=Number.isFinite(metric.values?.[index])?'לא ניתן לדרג בלי כל הנתונים':'חסר נתון';
  else if(metric.status==='incomparable')label='לא בני השוואה';
  else if(metric.status==='tie')label='שוויון';
  else if(metric.best.includes(index)){label=(metric.best.length>1?'יתרון משותף · ':'✓ ')+win;kind=historical?'historical':'best';}
  else{label=other;kind=historical?'neutral':'less';}
  return `<div class="comparison-value comparison-${kind}"><strong>${value}</strong><span class="comparison-badge">${label}</span></div>`;
 }
 function featureCells(selected,key,formatter=f=>esc(f[key]||'לא צוין')){
  return selected.map(f=>`<td><div class="comparison-value comparison-neutral"><span>${formatter(f)}</span></div></td>`).join('');
 }
 function featureLabel(label,selected,key){return `${label}<small class="comparison-feature-note">${new Set(selected.map(f=>f[key])).size===1?'זהה':'תלוי בהעדפה'}</small>`;}
 function openFundComparison(){
  const selected=fundSelection.map(id=>funds.find(f=>f.id===id)).filter(Boolean);if(selected.length<2)return;
  const result=compareFundAdvantages(selected),names=indices=>indices.map(i=>selected[i].id).join(' / '),cheapest=result.cost.status==='ranked'?names(result.cost.best):null;
  let title,reason;
  if(result.sameFund){title='אותה קרן ברישומים שונים';reason='הבדלי סימול ומטבע מסחר אינם מוסיפים פיזור. הבחירה תלויה גם בבורסה ובעמלות ההמרה והמסחר שלך.';}
  else if(!result.dataComplete){title='חסרים נתוני עלות להכרעה';reason='יתרונות ניתנים להשוואה מסומנים בטבלה; לא מסיקים שהקרן עם הנתון החסר זולה או יקרה יותר.';}
  else if(result.preferred.length){title=`${names(result.preferred)} ${result.preferred.length>1?'מובילות':'מובילה'} בעלות`;reason='אותו מדד ומאפיינים דומים בהשוואה. העלות השנתית הידועה נמוכה יותר; מס ונזילות אינם נמדדים.';}
  else if(!result.sameExposure){title='אין מנצחת כוללת בחשיפות שונות';reason=(cheapest?`${cheapest} זולה יותר, אבל `:'')+'הקרנות משקיעות בנכסים או במדדים שונים. קודם בוחרים את החשיפה הרצויה.';}
  else if(result.differences.length){title='אותו מדד, אבל מאפייני הקרנות שונים';reason=(cheapest?`${cheapest} מובילה בעלות. `:'העלות השנתית זהה. ')+'גידור, חלוקה, עקיבה, התאגדות או מטבע מסחר שונים יכולים לשנות את הבחירה עבורך.';}
  else{title='תיקו בנתונים שנבדקו';reason='העלות והמאפיינים שנבדקו זהים. לא נמדדו כאן פערי עקיבה בפועל, נזילות או עלויות המסחר האישיות שלך.';}
  const rows=[
   ['שם מלא',selected.map(f=>`<td><bdi>${esc(f.name)}</bdi></td>`).join('')],
   [featureLabel('מדד / נכס',selected,'benchmark'),featureCells(selected,'benchmark')],
   ['עלות שנתית כוללת',selected.map((f,i)=>`<td>${advantageCell(result.cost,i,annualFundCost(f)===null?'לא אומתה':pct(annualFundCost(f)),{win:'עלות נמוכה',other:'עלות גבוהה יותר'})}</td>`).join('')],
   ['דמי ניהול',selected.map((f,i)=>`<td>${advantageCell(result.fee,i,pct(f.fee),{win:'דמי ניהול נמוכים',other:'דמי ניהול גבוהים יותר'})}</td>`).join('')],
   ['תשואה שנתית בעבר',selected.map((f,i)=>`<td>${advantageCell(result.history,i,returnPct(f.history?.rate),{win:'גבוהה יותר בעבר',other:'נמוכה יותר בעבר',historical:true})}<small class="comparison-period"><bdi>${reviewDate(f.history?.start)} – ${reviewDate(f.history?.end)}</bdi> · ${esc(f.history?.currency||'')}</small></td>`).join('')],
   ...[['התאגדות','domicile'],['בורסה','exchange'],['מטבע מסחר','currency'],['חלוקת דיבידנדים','distribution'],['שיטת עקיבה','replication'],['גידור','hedging']].map(([label,key])=>[featureLabel(label,selected,key),featureCells(selected,key)]),
   ['זהות הקרן',selected.map(f=>`<td><bdi>${esc(f.fundKey)}</bdi></td>`).join('')],
   ['מקור',selected.map(f=>`<td><a href="${esc(f.source)}" target="_blank" rel="noopener noreferrer">מקור רשמי ↗</a></td>`).join('')]
  ];
  showDialog('השוואת קרנות',`<section class="comparison-verdict"><h3>${esc(title)}</h3><p>${esc(reason)}</p></section><div class="portfolio-fund-compare-scroll" tabindex="0" aria-label="טבלת השוואת קרנות, ניתנת לגלילה"><table class="portfolio-fund-compare" style="min-width:${selected.length===2?'0':'560px'}"><thead><tr><th scope="col">נתון</th>${selected.map((f,i)=>`<th scope="col" class="${result.preferred.includes(i)?'comparison-column-best':''}"><bdi>${f.id}</bdi>${result.preferred.includes(i)?'<small class="comparison-column-note">מובילה בעלות</small>':''}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,cells])=>`<tr><th scope="row">${label}</th>${cells}</tr>`).join('')}</tbody></table></div><details class="comparison-method"><summary>איך נקבעת העדיפות?</summary><p>עלות נמוכה יותר היא יתרון באותו מדד ובמאפיינים דומים. שוויון ומידע חסר מסומנים בנפרד. תשואה היסטורית מושווית רק באותה תקופה, שיטה ומטבע, ואינה קובעת את ההעדפה הכוללת. גידור, חלוקה והתאגדות אינם טובים או רעים באופן גורף. נזילות, מס ועמלות אישיות אינם נמדדים.</p></details>`);
 }
 function portfolioVerdictHTML(result){
  const labels=[`א׳ · ${state.name}`,`ב׳ · ${comparison.name}`],winner=result.winner;
  const title=result.status==='incomplete'?'אין הכרעה מלאה — השלימו הקצאות ונתוני עלות':winner===null?'תיקו במודל לפי העדיפות שנבחרה':`${result.provisional?'יתרון מותנה':'יתרון במודל'} ל${winner===0?'תיק שלך':'חלופה'}`;
  const metricNames={cost:'עלות שנתית',diversification:'ציון פיזור במודל',simplicity:'ציון פשטות',returns:'תשואה משוערת / נתוני עבר'};
  const wins=winner===null?[]:Object.keys(result.metrics).filter(key=>key!=='returns'&&result.metrics[key].status==='ranked'&&result.metrics[key].best.includes(winner)).map(key=>metricNames[key]);
  const reason=winner===null?(result.status==='incomplete'?'אין מדרגים מידע חסר כאפס. היתרונות שכן ניתנים להשוואה מופיעים למטה.':'אין יתרון מכריע לפי כללי המודל. אפשר לשנות את הדגש ולבחון את הפשרות.'):`היתרון נובע מ${wins.length?wins.join(', '):'שקלול המדדים לפי הדגש שבחרת'}. ההכרעה לפי הדגש שבחרת; סיכון והתאמה אישית אינם נמדדים.`;
  const weights=Object.entries(result.preference.weights).map(([key,weight])=>`${metricNames[key]} ${Math.round(weight*100)}%`).join(' · ');
  return `<section class="comparison-verdict ${winner===null?'':'has-winner'}"><h2>${esc(title)}</h2><p>${esc(reason)}</p>${result.provisional?'<p class="comparison-provisional">ההשוואה כוללת אומדני עלות שלא אומתו.</p>':''}<div class="comparison-priorities" role="group" aria-label="מה חשוב יותר בהשוואת התיקים"><span>מה חשוב יותר?</span>${Object.entries(comparisonPriorities).map(([key,p])=>`<button type="button" data-comparison-priority="${key}" aria-pressed="${key===comparisonPriority}">${p.label}</button>`).join('')}</div><div class="comparison-totals">${labels.map((label,i)=>`<div class="${winner===i?'comparison-total-best':''}"><span>${esc(label)}</span><strong>${result.totals[i]===null?'—':number(result.totals[i],2)}<small>${result.totals[i]===null?'':' / 10'}</small></strong><b>${winner===i?'✓ מוביל במודל':result.status==='tie'?'שוויון':''}</b></div>`).join('')}</div><div class="comparison-metric-scroll"><table class="comparison-metric-table"><thead><tr><th scope="col">מדד</th>${labels.map(label=>`<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${['cost','diversification','simplicity','returns'].map(key=>{const metric=result.metrics[key],historical=key==='returns';return `<tr><th scope="row">${metricNames[key]}${historical?'<small>נתון השוואתי; לא חלק מהציון</small>':''}</th>${labels.map((_,i)=>`<td>${advantageCell(metric,i,key==='cost'?pct(metric.values[i]):historical?returnPct(metric.values[i]):metric.values[i]===null?'—':`<bdi>${metric.values[i]} / 10</bdi>`,{win:key==='cost'?(result.provisional?'עלות נמוכה באומדן':'עלות נמוכה'):key==='returns'?'גבוהה בהנחות שהוזנו':'ציון גבוה',other:key==='cost'?'עלות גבוהה יותר':key==='returns'?'נמוכה בהנחות שהוזנו':'ציון נמוך יותר',historical})}${historical?`<small class="comparison-period">נכללו ${number(result.projections[i].includedWeight)}% מהתיק</small>`:''}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div><details class="comparison-method"><summary>כללי השקלול וההכרעה</summary><p>${esc(weights)}. הציונים מבוססים על כללי העלות, הריכוזיות ומספר ההחזקות הקיימים באתר. יתרון בכל המדדים, כולל עלות מדויקת, מכריע גם כשהציונים המעוגלים זהים. תשואה גבוהה יותר בהנחות או בעבר אינה מוכיחה עדיפות בעתיד ואינה נכנסת לציון. כשהמשקל שנכלל בחישוב התשואה שונה, לא מסמנים מוביל בתשואה. מס, נזילות וצרכים אישיים אינם נמדדים.</p></details></section>`;
 }
 function openAllocation(id,mode='percent',value=''){
  const f=funds.find(f=>f.id===id),target=libraryTarget==='comparison'?comparison:state;
  if(!f||!target)return;pendingAllocation={id,mode:'percent',target:libraryTarget};
  const summary=analyzePortfolio(target,funds);
  showDialog(`הוספת ${id}`,`<p class="portfolio-allocation-name" dir="auto">${esc(f.label)}</p><form id="portfolioAllocationForm" novalidate><label class="field" for="portfolioAddValue">משקל בתיק<span class="input-wrap"><input id="portfolioAddValue" type="text" inputmode="decimal" dir="ltr" autocomplete="off" value="${esc(value)}" aria-describedby="portfolioAddBalance portfolioAddError"><span class="unit">%</span></span></label><p id="portfolioAddBalance" class="portfolio-add-balance">נותרו להקצאה: ${pct(Math.max(0,100-summary.weight))}</p><p id="portfolioAddAfter" class="portfolio-add-balance" role="status"></p><p id="portfolioAddError" class="portfolio-field-error" role="alert"></p><div class="portfolio-add-actions"><button type="submit" class="primary">הוספה לתיק</button><button type="button" class="text-button" data-fill-add>הקצאת היתרה</button></div></form>`);find('#portfolioAddValue').focus({preventScroll:true});
 }
 function validateAllocation(){
  if(!pendingAllocation)return null;
  const target=pendingAllocation.target==='comparison'?comparison:state,result=allocatePortfolioFund(target,pendingAllocation.id,find('#portfolioAddValue').value,pendingAllocation.mode);
  const messages={'invalid-portfolio':'יש לתקן את ההקצאות הקיימות.','invalid-value':'הזינו הקצאה תקינה, אפס או יותר.','over-allocation':'ההקצאה גבוהה מהיתרה הפנויה.','duplicate':'הקרן כבר נמצאת בתיק.','limit':'אפשר להוסיף עד 100 החזקות.'};
  find('#portfolioAddError').textContent=result.ok?'':messages[result.error];find('#portfolioAddValue').setAttribute('aria-invalid',String(!result.ok));
  if(result.ok){const after=analyzePortfolio(result.state,funds);find('#portfolioAddAfter').innerHTML=`אחרי ההוספה יישארו: ${pct(Math.max(0,100-after.weight))}`;}else find('#portfolioAddAfter').textContent='';
  return result;
 }
 function scoreHTML(data,compact=false){
  const result=portfolioInsights(data,funds);
  if(!result.available)return '<p class="portfolio-analysis-note">השלימו הקצאה של 100% להצגת הציונים.</p>';
  return `<div class="${compact?'portfolio-mini-scores':'portfolio-score-grid'}">${result.scores.map(score=>compact?`<span>${score.label}<strong>${score.value===null?'—':`<bdi>${score.value}<small>/10</small></bdi>`}</strong></span>`:`<article class="portfolio-score"><h3>${score.label}</h3><strong>${score.value===null?'—':`<bdi>${score.value}<small> / 10</small></bdi>`}</strong><details><summary>איך מחושב?</summary><p>${esc(score.summary)}</p><ul>${score.rules.map(rule=>`<li>${esc(rule)}</li>`).join('')}</ul></details></article>`).join('')}</div>`;
 }
 function insightsHTML(data){
  if(!data.rows.length)return '';
  const findings=portfolioFindings(data,funds);
  return `<ul class="portfolio-findings">${findings.filter(f=>f.kind!=='complete').map(f=>`<li class="${f.kind==='error'?'target-missed':''}"><span dir="auto">${esc(f.text)}</span></li>`).join('')}</ul>`;
 }
 const chartColors=['#355b43','#b49b60','#607d9e','#a36d80','#78965b','#9279a8','#548f89','#ba895c','#a49b61','#6c8690','#9a7370','#7f8e68'];
 let chartSerial=0;
 function stableChartColor(item){
  if(item.color)return item.color;
  const key=item.id||item.label,index=funds.findIndex(f=>f.id===key);
  if(index>=0)return `hsl(${Math.round((143+index*137.508)%360)} 31% 45%)`;
  let hash=0;for(const letter of key)hash=(hash*31+letter.charCodeAt(0))>>>0;
  return chartColors[hash%chartColors.length];
 }
 function chartHTML(items,title){
  if(!items.length)return '';
  let offset=0;const chartId=++chartSerial;
  return `<section class="portfolio-pie-panel" data-pie-panel><h3>${title}</h3><div class="portfolio-pie-content"><div class="portfolio-pie-visual"><svg class="portfolio-donut" viewBox="0 0 120 120" role="img" aria-label="${title}"><circle cx="60" cy="60" r="43" fill="none" stroke="#e8ecdf" stroke-width="16"/>${items.map((item,i)=>{const previous=offset;offset+=item.share;const gap=items.length===1?0:Math.min(.65,item.share*.16);return `<circle class="portfolio-pie-segment" data-pie-index="${i}" data-pie-share="${item.share}" data-pie-label="${esc(item.id||item.label)}" cx="60" cy="60" r="43" pathLength="100" fill="none" stroke="${stableChartColor(item)}" stroke-width="16" stroke-dasharray="${Math.max(.01,item.share-gap)} ${100-Math.max(.01,item.share-gap)}" stroke-dashoffset="${-(previous+gap/2)}" transform="rotate(-90 60 60)"><title>${esc(item.id||item.label)}: ${number(item.share)}%</title></circle>`;}).join('')}<text class="portfolio-pie-center-value" x="60" y="58" text-anchor="middle" aria-hidden="true">100%</text><text class="portfolio-pie-center-label" x="60" y="75" text-anchor="middle" aria-hidden="true">מהתיק</text></svg></div><ul class="portfolio-pie-legend" aria-label="${title}">${items.map((item,i)=>`<li><button type="button" data-pie-index="${i}" data-pie-share="${item.share}" data-pie-label="${esc(item.id||item.label)}" aria-pressed="false" aria-label="${esc(item.id||item.label)}, ${number(item.share)} אחוז"><span class="portfolio-pie-key"><i style="background:${stableChartColor(item)}"></i><span>${item.id?`<bdi>${esc(item.id)}</bdi> `:''}${esc(item.label)}</span></span><bdi class="portfolio-pie-share">${number(item.share)}%</bdi></button></li>`).join('')}</ul></div><p class="portfolio-pie-readout" id="pie-readout-${chartId}" aria-live="polite"></p></section>`;
 }
 function activatePie(panel,index){
  const segment=panel.querySelector(`.portfolio-pie-segment[data-pie-index="${index}"]`),active=!!segment;
  panel.classList.toggle('has-pie-selection',active);panel.dataset.pieActive=active?index:'';
  panel.querySelectorAll('[data-pie-index]').forEach(piece=>{const selected=active&&piece.dataset.pieIndex===String(index);piece.classList.toggle('is-active',selected);if(piece.tagName==='BUTTON')piece.setAttribute('aria-pressed',String(selected));});
  panel.querySelector('.portfolio-pie-center-value').textContent=active?number(Number(segment.dataset.pieShare),1)+'%':'100%';
  const label=active?segment.dataset.pieLabel:'מהתיק';panel.querySelector('.portfolio-pie-center-label').textContent=label.length>14?label.slice(0,13)+'…':label;
  panel.querySelector('.portfolio-pie-readout').textContent=active?`${segment.dataset.pieLabel} · ${number(Number(segment.dataset.pieShare),2)}% מהתיק`:'';
 }
 root.addEventListener('pointerover',event=>{if(event.pointerType==='touch')return;const piece=event.target.closest('[data-pie-index]');if(piece)activatePie(piece.closest('[data-pie-panel]'),piece.dataset.pieIndex);});
 root.addEventListener('pointerout',event=>{const panel=event.target.closest('[data-pie-panel]');if(panel&&!panel.contains(event.relatedTarget))activatePie(panel,panel.dataset.piePinned==='true'?panel.dataset.piePinnedIndex:null);});
 root.addEventListener('focusin',event=>{const piece=event.target.closest('button[data-pie-index]');if(piece)activatePie(piece.closest('[data-pie-panel]'),piece.dataset.pieIndex);});
 root.addEventListener('focusout',event=>{const panel=event.target.closest('[data-pie-panel]');if(panel&&!panel.contains(event.relatedTarget))activatePie(panel,panel.dataset.piePinned==='true'?panel.dataset.piePinnedIndex:null);});
 function chartsHTML(data){
  const a=analyzePortfolio(data,funds),active=a.rows.filter(r=>r.weight>0).sort((x,y)=>y.weight-x.weight);
  if(a.invalid||a.over||!active.length)return '';
  const remainder=a.complete?[]:[{label:'טרם הוקצה',share:Math.max(0,100-a.weight),color:'#dce2d5'}];
  return `<div class="portfolio-pies">${chartHTML([...active.map(r=>({label:r.id,share:r.weight})),...remainder],'חלוקה לפי קרנות')}${chartHTML([...a.groups.map(g=>({label:categories[g.key]?.name||'מידע חסר',share:g.share*a.weight/100,color:categories[g.key]?.color})),...remainder],'חלוקה לפי סוג נכס')}</div>`;
 }
 function returnSource(id){
  const f=funds.find(f=>f.id===id),h=f?.history;
  if(!h){showDialog('מקור התשואה','<p>אין נתון היסטורי מאומת. אפשר להזין הנחה ידנית; 0% מוחרג מהממוצע.</p>');return;}
  showDialog(`מקור התשואה · ${id}`,`<p>${esc(h.basis)}</p>${Number.isFinite(h.rate)?`<dl class="portfolio-detail-list"><div><dt>CAGR היסטורי</dt><dd>${pct(h.rate)}</dd></div><div><dt>תקופה</dt><dd><bdi>${esc(h.start)} – ${esc(h.end)}</bdi></dd></div><div><dt>שנים זמינות</dt><dd>${number(h.years,2)}</dd></div><div><dt>מטבע החישוב</dt><dd>${esc(h.currency)}</dd></div><div><dt>בסיס נתונים</dt><dd>${h.method==='adjusted-close'?'שער מתואם לחלוקות ולפיצולים':'מחיר / מדד'}</dd></div></dl>`:'<p>אין סדרת נתונים מאומתת לחישוב תשואה.</p>'}<p>${esc(h.note||'מכשיר הייחוס עשוי להיות שונה מהקרן; הוצאותיו הפנימיות כבר משתקפות במחיר. מס אישי אינו כלול.')}</p><p>תשואת מכשיר מייצג עשויה לכלול כבר את הוצאותיו הפנימיות; זו אינה תשואה ברוטו של כל קרן בספרייה.</p><p>תשואות עבר אינן תחזית. הממוצע המשוקלל אינו בדיקה היסטורית של תיק מאוזן.</p><a class="help-source" href="${esc(h.source)}" target="_blank" rel="noopener noreferrer">מקור הנתונים ↗</a>`);
 }
 function historySourceLabel(row){const f=funds.find(f=>f.id===row.id),h=f?.history;return (Object.hasOwn(row,'annualReturn')?'עריכה ידנית · ':'')+(Number.isFinite(h?.rate)?`${h.years>=14.95?'15 שנה':number(h.years,1)+' שנים'} · ${h.currency}`:'אין נתון מאומת');}
 function refreshReturnSources(data){data.rows.forEach(row=>all('[data-return-source]').filter(button=>button.dataset.returnSource===row.id).forEach(button=>button.textContent=historySourceLabel(row)));}
 function returnInput(row,comparisonRow=false){
  const f=funds.find(f=>f.id===row.id),h=f?.history,rate=holdingAnnualReturn(row,f),value=Object.hasOwn(row,'annualReturn')?row.annualReturn:(Number.isFinite(rate)?rate:''),max=Math.max(200,Math.ceil((Number(rate)||0)/10)*10);
  const source=historySourceLabel(row);
  return `<div class="portfolio-return-control"><label class="field portfolio-return-field">תשואה משוערת בשנה<span class="input-wrap"><input type="text" inputmode="decimal" dir="ltr" ${comparisonRow?'data-compare-return':'data-row-return'}="${esc(row.id)}" value="${esc(value??'')}" aria-label="תשואה שנתית משוערת ${esc(row.id)}"><span class="unit">%</span></span><input type="range" class="value-slider portfolio-return-slider" ${comparisonRow?'data-compare-return-slider':'data-return-slider'}="${esc(row.id)}" min="-100" max="${max}" step=".5" value="${Number(rate)||0}" aria-label="גרירת תשואה שנתית ${esc(row.id)}"></label><button type="button" class="portfolio-return-source" data-return-source="${esc(row.id)}" aria-label="מקור התשואה ${esc(row.id)}">${source}</button></div>`;
 }
 function renderExamples(){
  find('#portfolioView').innerHTML=`<div class="portfolio-library-head"><h2>תיקים לדוגמה</h2></div><div class="portfolio-template-grid">${templates.map(t=>{const data=percentagePortfolio(portfolioFromTemplate(t)),a=analyzePortfolio(data,funds),projection=projectPortfolio(data,funds);return `<article class="portfolio-template"><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p>${chartHTML(a.rows.map(r=>({id:r.id,label:r.fund?.label||r.id,share:r.weight})),'חלוקת התיק')}<dl class="portfolio-example-metrics"><div><dt>עלות שנתית</dt><dd>${a.weightedFee===null?'לא ידועה במלואה':pct(a.weightedFee)}</dd></div><div><dt>תשואה משוערת ${info('returns','הנחות התשואה')}</dt><dd>${returnPct(projection.gross)}</dd><small class="portfolio-return-coverage">על ${number(projection.includedWeight)}% מהתיק</small></div></dl>${scoreHTML(data,true)}<div class="portfolio-template-actions"><button type="button" class="primary" data-load-template="${t.id}">טעינה לתיק שלי</button><button type="button" class="text-button" data-template-compare="${t.id}">השוואה לתיק שלי</button></div></article>`;}).join('')}</div>`;
 }
 function useComparison(data){comparison=percentagePortfolio(data);persistComparison();setTab('compare',{focus:true});}
 function renderComparison(){
  const saved=getSaved().filter(s=>s.tool==='portfolio');
  find('#portfolioView').innerHTML=`<div class="portfolio-library-head"><h2>השוואת תיקים</h2><button type="button" class="text-button" data-clone-comparison ${!state.rows.length?'disabled':''}>שכפול התיק שלי</button></div><details class="portfolio-compare-picker"><summary>טעינה מתיק שמור או מתבנית</summary><div>${saved.map(s=>`<button type="button" data-compare-saved="${s.id}">תיק שמור · ${esc(s.name||'תיק השקעות')}</button>`).join('')}${templates.map(t=>`<button type="button" data-template-compare="${t.id}">${esc(t.name)}</button>`).join('')}</div></details><div id="portfolioComparisonVerdict"></div><div class="portfolio-compare-controls"><section><h3>א׳ · ${esc(state.name)}</h3><ul class="portfolio-compare-current">${analyzePortfolio(state,funds).rows.map(r=>`<li><span><bdi>${esc(r.id)}</bdi> ${esc(r.fund?.label||'מידע חסר')}</span>${pct(r.weight)}</li>`).join('')}</ul><button type="button" class="text-button" data-edit-current>עריכת התיק שלי</button></section><section><h3>ב׳ · החלופה</h3>${comparison?`<label class="field">שם החלופה<input type="text" data-compare-name value="${esc(comparison.name)}" maxlength="60"></label><div class="portfolio-alternative-rows">${comparison.rows.map(row=>`<div class="portfolio-alternative-row"><div><bdi>${esc(row.id)}</bdi><button type="button" class="portfolio-remove" data-compare-remove="${esc(row.id)}" aria-label="הסרת ${esc(row.id)} מההשוואה">✕</button></div><label class="field">משקל בתיק<span class="input-wrap"><input type="text" inputmode="decimal" dir="ltr" data-compare-row="${esc(row.id)}" value="${esc(row.value)}" aria-label="משקל ${esc(row.id)} בחלופה"><span class="unit">%</span></span><input type="range" class="value-slider" data-compare-weight-slider="${esc(row.id)}" min="0" max="100" step=".5" value="${Number(row.value)||0}" aria-label="גרירת משקל ${esc(row.id)} בחלופה"></label>${returnInput(row,true)}</div>`).join('')}</div><label class="portfolio-estimate-toggle"><input type="checkbox" data-compare-estimates ${comparison.includeReported?'checked':''}>שימוש בעלויות לא מאומתות כאומדן</label><div class="portfolio-compare-actions"><button type="button" class="text-button" data-compare-add>＋ הוספת קרן</button><button type="button" class="text-button" data-compare-equal>חלוקה שווה</button><button type="button" class="text-button" data-save-comparison>שמירת החלופה</button></div>`:'<p>בחרו תיק שמור, תבנית או שכפול של התיק שלי.</p>'}</section></div><div id="portfolioComparisonResults"></div>`;
  renderComparisonResults();
 }
 function renderComparisonResults(){
  if(!comparison||!find('#portfolioComparisonResults'))return;
  const advantages=comparePortfolioAdvantages(state,comparison,funds,comparisonPriority);find('#portfolioComparisonVerdict').innerHTML=portfolioVerdictHTML(advantages);
  const result=comparePortfolios(state,comparison,funds),a=result.left.analysis,b=result.right.analysis,pa=projectPortfolio(state,funds),pb=projectPortfolio(comparison,funds);
  all('[data-compare-row]').forEach(input=>{const row=b.rows.find(r=>r.id===input.dataset.compareRow);input.setAttribute('aria-invalid',String(!row?.valid));});
  all('[data-compare-return]').forEach(input=>{const n=parseAnnualReturn(input.value);input.setAttribute('aria-invalid',String(!Number.isFinite(n)));const slider=all('[data-compare-return-slider]').find(e=>e.dataset.compareReturnSlider===input.dataset.compareReturn);if(slider){slider.max=Math.max(200,Math.ceil((n||0)/10)*10);slider.value=Number.isFinite(n)?n:0;slider.style.setProperty('--fill',`${(Number(slider.value)+100)/(Number(slider.max)+100)*100}%`);}});
  all('[data-compare-weight-slider]').forEach(input=>{const row=comparison.rows.find(r=>r.id===input.dataset.compareWeightSlider);input.value=Number(row?.value)||0;input.style.setProperty('--fill',`${Number(input.value)}%`);});
  refreshReturnSources(comparison);
  const comparisonCards=`<div class="portfolio-comparison-panels">${[[state,a,pa,'א׳'],[comparison,b,pb,'ב׳']].map(([data,analysis,projection,label])=>`<section><h3>${label} · ${esc(data.name)}</h3><dl class="portfolio-example-metrics"><div><dt>הקצאה</dt><dd class="${analysis.over||analysis.invalid?'target-missed':analysis.complete?'target-met':''}">${analysis.invalid?'שגיאה':pct(analysis.weight)}</dd></div><div><dt>עלות שנתית</dt><dd>${pct(analysis.weightedFee)}</dd></div><div><dt>תשואה משוערת ${info('returns','הנחות התשואה')}</dt><dd>${returnPct(projection.gross)}</dd><small class="portfolio-return-coverage">על ${number(projection.includedWeight)}% מהתיק</small></div></dl>${chartsHTML(data)}${scoreHTML(data,true)}</section>`).join('')}</div>`;
  if(!result.available){find('#portfolioComparisonResults').innerHTML=`<p class="portfolio-analysis-note">נדרשת הקצאה תקינה של 100% בכל צד. א׳: ${pct(a.weight)} · ב׳: ${pct(b.weight)}</p>${comparisonCards}`;return;}
  const signed=n=>(n>0?'+':'')+number(n,4);
  find('#portfolioComparisonResults').innerHTML=`<div class="portfolio-comparison-deltas"><span>פער עלות שנתית (ב׳ פחות א׳)<strong>${result.feeDelta===null?'—':`<bdi>${signed(result.feeDelta)}</bdi> נק׳ אחוז`}</strong></span><span>פער תשואה משוערת<strong>${pa.gross===null||pb.gross===null?'—':`<bdi>${signed(pb.gross-pa.gross)}</bdi> נק׳ אחוז`}</strong></span></div>${comparisonCards}<div class="table-scroll"><table><caption>הבדלי הקצאה</caption><thead><tr><th>נייר</th><th>שם</th><th>א׳</th><th>ב׳</th><th>שינוי בנק׳ אחוז</th></tr></thead><tbody>${result.rows.map(r=>`<tr><td><bdi>${esc(r.id)}</bdi></td><td>${esc(r.fund?.label||'מידע חסר')}</td><td>${pct(r.leftWeight)}</td><td>${pct(r.rightWeight)}</td><td><bdi>${signed(r.delta)}</bdi></td></tr>`).join('')}</tbody></table></div>`;
 }
 function renderBuilder(){
  find('#portfolioView').innerHTML=`<div class="portfolio-editor-head"><label class="field portfolio-name-field">שם התיק<input id="portfolioName" type="text" maxlength="60" value="${esc(state.name)}" autocomplete="off"></label><button type="button" class="text-button" data-open-library>＋ הוספת קרן</button></div><div class="portfolio-holdings-heading"><h2>הקרנות בתיק</h2><div class="portfolio-holding-tools"><button type="button" class="text-button" data-reset-returns>שחזור תשואות היסטוריות</button>${state.rows.length>1?'<button type="button" class="text-button" data-equalize>חלוקה שווה</button>':''}</div></div><p class="portfolio-return-caption">מבוסס על היסטוריה; ניתן לעריכה. 0% מוחרג מהממוצע. ${info('returns','הנחות התשואה')}</p><div class="portfolio-holdings">${state.rows.length?state.rows.map((row,i)=>`<article class="portfolio-holding" data-holding="${esc(row.id)}"><div class="portfolio-holding-title"><button type="button" class="portfolio-holding-link" data-fund-details="${esc(row.id)}"><bdi>${esc(row.id)}</bdi><span>${esc(funds.find(f=>f.id===row.id)?.label||'מידע חסר')}</span></button><button type="button" class="portfolio-remove" data-remove-fund="${esc(row.id)}" aria-label="הסרת ${esc(row.id)}">✕</button></div><div class="portfolio-holding-values"><label class="field">משקל בתיק<span class="input-wrap"><input id="portfolio-row-${i}" type="text" inputmode="decimal" dir="ltr" data-row-value="${esc(row.id)}" value="${esc(row.value)}" aria-label="משקל ${esc(row.id)} בתיק"><span class="unit">%</span></span><input type="range" class="value-slider portfolio-allocation-slider" data-row-slider="${esc(row.id)}" min="0" max="100" step=".5" value="${Number(row.value)||0}" aria-label="גרירת הקצאת ${esc(row.id)}"></label>${returnInput(row)}<button type="button" class="portfolio-fill" data-fill-fund="${esc(row.id)}" aria-label="השלמת יתרה ל־${esc(row.id)}">השלמה</button></div><p class="portfolio-row-error" data-row-error="${esc(row.id)}" hidden>הזינו אחוז בין 0 ל־100.</p></article>`).join(''):'<div class="portfolio-empty"><h3>בחרו את הקרנות שירכיבו את התיק</h3><button type="button" class="primary" data-open-library>לבחירת קרנות</button></div>'}</div>${previousState?'<button type="button" class="text-button" data-undo-template>ביטול החלפת התיק</button>':''}`;
  updateRows();
 }
 function updateRows(){
  if(tab!=='builder')return;
  const summary=analyzePortfolio(state,funds);refreshReturnSources(state);
  summary.rows.forEach(row=>{
   const input=all('[data-row-value]').find(x=>x.dataset.rowValue===row.id),slider=all('[data-row-slider]').find(x=>x.dataset.rowSlider===row.id),error=all('[data-row-error]').find(x=>x.dataset.rowError===row.id),fill=all('[data-fill-fund]').find(x=>x.dataset.fillFund===row.id),rate=all('[data-row-return]').find(x=>x.dataset.rowReturn===row.id);
   input?.setAttribute('aria-invalid',String(!row.valid));if(error)error.hidden=row.valid;
   rate?.setAttribute('aria-invalid',String(!Number.isFinite(parseAnnualReturn(rate.value))));
   const returnSlider=all('[data-return-slider]').find(e=>e.dataset.returnSlider===row.id);if(returnSlider&&rate){const n=parseAnnualReturn(rate.value);returnSlider.max=Math.max(200,Math.ceil((n||0)/10)*10);returnSlider.value=Number.isFinite(n)?n:0;returnSlider.style.setProperty('--fill',`${(Number(returnSlider.value)+100)/(Number(returnSlider.max)+100)*100}%`);}
   if(slider){slider.value=Number(row.value)||0;slider.style.setProperty('--fill',`${Math.min(100,Math.max(0,Number(row.value)||0))}%`);slider.setAttribute('aria-valuetext',`${number(Number(row.value)||0)} אחוזים`);}
   if(fill)fill.disabled=summary.invalid||summary.remaining<=.000001;
  });
 }
 function renderMobileBar(s){
  const alternative=tab==='library'&&libraryTarget==='comparison'&&comparison;
  if(alternative)s=analyzePortfolio(comparison,funds);
  const invalid=!s.validBudget||s.invalid,statusClass=invalid||s.over?'target-missed':s.complete?'target-met':'',choosing=tab==='library'&&fundSelection.length>=2;
  const navigation=`<button type="button" class="${choosing?'text-button':'primary'}" ${alternative?'data-back-comparison':'data-edit-current'}>${alternative?'לחלופה':'לתיק שלי'}</button>`;
  find('#portfolioMobileBar').innerHTML=`<span>${alternative?comparison.rows.length:state.rows.length} ${alternative?'בחלופה':'קרנות'} <strong class="${statusClass}">${invalid?'שגיאה':pct(s.weight)}</strong></span>${choosing?`<button type="button" class="primary" data-open-fund-comparison>השוואה (${fundSelection.length})</button>`:''}${navigation}${!choosing&&!alternative?'<button type="button" class="text-button" data-show-summary>סיכום</button>':''}`;
 }
 function renderSummary(){
  const a=analyzePortfolio(state,funds),projection=projectPortfolio(state,funds),invalid=a.invalid||!a.validBudget;
  renderMobileBar(a);
  find('#portfolioSummary').innerHTML=`<div class="portfolio-summary-heading"><h2>סיכום התיק</h2>${info('allocation','חלוקת התיק')}</div><div class="portfolio-summary-kpis"><div><span>הקצאה</span><strong class="${invalid||a.over?'target-missed':a.complete?'target-met':''}">${invalid?'שגיאה':pct(a.weight)}</strong><small>${a.over?'חריגה '+pct(a.weight-100):'נותרו '+pct(Math.max(0,100-a.weight))}</small></div><div><span>עלות שנתית ${info('fee','עלות שנתית משוקללת')}</span><strong>${pct(a.weightedFee)}</strong>${a.weightedFee===null&&a.allocated>0?'<small>חסרים נתוני עלות</small>':!a.complete&&a.allocated>0?'<small>בחלק שהוקצה</small>':''}</div><div><span>תשואה שנתית משוערת ${info('returns','הנחות התשואה')}</span><strong>${returnPct(projection.gross)}</strong><small>${!a.complete?'נדרשת הקצאה של 100%':!projection.valid?(projection.excludedWeight>0&&projection.includedWeight===0?'כל הנכסים הוגדרו 0%':'יש להשלים הנחות תשואה'):`מבוסס על ${number(projection.includedWeight)}% מהתיק`}</small></div></div>${a.rows.some(r=>r.amount>0&&r.fund?.fee===null&&Number.isFinite(r.fund?.reportedFee))?`<label class="portfolio-estimate-toggle"><input type="checkbox" data-include-reported ${state.includeReported?'checked':''}>שימוש בעלויות לא מאומתות כאומדן</label>`:''}${a.estimatedAmount>0?'<p class="portfolio-fee-note">העלות כוללת אומדנים לא מאומתים.</p>':''}${chartsHTML(state)}${projection.groups.length?`<div class="portfolio-group-returns"><h3>תשואה משוערת לפי סוג נכס ${info('returns','הנחות התשואה')}</h3>${projection.groups.map(g=>`<div><span>${categories[g.key]?.name||'מידע חסר'}</span><strong>${returnPct(g.assumedReturn)}</strong></div>`).join('')}</div>`:''}<h3 class="portfolio-scores-heading">ציוני התיק</h3>${scoreHTML(state)}${insightsHTML(state)}<div class="portfolio-summary-actions"><button type="button" class="primary" data-save-portfolio ${!state.rows.length||invalid||a.over?'disabled':''}>שמירת תיק</button><button type="button" class="text-button" data-open-portfolio-saved>תיקים שמורים</button>${state.rows.length?'<button type="button" class="text-button" data-export-portfolio>הורדת CSV</button>':''}</div>`;
 }
 function fundDetails(id){
  const f=funds.find(x=>x.id===id);if(!f){showDialog(id,'<p>הנייר אינו נמצא בספרייה הנוכחית. העלות שלו לא נכללת כאפס בחישוב.</p>');return;}
  showDialog(`${f.id} · ${f.label}`,`<p dir="ltr">${esc(f.name)}</p><p>${esc(f.description)}</p><dl class="portfolio-detail-list">${[['מדד / נכס ייחוס',f.benchmark],['CAGR היסטורי',Number.isFinite(f.history?.rate)?number(f.history.rate)+'% ('+number(f.history.years,1)+' שנים)':'לא אומת'],['דמי ניהול שנתיים',f.fee===null?'טרם אומתו':number(f.fee,4)+'%'],['עלות שנתית נוספת',Number.isFinite(f.extraFee)?number(f.extraFee,4)+'%':f.extraFee===null?'טרם אומתה':'לא צוינה בנפרד'],['מספר נייר / סימול',f.id],['ISIN',f.isin||'לא אומת'],['בורסה',f.exchange||'ארה״ב'],['מנפיק',f.issuer],['מדינת התאגדות',f.domicile],['מטבע מסחר',f.currency],['מדיניות חלוקה',f.distribution],['שיטת עקיבה',f.replication],['גידור',f.hedging],['תאריך בדיקה',reviewDate(f.verifiedAt)]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${f.listingNote?`<p>${esc(f.listingNote)}</p>`:''}${f.fee===null?`<p>באתר שנבדק דווח ${pct(f.reportedFee)}. הנתון אינו מאומת מול דיווח עדכני, ועלויות נאמן/ניהול משתנות אינן ידועות.</p>`:Number.isFinite(f.reportedFee)&&f.reportedFee!==f.fee?`<p>באתר שנבדק הופיע ${pct(f.reportedFee)}. כאן נעשה שימוש בנתון המקור הרשמי: ${pct(f.fee)}.</p>`:''}<button type="button" class="text-button" data-return-source="${f.id}">מקור ותקופת התשואה ההיסטורית</button><a class="help-source" href="${f.source}" target="_blank" rel="noopener noreferrer">מקור רשמי ופרטי המוצר ↗</a>${f.referenceSource?`<p><a class="help-source" href="${f.referenceSource}" target="_blank" rel="noopener noreferrer">האתר שנבדק להשוואה</a></p>`:''}`);
 }
 function save(){const s=analyzePortfolio(state,funds);if(!state.rows.length||!s.validBudget||s.invalid||s.over)return;onSave({...normalizePortfolio(state),catalogVersion});}
 function exportCSV(){
  const s=analyzePortfolio(state,funds);if(s.invalid||!s.validBudget){notify('יש לתקן את הערכים לפני הייצוא.');return;}
  const cell=v=>{const value=String(v??'');return '"'+(/^[=+\-@\t\r]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';};
  const rows=[['סימול','שם','משקל בתיק (%)','תשואה שנתית היסטורית / הנחה (%)','עלות שנתית (%)','מקור','איכות הנתון'],...s.rows.map(r=>[r.id,r.fund?.name||'מידע חסר',r.weight,Number.isFinite(holdingAnnualReturn(r,r.fund))?holdingAnnualReturn(r,r.fund):'',r.feeRate??'',r.fund?.source||'',r.estimated?'אומדן לא מאומת':r.feeKnown?'מקור רשמי':'מידע חסר'])];
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='MonPeak-portfolio.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 root.addEventListener('input',event=>{
  const input=event.target;
  if(input.dataset.selectFund){const id=input.dataset.selectFund;if(input.checked){if(!fundSelection.includes(id)&&fundSelection.length<3)fundSelection.push(id);}else fundSelection=fundSelection.filter(x=>x!==id);renderCards();all('[data-select-fund]').find(x=>x.dataset.selectFund===id)?.focus({preventScroll:true});return;}
  if(input.dataset.returnSlider||input.dataset.compareReturnSlider){const alt=!!input.dataset.compareReturnSlider,id=input.dataset.returnSlider||input.dataset.compareReturnSlider,target=alt?comparison:state,row=target.rows.find(r=>r.id===id);if(row)row.annualReturn=Number(input.value);const field=all(alt?'[data-compare-return]':'[data-row-return]').find(e=>(alt?e.dataset.compareReturn:e.dataset.rowReturn)===id);if(field)field.value=input.value;if(alt){persistComparison();renderComparisonResults();}else update();return;}
  if(input.dataset.compareWeightSlider){const row=comparison.rows.find(r=>r.id===input.dataset.compareWeightSlider);if(row)row.value=Number(input.value);const field=all('[data-compare-row]').find(e=>e.dataset.compareRow===input.dataset.compareWeightSlider);if(field)field.value=input.value;persistComparison();renderComparisonResults();return;}
  if(input.dataset.rowReturn){const row=state.rows.find(r=>r.id===input.dataset.rowReturn);if(row)row.annualReturn=input.value;update();return;}
  if(input.dataset.compareReturn){const row=comparison.rows.find(r=>r.id===input.dataset.compareReturn);if(row)row.annualReturn=input.value;persistComparison();renderComparisonResults();return;}
  if(input.id==='portfolioAddValue'){validateAllocation();return;}
  if(input.hasAttribute('data-include-reported')){state.includeReported=input.checked;update();find('[data-include-reported]')?.focus({preventScroll:true});return;}
  if(input.hasAttribute('data-compare-name')){comparison.name=input.value;persistComparison();renderComparisonResults();return;}
  if(input.hasAttribute('data-compare-estimates')){comparison.includeReported=input.checked;persistComparison();renderComparisonResults();return;}
  if(input.dataset.compareRow){const row=comparison.rows.find(r=>r.id===input.dataset.compareRow);if(row)row.value=input.value;persistComparison();renderComparisonResults();return;}
  if(input.id==='portfolioSearch'){query=input.value;renderCards();return;}
  if(input.id==='portfolioName'){state.name=input.value;persist();return;}
  if(input.dataset.rowValue!==undefined){const row=state.rows.find(r=>r.id===input.dataset.rowValue);if(row){row.value=input.value;update();}return;}
  if(input.dataset.rowSlider!==undefined){const row=state.rows.find(r=>r.id===input.dataset.rowSlider);if(!row)return;row.value=Number(input.value);const field=all('[data-row-value]').find(x=>x.dataset.rowValue===row.id);if(field)field.value=state.mode==='amount'?number(row.value):row.value;update();}
 });
 root.addEventListener('submit',event=>{
  if(event.target.id!=='portfolioAllocationForm')return;event.preventDefault();const result=validateAllocation();if(!result?.ok){find('#portfolioAddValue').focus();return;}
  const pending=pendingAllocation;pendingAllocation=null;
  if(pending.target==='comparison'){comparison=result.state;persistComparison();}else{state=result.state;update();}
  const closed=closeDialog();renderCards();Promise.resolve(closed).then(()=>find(`[data-fund-details="${pending.id}"]`)?.focus({preventScroll:true}));notify(`${pending.id} נוספה לתיק עם ההקצאה שבחרת.`);
 });
 root.addEventListener('keydown',event=>{
  const pieButton=event.target.closest('button[data-pie-index]');if(pieButton&&['ArrowUp','ArrowDown','Home','End','Escape'].includes(event.key)){event.preventDefault();const panel=pieButton.closest('[data-pie-panel]'),buttons=[...panel.querySelectorAll('button[data-pie-index]')],i=buttons.indexOf(pieButton);if(event.key==='Escape'){panel.dataset.piePinned='false';activatePie(panel,null);return;}buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length].focus();return;}
  const button=event.target.closest('[data-portfolio-tab]');if(button&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const tabs=['builder','library','examples','compare'],index=tabs.indexOf(tab),next=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(index+(event.key==='ArrowLeft'?1:3))%tabs.length];setTab(next);find(`[data-portfolio-tab=${next}]`).focus();}
  if(event.key==='Enter'&&event.target.matches('[data-row-value]')){event.preventDefault();const summary=analyzePortfolio(state,funds);if(!summary.invalid&&summary.validBudget){find('#portfolioSummary').focus({preventScroll:true});find('#portfolioSummary').scrollIntoView({behavior:motion()?'instant':'smooth',block:'start'});}}
 });
 root.addEventListener('click',event=>{
  const piece=event.target.closest('[data-pie-index]');if(piece){const panel=piece.closest('[data-pie-panel]'),same=panel.dataset.piePinned==='true'&&panel.dataset.piePinnedIndex===piece.dataset.pieIndex;panel.dataset.piePinned=String(!same);panel.dataset.piePinnedIndex=same?'':piece.dataset.pieIndex;activatePie(panel,same?null:piece.dataset.pieIndex);return;}
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.loadTemplate){const template=templates.find(t=>t.id===button.dataset.loadTemplate);previousState=JSON.parse(JSON.stringify(state));state=percentagePortfolio(portfolioFromTemplate(template));update();setTab('builder',{focus:true});notify('התמהיל נטען. אפשר לערוך את הקרנות והמשקלים.');return;}
  if(button.hasAttribute('data-undo-template')){state=previousState;previousState=null;update();renderBuilder();return;}
  if(button.dataset.templateCompare){const template=templates.find(t=>t.id===button.dataset.templateCompare);useComparison(percentagePortfolio(portfolioFromTemplate(template)));return;}
  if(button.dataset.compareSaved){const saved=getSaved().find(s=>String(s.id)===button.dataset.compareSaved);if(saved)useComparison(saved.data);return;}
  if(button.hasAttribute('data-clone-comparison')){useComparison(JSON.parse(JSON.stringify(state)));return;}
  if(button.hasAttribute('data-edit-current')){setTab('builder',{focus:true});return;}
  if(button.hasAttribute('data-compare-add')){libraryTarget='comparison';query='';category='all';distribution='all';domicile='all';setTab('library',{focus:true});return;}
  if(button.hasAttribute('data-back-comparison')){setTab('compare',{focus:true});return;}
  if(button.dataset.compareRemove){comparison.rows=comparison.rows.filter(r=>r.id!==button.dataset.compareRemove);persistComparison();renderComparison();return;}
  if(button.hasAttribute('data-compare-equal')){comparison=equalizePortfolio(comparison);persistComparison();renderComparison();return;}
  if(button.hasAttribute('data-save-comparison')){const a=analyzePortfolio(comparison,funds);if(a.invalid||!a.validBudget||a.over||!comparison.rows.length){notify('יש לתקן את הקצאת החלופה לפני שמירה.');return;}onSave({...normalizePortfolio(comparison),catalogVersion});return;}
  if(button.dataset.distribution){distribution=button.dataset.distribution;all('[data-distribution]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.distribution===distribution)));renderCards();return;}
  if(button.dataset.domicile){domicile=button.dataset.domicile;all('[data-domicile]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.domicile===domicile)));renderCards();return;}
  if(button.dataset.portfolioTab){setTab(button.dataset.portfolioTab,{focus:true});return;}
  if(button.hasAttribute('data-open-library')){setTab('library',{focus:true});return;}
  if(button.dataset.addFund){openAllocation(button.dataset.addFund);return;}
  if(button.dataset.libraryView){libraryView=button.dataset.libraryView;renderCards();return;}
  if(button.hasAttribute('data-open-fund-comparison')){openFundComparison();return;}
  if(button.hasAttribute('data-clear-fund-selection')){fundSelection=[];renderCards();return;}
  if(button.hasAttribute('data-fill-add')&&pendingAllocation){const target=pendingAllocation.target==='comparison'?comparison:state,summary=analyzePortfolio(target,funds);find('#portfolioAddValue').value=number(Math.max(0,pendingAllocation.mode==='amount'?summary.remaining:100-summary.weight),8);validateAllocation();return;}
  if(button.hasAttribute('data-focus-allocations')){find('[data-row-value]')?.focus();return;}
  if(button.dataset.removeFund){const index=state.rows.findIndex(r=>r.id===button.dataset.removeFund);state.rows=state.rows.filter(r=>r.id!==button.dataset.removeFund);update();renderBuilder();const next=all('[data-remove-fund]')[Math.min(index,state.rows.length-1)];(next||find('[data-open-library]'))?.focus({preventScroll:true});return;}
  if(button.dataset.fillFund){const s=analyzePortfolio(state,funds),row=state.rows.find(r=>r.id===button.dataset.fillFund);if(!row||s.remaining<=0)return;row.value=Number((parsePortfolioNumber(row.value)+(state.mode==='amount'?s.remaining:100-s.weight)).toPrecision(14));update();renderBuilder();return;}
  if(button.hasAttribute('data-reset-returns')){state.rows.forEach(row=>delete row.annualReturn);update();renderBuilder();return;}
  if(button.hasAttribute('data-equalize')){const s=analyzePortfolio(state,funds);if(!s.validBudget){notify('הזינו סכום תיק תקין לפני חלוקה שווה.');return;}state=equalizePortfolio(state);update();renderBuilder();return;}
  if(button.dataset.category){category=button.dataset.category;all('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));find('.portfolio-filters summary span').textContent=category==='all'?'כל הקטגוריות':fundGroups[category];renderCards();return;}
  if(button.dataset.sort){sort=sort===button.dataset.sort?'default':button.dataset.sort;all('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sort===sort)));renderCards();return;}
  if(button.hasAttribute('data-clear-filters')){query='';category='all';sort='default';distribution='all';domicile='all';renderLibrary();find('#portfolioSearch').focus();return;}
  if(button.dataset.comparisonPriority){comparisonPriority=button.dataset.comparisonPriority;renderComparisonResults();find(`[data-comparison-priority="${comparisonPriority}"]`)?.focus({preventScroll:true});return;}
  if(button.dataset.returnSource){returnSource(button.dataset.returnSource);return;}
  if(button.dataset.fundDetails){fundDetails(button.dataset.fundDetails);return;}
  if(button.dataset.portfolioHelp){const [title,text]=help[button.dataset.portfolioHelp]||help.catalog;showDialog(title,`<p>${esc(text)}</p>`);return;}
  if(button.hasAttribute('data-close-portfolio-dialog')){closeDialog();return;}
  if(button.hasAttribute('data-save-portfolio')){save();return;}
  if(button.hasAttribute('data-open-portfolio-saved')){onOpenSaved();return;}
  if(button.hasAttribute('data-export-portfolio')){exportCSV();return;}
  if(button.hasAttribute('data-show-summary')){if(tab!=='builder')setTab('builder');find('#portfolioSummary').focus({preventScroll:true});find('#portfolioSummary').scrollIntoView({behavior:motion()?'instant':'smooth',block:'start'});}
 });
 persist();renderView();
 return {compareWith:data=>{comparison=percentagePortfolio(data);persistComparison();setTab('compare',{focus:true});}};
}
