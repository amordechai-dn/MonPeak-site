import {analyzePortfolio,normalizePortfolio,projectPortfolio} from './portfolio-model.js?v=1.21.15';
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
 const costScore=a.weightedFee===null?null:a.weightedFee<=.1?10:a.weightedFee<=.2?9:a.weightedFee<=.3?8:a.weightedFee<=.5?6:a.weightedFee<=1?4:a.weightedFee<=2?2:1;
 const concentrated=active.filter(r=>['crypto','commodities'].includes(r.category)||['1143726','1183953','1150267'].includes(r.id)).reduce((n,r)=>n+r.weight,0);
 const penalties=[];let diversification=10;
 if(concentrated>=50){diversification-=4;penalties.push('4−: לפחות מחצית התיק במוצרים על נכס בודד או ענף ממוקד.');}else if(concentrated>=25){diversification-=2;penalties.push('2−: לפחות רבע מהתיק במוצרים על נכס בודד או ענף ממוקד.');}
 // Assess each country separately; do not classify a US+Israel mix as one country.
 const countryWeights={};for(const row of active){const f=row.fund;if(row.category!=='stocks'||!f)continue;const region=f.region||(['sp500','other-us'].includes(f.group)?'ארה״ב':f.group==='telaviv'?'ישראל':null);if(region&&['ארה״ב','ישראל'].includes(region))countryWeights[region]=(countryWeights[region]||0)+row.weight;}
 const largestCountry=Math.max(0,...Object.values(countryWeights));
 if(largestCountry>80){diversification-=2;penalties.push('2−: מעל 80% במניות בעלות סיווג של אותה מדינה.');}else if(largestCountry>60){diversification-=1;penalties.push('1−: מעל 60% במניות בעלות סיווג של אותה מדינה.');}
 const overlaps=Math.min(2,warnings.length);diversification-=overlaps;if(overlaps)penalties.push(`${overlaps}−: רישומים כפולים או מדדים זהים.`);
 const unknown=active.some(r=>!r.fund),count=active.length,simplicity=count<=4?10:count<=7?8:count<=12?6:count<=20?4:2;
 return {available:true,analysis:a,warnings,scores:[
  {key:'cost',label:'עלות',value:costScore,summary:costScore===null?'חסרים נתוני עלות':a.estimatedAmount>0?'כולל נתונים לא מאומתים':'לפי ההוצאות השנתיות הידועות',rules:['עד 0.1%: 10; עד 0.2%: 9; עד 0.3%: 8; עד 0.5%: 6; עד 1%: 4; עד 2%: 2; מעל 2%: 1.','אין ציון כשנתוני העלות חסרים. אומדנים מסומנים במפורש.']},
  {key:'diversification',label:'פיזור',value:unknown?null:Math.max(1,diversification),summary:'מדד מוסבר לריכוזיות',rules:[...(penalties.length?penalties:['לא הופחתו נקודות לפי הכללים האלה.']),'התחלה מ־10. נבחנים מוצרים ממוקדים, ריכוז במדינה ורישומים/מדדים כפולים. אין קנס על קרן עולמית יחידה או על היעדר אג״ח.','אין כאן מדידת סיכון, המלצה אישית, חישוב החזקות פנימיות או הבטחת תשואה.']},
  {key:'simplicity',label:'פשטות',value:simplicity,summary:`${count} החזקות פעילות לתחזוקה`,rules:['1–4 החזקות: 10; 5–7: 8; 8–12: 6; 13–20: 4; מעל 20: 2.','הציון מתאר עומס תחזוקה בלבד, ולא איכות השקעה.']}
 ]};
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
export const comparisonPriorities={
 balanced:{label:'מאוזן',weights:{cost:.4,diversification:.4,simplicity:.2}},
 cost:{label:'עלות נמוכה',weights:{cost:.7,diversification:.2,simplicity:.1}},
 diversification:{label:'פיזור במודל',weights:{cost:.2,diversification:.7,simplicity:.1}},
 simplicity:{label:'פשטות',weights:{cost:.2,diversification:.2,simplicity:.6}}
};
export function comparePortfolioAdvantages(left,right,catalog,priority='balanced'){
 const plans=[left,right],insights=plans.map(p=>portfolioInsights(p,catalog)),projections=plans.map(p=>projectPortfolio(p,catalog)),a=insights.map(i=>i.analysis),preference=comparisonPriorities[priority]||comparisonPriorities.balanced;
 const metric=(key,lower=false)=>rankComparisonMetric(insights.map(i=>i.scores.find(s=>s.key===key)?.value??null),{lower});
 const metrics={cost:rankComparisonMetric(a.map(x=>x.weightedFee),{lower:true}),diversification:metric('diversification'),simplicity:metric('simplicity')};
 const coverageMatches=Math.abs(projections[0].includedWeight-projections[1].includedWeight)<1e-6;
 metrics.returns=coverageMatches?rankComparisonMetric(projections.map(p=>p.gross),{tolerance:.005}):{status:'incomparable',best:[],values:projections.map(p=>p.gross)};
 const provisional=a.some(x=>x.estimatedAmount>0),valid=insights.every(i=>i.available)&&Object.values(metrics).slice(0,3).every(m=>m.status!=='missing');
 if(!valid)return {status:'incomplete',winner:null,metrics,totals:[null,null],preference,provisional,projections};
 const totals=insights.map(i=>Object.entries(preference.weights).reduce((sum,[key,weight])=>sum+weight*i.scores.find(s=>s.key===key).value,0));
 const dominates=i=>{const other=1-i,feeDifference=a[other].weightedFee-a[i].weightedFee,better=[Math.abs(feeDifference)<=1e-6?0:feeDifference,metrics.diversification.values[i]-metrics.diversification.values[other],metrics.simplicity.values[i]-metrics.simplicity.values[other]];return better.every(x=>x>=-1e-7)&&better.some(x=>x>1e-7);};
 let winner=dominates(0)?0:dominates(1)?1:Math.abs(totals[0]-totals[1])>.005?(totals[0]>totals[1]?0:1):null;
 return {status:winner===null?'tie':provisional?'provisional':'ranked',winner,metrics,totals,preference,provisional,projections};
}
