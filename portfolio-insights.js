import {scorePortfolio} from './portfolio-rating.js?v=1.25.2';
import {analyzePortfolio,normalizePortfolio,projectPortfolio} from './portfolio-model.js?v=1.25.2';
export const templates=[
 {id:'world-value',name:'עולמי, ערך וקריפטו · 65/30/5',description:'מדד שווקים מפותחים, קרן אקטיבית למניות קטנות עם הטיית ערך, וביטקוין.',rows:[['1185164',65],['AVGS',30],['IBIT',5]]},
 {id:'broad',name:'פיזור רחב',description:'ארה״ב, אירופה, שווקים מתעוררים, ישראל, אג״ח קצרות וביטקוין.',rows:[['1183441',40],['1159094',20],['1183490',10],['1146356',5],['1144591',20],['IBIT',5]]},
 {id:'ninety-ten',name:'מניות ואג״ח · 90/10',description:'90% S&P 500 ו־10% אג״ח ממשלת ישראל קצרות וצמודות.',rows:[['1183441',90],['1144591',10]]},
 {id:'three-regions',name:'ארה״ב, אירופה ומתעוררים',description:'שלוש חשיפות מנייתיות ביחס 60/25/15.',rows:[['1183441',60],['1159094',25],['1183490',15]]},
 {id:'eighty-twenty',name:'מניות ואג״ח · 80/20',description:'60% S&P 500,‏ 20% אירופה ו־20% אג״ח ממשלת ישראל. תמהיל מותאם להמחשה.',rows:[['1183441',60],['1159094',20],['5131792',20]]},
 {id:'four-assets',name:'ארבעה רכיבים · 25% לכל רכיב',description:'מניות ארה״ב, אג״ח ארוכות בדולר, אג״ח קצרות צמודות בישראל וזהב.',rows:[['1183441',25],['TLT',25],['1144591',25],['1144666',25]]},
 {id:'all-weather',name:'כל העונות · תמהיל להמחשה',description:'30% מניות, 55% אג״ח ו־15% זהב ונפט. נפט אינו סל סחורות רחב;',rows:[['1185164',30],['TLT',40],['1193069',15],['1144666',7.5],['USO',7.5]]},
 {id:'us-israel',name:'ארה״ב וישראל · 50/50',description:'S&P 500 לצד ת״א-125 במשקל שווה.',rows:[['1183441',50],['1146356',50]]}
];
export function portfolioFromTemplate(template,budget=100000){return normalizePortfolio({name:template.name,budget,mode:'percent',rows:template.rows.map(([id,value])=>({id,value}))});}
export function portfolioInsights(state,catalog){
 const a=analyzePortfolio(state,catalog),active=a.rows.filter(r=>r.amount>0);
 if(!a.complete)return {available:false,analysis:a,reason:'השלימו הקצאה תקינה של 100% כדי לקבל ניתוח והשוואה.',scores:[],warnings:[]};
 const indexGroups=new Map(),fundGroups=new Map();
 for(const row of active){const f=row.fund;if(!f)continue;const key=f.fundKey||f.id;fundGroups.set(key,[...(fundGroups.get(key)||[]),row]);if(f.benchmark)indexGroups.set(f.benchmark,[...(indexGroups.get(f.benchmark)||[]),row]);}
 const warnings=[];
 for(const rows of fundGroups.values())if(rows.length>1)warnings.push({kind:'same-fund',text:`${rows.map(r=>r.id).join(' / ')} הם רישומים של אותה קרן; מטבע מסחר שונה אינו מוסיף פיזור.`});
 for(const [index,rows] of indexGroups)if(new Set(rows.map(r=>r.fund.fundKey||r.id)).size>1)warnings.push({kind:'same-index',text:`${rows.map(r=>r.id).join(' / ')} עוקבים אחר ${index}. זו חפיפה במדד, לא חישוב חפיפה באחוזי ההחזקות.`});
 const scoring=scorePortfolio(a);
 return {available:true,analysis:a,warnings,scores:scoring.scores,scoringDetails:scoring.details,scoringSource:scoring.source};
}
export function comparePortfolios(left,right,catalog){
 const a=portfolioInsights(left,catalog),b=portfolioInsights(right,catalog);
 if(!a.available||!b.available)return {available:false,left:a,right:b};
 const ids=[...new Set([...a.analysis.rows,...b.analysis.rows].map(r=>r.id))];
 const rows=ids.map(id=>{const x=a.analysis.rows.find(r=>r.id===id),y=b.analysis.rows.find(r=>r.id===id);return {id,fund:x?.fund||y?.fund,leftWeight:x?.weight||0,rightWeight:y?.weight||0,delta:(y?.weight||0)-(x?.weight||0)};}).sort((x,y)=>Math.abs(y.delta)-Math.abs(x.delta));
 return {available:true,left:a,right:b,rows,feeDelta:a.analysis.weightedFee!==null&&b.analysis.weightedFee!==null?b.analysis.weightedFee-a.analysis.weightedFee:null,costDelta:a.analysis.annualCost!==null&&b.analysis.annualCost!==null?b.analysis.annualCost-a.analysis.annualCost:null,sameBudget:Math.abs(a.analysis.budget-b.analysis.budget)<.005};
}

export function portfolioFindings(state,catalog){
 const a=analyzePortfolio(state,catalog),items=[];
 if(a.invalid||!a.validBudget)return [{kind:'error',text:'יש לתקן את הערכים המסומנים לפני ניתוח התיק.'}];
 if(a.over)items.push({kind:'error',text:`ההקצאה חורגת ב־${new Intl.NumberFormat('he-IL',{maximumFractionDigits:2}).format(a.weight-100)}% מסכום התיק.`});
 else if(!a.complete)items.push({kind:'allocation',text:`נותרו ${new Intl.NumberFormat('he-IL',{maximumFractionDigits:2}).format(Math.max(0,100-a.weight))}% להקצאה.`});
 else items.push({kind:'complete',text:'התיק מוקצה במלואו — 100%.'});
 const active=a.rows.filter(r=>r.amount>0),keys=new Map(),benchmarks=new Map();
 for(const r of active){const f=r.fund;if(!f)continue;const key=f.fundKey||f.id;keys.set(key,[...(keys.get(key)||[]),r]);if(f.benchmark)benchmarks.set(f.benchmark,[...(benchmarks.get(f.benchmark)||[]),r]);}
 for(const rows of keys.values())if(rows.length>1)items.push({kind:'same-fund',text:`${rows.map(r=>r.id).join(' / ')} הם רישומים של אותה קרן, ולא פיזור נוסף.`});
 for(const [benchmark,rows] of benchmarks)if(new Set(rows.map(r=>r.fund.fundKey||r.id)).size>1)items.push({kind:'same-index',text:`${rows.map(r=>r.id).join(' / ')} עוקבים אחר אותו מדד: ${benchmark}.`});
 if(active.length&&!a.allFeesKnown)items.push({kind:'missing-cost',text:'חסרים נתוני עלות בחלק מההחזקות. העלות הכוללת עדיין אינה ידועה.'});
 if(a.rows.some(r=>r.amount===0))items.push({kind:'zero',text:'יש קרנות ללא הקצאה. הגדירו להן משקל או הסירו אותן.'});
 return items;
}


export function rankComparisonMetric(values,{lower=false,tolerance=1e-6}={}){
 if(values.length<2||values.some(v=>!Number.isFinite(v)))return {status:'missing',best:[],values};
 const target=(lower?Math.min:Math.max)(...values),best=values.flatMap((v,i)=>Math.abs(v-target)<=tolerance?[i]:[]);
 return {status:best.length===values.length?'tie':'ranked',best,values};
}
const sameText=values=>new Set(values.map(v=>String(v??'').trim().toLowerCase().replace(/[\s−–-]+/g,''))).size===1;
export function compareFundAdvantages(selected){
 const total=f=>Number.isFinite(f.fee)?f.fee+(Number.isFinite(f.extraFee)?f.extraFee:0):null;
 const cost=rankComparisonMetric(selected.map(total),{lower:true}),fee=rankComparisonMetric(selected.map(f=>f.fee),{lower:true});
 const historyComparable=selected.length>1&&selected.every(f=>Number.isFinite(f.history?.rate))&&['start','end','currency','method'].every(key=>selected.every(f=>f.history[key])&&sameText(selected.map(f=>f.history[key])));
 const history=historyComparable?rankComparisonMetric(selected.map(f=>f.history.rate),{tolerance:.005}):{status:'incomparable',best:[],values:selected.map(f=>f.history?.rate??null)};
 const sameFund=selected.length>1&&selected.every(f=>f.fundKey)&&sameText(selected.map(f=>f.fundKey));
 const sameExposure=selected.length>1&&selected.every(f=>f.benchmark)&&sameText(selected.map(f=>f.benchmark));
 const differences=['distribution','hedging','replication','domicile','currency'].filter(key=>!sameText(selected.map(f=>f[key])));
 const comparable=sameExposure&&!differences.length&&!sameFund;
 return {cost,fee,history,sameFund,sameExposure,differences,comparable,preferred:comparable&&cost.status==='ranked'?cost.best:[],dataComplete:cost.status!=='missing'};
}
export const comparisonPriorities={balanced:{label:'MonPeak',weights:{cost:1/3,diversification:1/3,simplicity:1/3}}};
export function comparePortfolioAdvantages(left,right,catalog,priority='balanced'){
 const plans=[left,right],insights=plans.map(p=>portfolioInsights(p,catalog)),projections=plans.map(p=>projectPortfolio(p,catalog)),a=insights.map(i=>i.analysis),preference=comparisonPriorities[priority]||comparisonPriorities.balanced;
 const metric=(key,lower=false)=>{const scores=insights.map(i=>i.scores.find(s=>s.key===key)),values=scores.map(s=>s?.value??null);return scores.some(s=>s?.complete===false)?{status:'incomparable',best:[],values,coverage:scores.map(s=>s?.coverage??0)}:{...rankComparisonMetric(values,{lower,tolerance:.049999}),coverage:scores.map(s=>s?.coverage??0)};};
 const metrics={cost:rankComparisonMetric(a.map(x=>x.weightedFee),{lower:true}),diversification:metric('diversification'),simplicity:metric('simplicity')};
 const scoreMetrics={cost:metric('cost'),diversification:metrics.diversification,simplicity:metrics.simplicity};
 const coverageMatches=Math.abs(projections[0].includedWeight-projections[1].includedWeight)<1e-6;
 metrics.returns=coverageMatches?rankComparisonMetric(projections.map(p=>p.gross),{tolerance:.005}):{status:'incomparable',best:[],values:projections.map(p=>p.gross)};
 const provisional=a.some(x=>x.estimatedAmount>0),valid=insights.every(i=>i.available&&i.scores.every(s=>s.complete!==false&&Number.isFinite(s.value)))&&Object.values(metrics).slice(0,3).every(m=>!['missing','incomparable'].includes(m.status));
 if(!valid)return {status:'incomplete',winner:null,metrics,scoreMetrics,totals:[null,null],preference,provisional,projections};
 const totals=insights.map(i=>Object.entries(preference.weights).reduce((sum,[key,weight])=>sum+weight*i.scores.find(s=>s.key===key).value,0));
 const deltas=['cost','diversification','simplicity'].map(key=>insights[1].scores.find(s=>s.key===key).value-insights[0].scores.find(s=>s.key===key).value),up=deltas.some(x=>x>=.05),down=deltas.some(x=>x<=-.05),mixed=up&&down;
 const winner=mixed||!up&&!down?null:up?1:0;
 return {status:mixed?'mixed':winner===null?'tie':provisional?'provisional':'ranked',winner,metrics,scoreMetrics,totals,preference,provisional,projections,mixed};
}
