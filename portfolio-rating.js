import {exposureSnapshots} from './portfolio-exposures.js?v=1.28.2';

// MMP. policy, not an external rating or an investment suitability score.
export const ratingVersion='MMP. 1';
export const ratingMethod=[
 {title:'עלות',text:'הציון גבוה יותר כשהעלות השנתית של התיק נמוכה יותר.',points:[
  'מחשבים את העלות לפי משקל כל קרן בתיק.',
  'כוללים דמי ניהול ועלויות מוצר נוספות שידועות לנו.',
  'עמלות מסחר ומס אינם נכללים בציון.'
 ],example:'עלות שנתית של 0.2% נותנת ציון 8 מתוך 10.',details:[
  {title:'שלבי החישוב',steps:['מחשבים את העלות השנתית המשוקללת של התיק באחוזים.','מכפילים את העלות ב־10.','מחסרים את התוצאה מ־10.','מגבילים את הציון לטווח 0–10.']}
 ]},
 {title:'פשטות',text:'הציון גבוה יותר כשהתיק קל יותר לניהול.',points:[
  'מספר ההשקעות קובע 60% מהציון.',
  'מספר שוקי המסחר קובע 20% מהציון.',
  'סוגי המוצרים קובעים 20% מהציון.'
 ],example:'שלוש קרנות רגילות בשוק מסחר אחד מקבלות ציון 10.',details:[
  {title:'מספר השקעות',headers:['השקעות בתיק','ציון הרכיב'],rows:[['1–4','10'],['5–6','9'],['7–10','7'],['11–15','5'],['16 ומעלה','3']]},
  {title:'שוקי מסחר',headers:['מספר שווקים','ציון הרכיב'],rows:[['1','10'],['2','8'],['3','6'],['4 ומעלה','4']]},
  {title:'סוגי מוצרים',headers:['סוג המוצר','ציון הרכיב'],rows:[['מוצר רגיל','10'],['קרן חוזים עתידיים על נפט','6'],['מוצר ממונף או מוצר שורט','0']]},
  {title:'איך מחברים את הרכיבים?',steps:['סופרים רק השקעות שמשקלן גדול מאפס.','את ציון סוגי המוצרים מחשבים לפי משקל כל מוצר בתיק.','מכפילים כל ציון רכיב במשקלו ומחברים את התוצאות.','קרן ביטקוין רגילה וקרן סינתטית רגילה נחשבות כאן מוצרים רגילים.','אם שוק המסחר חסר, סופרים את הרישום כשוק נוסף. הציון מסומן כאומדן.']}
 ]},
 {title:'אומדן פיזור',text:'הציון מעריך את חלוקת הכסף בין חברות, מדינות וענפים.',points:[
  'חברות ונכסים קובעים 40% מהציון.',
  'מדינות קובעות 30% מהציון.',
  'ענפים וסוגי נכסים קובעים 30% מהציון.',
  'בודקים את ההחזקות בתוך הקרנות. מאחדים החזקות באותה חברה לפני החישוב.'
 ],example:'שתי קרנות עם אותן החזקות ואותם משקלים אינן מוסיפות פיזור זו לזו.',details:[
  {title:'חברות ונכסים',steps:['מחשבים את חלקה של כל חברה או נכס בחלק שנבדק.','מעלים כל חלק בריבוע ומחברים את התוצאות.','מחלקים 1 בתוצאה כדי לקבל מספר החזקות אפקטיבי.','המספר מתאר כמה החזקות שוות־משקל ייצרו ריכוז דומה.','מ־100 החזקות אפקטיביות ומעלה, ציון הרכיב הוא 10.','מתחת ל־100, הציון הוא 10 כפול לוגריתם המספר, חלקי לוגריתם 100.']},
  {title:'מדינות וענפים',steps:['לכל מדינה מחשבים את חלקה בחלק בעל שיוך למדינה.','מעלים כל חלק בריבוע ומחברים את התוצאות.','מחסרים את הסכום מ־1, מחלקים ב־0.45 ומכפילים ב־10.','לענפים מחשבים באותה דרך. משתמשים במחלק 0.8.','מגבילים את ציוני הרכיבים לטווח 0–10.','סחורות וקריפטו אינם משויכים למדינת השקעה.','רכיב המדינות מחושב רק על הנכסים שיש להם שיוך למדינה.','אם אין נכסים כאלה, משקללים חברות וענפים ביחס 40:30.']},
  {title:'איך משתמשים בנתונים?',steps:['לקרנות שעוקבות אחר אותו מדד משתמשים באותם נתוני החזקות.','מדד דומה יכול לשמש קירוב. פרטי המקור מופיעים בהמשך.','מזומן, נגזרים והחזקות שמשקלן עוגל לאפס אינם נכללים בנתוני ההחזקות.','מחלקים מחדש את המשקל בין ההחזקות שנותרו, כך שסכומן יהיה 100%.','התאמת שמות החברות היא אומדן.','מדינת החברה אינה מתארת את כל המדינות שבהן היא מוכרת.','כשחסר מידע, מציגים ציון חלקי רק על החלק שנבדק.','ציון חלקי אינו משמש לציון מסכם או להכרעה בין תיקים.']}
 ]}
];
const bounded=n=>Math.min(10,Math.max(0,n));
const round=n=>Number.isFinite(n)?Math.round((bounded(n)+Number.EPSILON)*10)/10:null;
const fmt=(n,d=1)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:d}).format(n);
const hhi=values=>{const total=values.reduce((a,b)=>a+b,0);return total>0?values.reduce((s,v)=>s+(v/total)**2,0):null;};
const marketAliases={'ארה״ב':'US','תל אביב':'TASE','לונדון':'LSE','Xetra · גרמניה':'XETRA'};
// Same-index listings share the same vector, regardless of wrapper, currency or domicile.
export const ratingBindings={
 VT:'acwi',VOO:'sp500',IVV:'sp500',SPY:'sp500',VXUS:'exus',QQQM:'nasdaq',QQQ:'nasdaq',EQQQ:'nasdaq',
 '1185164':'world','1209220':'acwi','1159235':'acwi','1159094':'europe','1183441':'sp500','1159250':'sp500',
 '1186063':'nasdaq','1159243':'nasdaq','1183490':'emerging','1159169':'emerging','1206895':'russell',IWM:'russell',
 '1225994':'israel','1146356':'israel','1143726':'israel-banks','1183953':'israel-realestate','1150267':'israel-tech'
};
const singles={GLDM:['gold','Gold'],GLD:['gold','Gold'],SGLN:['gold','Gold'],'1144666':['gold','Gold'],'5141627':['gold','Gold'],SLV:['silver','Silver'],USO:['oil','Oil'],CRUD:['oil','Oil'],IBIT:['bitcoin','Crypto'],ETHA:['ethereum','Crypto'],ASOL:['solana','Crypto'],AADA:['cardano','Crypto']};
const sovereigns={SGOV:['United States','US Treasury'],TLT:['United States','US Treasury'],'1159268':['United States','US Treasury'],'1193069':['Israel','Israel Government'],'5131792':['Israel','Israel Government'],'1144591':['Israel','Israel Government'],'5131701':['Israel','Israel Government']};
export function exposureForFund(f){
 if(!f)return null;
 if(f.ratingExposure)return f.ratingExposure;
 const key=ratingBindings[f.id],p=exposureSnapshots[key];
 if(p)return {key,...p,estimated:true};
 if(singles[f.id]){const [asset,sector]=singles[f.id];return {key:asset,companies:[[asset,1]],countries:{},sectors:{[sector]:1},estimated:false,source:f.source,asOf:'2026-11-18'};}
 if(sovereigns[f.id]){const [country,issuer]=sovereigns[f.id];return {key:issuer,companies:[[issuer,1]],countries:{[country]:1},sectors:{'Government bonds':1},estimated:false,source:f.source,asOf:'2026-11-18'};}
 return null;
}
function validVector(p){
 if(!p||!Array.isArray(p.companies)||!p.companies.length)return false;
 const vector=v=>v.every(x=>Number.isFinite(x)&&x>=0)&&Math.abs(v.reduce((a,b)=>a+b,0)-1)<1e-5;
 return p.companies.every(x=>typeof x[0]==='string')&&vector(p.companies.map(x=>x[1]))&&vector(Object.values(p.sectors||{}))&&(!Object.keys(p.countries||{}).length||vector(Object.values(p.countries)));
}
const add=(map,key,value)=>map.set(key,(map.get(key)||0)+value);
function diversification(rows){
 const companies=new Map(),countries=new Map(),sectors=new Map(),sources=[],missing=[];
 let coverage=0,geoCoverage=0;
 for(const r of rows){
  const p=exposureForFund(r.fund);
  if(!validVector(p)){missing.push(r.id);continue;}
  const weight=r.weight/100;coverage+=r.weight;
  for(const [key,v] of p.companies)add(companies,key,v*weight);
  for(const [key,v] of Object.entries(p.sectors))add(sectors,key,v*weight);
  if(Object.keys(p.countries).length){geoCoverage+=r.weight;for(const [key,v] of Object.entries(p.countries))add(countries,key,v*weight);}
  const source=sources.find(s=>s.key===p.key);
  if(source)source.fundIds.push(r.id);else sources.push({key:p.key,url:p.source,asOf:p.asOf,name:p.name||r.fund.name,estimated:p.estimated,fundIds:[r.id]});
 }
 const companyHHI=hhi([...companies.values()]),countryHHI=hhi([...countries.values()]),sectorHHI=hhi([...sectors.values()]);
 const effective=companyHHI===null?null:1/companyHHI;
 const components=[
  {key:'companies',label:'פיזור בין חברות ונכסים',weight:.4,value:effective===null?null:bounded(10*Math.log(effective)/Math.log(100)),fact:effective===null?'חסרים נתוני אחזקות':`ריכוזיות שקולה לכ־${fmt(effective)} החזקות שוות־משקל`},
  {key:'geography',label:'פיזור גאוגרפי',weight:.3,value:countryHHI===null?null:bounded(10*(1-countryHHI)/.45),fact:countryHHI===null?'לא חל: לנכסים שנכללו אין שיוך למדינה':`${countries.size} מדינות; המדינה הגדולה ${fmt(Math.max(...countries.values())/(geoCoverage/100)*100)}% מהחלק בעל שיוך גאוגרפי`},
  {key:'sectors',label:'פיזור בין ענפים וסוגי נכסים',weight:.3,value:sectorHHI===null?null:bounded(10*(1-sectorHHI)/.8),fact:sectorHHI===null?'חסרים נתוני ענפים':`${sectors.size} ענפים וסוגי נכסים; הגדול ${fmt(Math.max(...sectors.values())/(coverage/100)*100)}% מהחלק שנבדק`}
 ];
 const available=components.filter(c=>Number.isFinite(c.value)),denom=available.reduce((s,c)=>s+c.weight,0);
 const partial=coverage<99.999999,value=denom?round(available.reduce((s,c)=>s+c.value*c.weight,0)/denom):null;
 return {key:'diversification',label:'פיזור',value,estimated:true,complete:!partial,coverage:Math.min(100,coverage),components,sources,
  summary:partial?`אומדן על ${fmt(coverage)}% מהתיק; חסרים נתוני אחזקות ל־${missing.join(', ')}.`:'אומדן לפי החברות, המדינות והענפים של קרנות מייצגות.',
  rules:[`קיבלת ${value===null?'—':value} מתוך 10${partial?' בחלק שנבדק בלבד':''}.`,...components.map(c=>`${c.label} (${fmt(c.weight*100)}%): ${c.value===null?'לא חל':fmt(c.value)+'/10'}. ${c.fact}.`),...(countryHHI===null&&coverage>0?['כשאין נכסים עם שיוך למדינה, משקלי שני הרכיבים האחרים מחולקים ביניהם ביחס 40:30.']:geoCoverage<coverage-1e-6?[`החלק הגאוגרפי נבדק על ${fmt(geoCoverage)}% מהתיק; סחורות וקריפטו אינם משויכים למדינת הרישום של הקרן.`]:[]),...(partial?['הציון החלקי אינו משמש לציון מסכם או להכרעה בין תיקים.']:[])]};
}
function simplicity(rows){
 const count=rows.length,markets=new Set();let unknownMarkets=0,complexity=0,known=0;
 for(const r of rows){const f=r.fund;if(!f)continue;known+=r.weight;
  const market=f.ratingMarket||marketAliases[f.exchange];
  if(market)markets.add(market);else{unknownMarkets++;markets.add('unknown:'+r.id);}
  const complexityValue=Number.isFinite(f.maintenanceScore)?bounded(f.maintenanceScore):f.isLeveraged||f.isInverse?0:['USO','CRUD'].includes(f.id)?6:10;
  complexity+=r.weight/100*complexityValue;
 }
 const countScore=count<=4?10:count<=6?9:count<=10?7:count<=15?5:3,marketScore=markets.size<=1?10:markets.size===2?8:markets.size===3?6:4;
 const components=[{label:'מספר השקעות',weight:.6,value:countScore,fact:`${count} השקעות בתיק`},{label:'שוקי מסחר',weight:.2,value:marketScore,fact:`${markets.size} שוקי מסחר${unknownMarkets?' באומדן שמרני':''}`},{label:'מורכבות המוצרים',weight:.2,value:known>=99.999999?complexity:null,fact:'מוצר רגיל: 10; קרן חוזים על נפט: 6; מינוף או שורט: 0'}];
 const complete=known>=99.999999,value=complete?round(components.reduce((s,c)=>s+c.value*c.weight,0)):null;
 return {key:'simplicity',label:'פשטות',value,complete,estimated:unknownMarkets>0,coverage:known,components,summary:'פחות השקעות ופעולות מעקב — תיק פשוט יותר לתחזוקה.',rules:[`קיבלת ${value===null?'—':value} מתוך 10.`,...components.map(c=>`${c.label} (${fmt(c.weight*100)}%): ${c.value===null?'חסר נתון':fmt(c.value)+'/10'}. ${c.fact}.`),...(unknownMarkets?['שוק המסחר המדויק אינו ידוע בחלק מהרישומים. לצורך האומדן, כל רישום כזה נספר כשוק נוסף.']:[])]};
}
export function scorePortfolio(analysis){
 const rows=analysis.rows.filter(r=>r.amount>0),valid=analysis.complete&&!analysis.invalid&&!analysis.over;
 const fee=analysis.weightedFee,cost=valid&&Number.isFinite(fee)&&fee>=0?round(10-10*fee):null;
 const costScore={key:'cost',label:'עלות',value:cost,complete:cost!==null,estimated:analysis.estimatedAmount>0,coverage:cost===null?0:100,summary:'ככל שהעלות השנתית נמוכה יותר, הציון גבוה יותר.',rules:cost===null?['חסרים נתוני עלות, ולכן אין ציון.']:[`עלות התיק: ${fmt(fee,6)}% בשנה — העלות של כל קרן כפול המשקל שלה בתיק.`,`הציון: 10 פחות 10 כפול ${fmt(fee,6)}, כלומר ${cost} מתוך 10.`,`הציון מוגבל לטווח 0–10. העלות כוללת הוצאות מוצר נוספות ידועות; עמלות מסחר ומס אינם כלולים.`]};
 if(!valid)return {source:{name:ratingVersion},scores:[costScore,...['diversification','simplicity'].map(key=>({key,label:key==='simplicity'?'פשטות':'פיזור',value:null,complete:false,coverage:0,rules:['נדרשת הקצאה תקינה של 100%.']}))],details:{}};
 const d=diversification(rows),s=simplicity(rows);
 return {source:{name:ratingVersion},scores:[costScore,d,s],details:{version:ratingVersion,coverage:d.coverage,sources:d.sources}};
}
