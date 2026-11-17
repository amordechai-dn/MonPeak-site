export function parsePortfolioNumber(value){
 const raw=String(value??'').replace(/[,\s\u200e\u200f\u202a-\u202e\u2066-\u2069₪]/g,'');
 return /^\d+(?:\.\d*)?$/.test(raw)&&Number.isFinite(Number(raw))?Number(raw):NaN;
}
export function normalizePortfolio(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
 const budget=parsePortfolioNumber(raw.budget??100000),seen=new Set();
 return {version:1,name:typeof raw.name==='string'?raw.name.slice(0,60):'התיק שלי',mode:raw.mode==='amount'?'amount':'percent',includeReported:raw.includeReported===true,budget:Number.isFinite(budget)&&budget>0&&budget<=1e12?budget:100000,rows:(Array.isArray(raw.rows)?raw.rows:[]).filter(r=>r&&typeof r.id==='string'&&r.id.length<=40&&!seen.has(r.id)&&seen.add(r.id)).slice(0,100).map(r=>{const value=parsePortfolioNumber(r.value);return {id:r.id,value:Number.isFinite(value)&&value<=1e12?value:0};})};
}
export function analyzePortfolio(state,catalog){
 const budget=parsePortfolioNumber(state.budget),validBudget=budget>0&&budget<=1e12,lookup=new Map(catalog.map(f=>[f.id,f]));
 let invalid=false;
 const rows=state.rows.map(row=>{
  const value=parsePortfolioNumber(row.value),valid=Number.isFinite(value)&&value>=0&&value<=(state.mode==='amount'?1e12:100);
  if(!valid)invalid=true;
  const amount=valid&&validBudget?(state.mode==='amount'?value:budget*value/100):0,fund=lookup.get(row.id);
  const verified=!!fund&&Number.isFinite(fund.fee)&&fund.fee>=0,estimated=!verified&&state.includeReported===true&&Number.isFinite(fund?.reportedFee)&&fund.reportedFee>=0;
  const rate=verified?fund.fee:estimated?fund.reportedFee:null,feeRate=rate===null?null:rate+(Number.isFinite(fund.extraFee)?fund.extraFee:0),known=feeRate!==null;
  return {...row,fund,valid,amount,weight:validBudget?amount/budget*100:0,feeKnown:known,estimated,feeRate,annualCost:known?amount*feeRate/100:null,category:fund?.category||'unknown'};
 });
 const allocated=rows.reduce((n,r)=>n+r.amount,0),knownAmount=rows.reduce((n,r)=>n+(r.feeKnown?r.amount:0),0),annualKnownCost=rows.reduce((n,r)=>n+(r.annualCost??0),0);
 const weight=validBudget?allocated/budget*100:0,complete=validBudget&&!invalid&&rows.length>0&&Math.abs(weight-100)<1e-7,over=weight>100+1e-7;
 const coverage=allocated>0?knownAmount/allocated*100:0,allFeesKnown=rows.filter(r=>r.amount>0).every(r=>r.feeKnown);
 const groups=Object.entries(rows.reduce((out,r)=>{out[r.category]=(out[r.category]||0)+r.amount;return out;},{})).filter(([,amount])=>amount>0).map(([key,amount])=>({key,amount,share:allocated>0?amount/allocated*100:0})).sort((a,b)=>b.amount-a.amount);
 const estimatedAmount=rows.reduce((n,r)=>n+(r.estimated?r.amount:0),0);
 return {estimatedAmount,rows,budget,validBudget,invalid,allocated,weight,complete,over,remaining:validBudget?budget-allocated:0,coverage,allFeesKnown,annualKnownCost,annualCost:validBudget&&!invalid&&allFeesKnown&&allocated>0?annualKnownCost:null,weightedFee:!invalid&&allFeesKnown&&allocated>0?annualKnownCost/allocated*100:null,groups};
}
export function convertPortfolioMode(state,mode){
 if(mode===state.mode)return state;
 const budget=parsePortfolioNumber(state.budget);
 if(!(budget>0)||state.rows.some(r=>!Number.isFinite(parsePortfolioNumber(r.value))))return null;
 return {...state,mode,rows:state.rows.map(row=>({...row,value:Number((mode==='amount'?parsePortfolioNumber(row.value)*budget/100:parsePortfolioNumber(row.value)/budget*100).toPrecision(14))}))};
}
export function equalizePortfolio(state){
 const total=state.mode==='amount'?parsePortfolioNumber(state.budget):100,n=state.rows.length;
 if(!n||!Number.isFinite(total)||total<=0)return state;
 // Keep currency-sized steps without creating negative remainders for tiny totals.
 const base=Math.floor(total/n*100)/100,values=state.rows.map(()=>base);
 values[n-1]=Number((total-base*(n-1)).toPrecision(14));
 return {...state,rows:state.rows.map((r,i)=>({...r,value:values[i]}))};
}
export function filterFunds(catalog,{query='',category='all',sort='default',selected=[],distribution='all',domicile='all'}={}){
 let q=query.trim().toLocaleLowerCase();try{const url=new URL(q);if(url.hostname==='market.tase.co.il'){const match=url.pathname.match(/\/security\/(\d+)/);if(match)q=match[1];}}catch{}const ids=new Set(selected);
 return catalog.filter(f=>(category==='all'||f.group===category||f.category===category)&&(distribution==='all'||f.distribution===distribution)&&(domicile==='all'||f.domicile===domicile)&&(q===''||[f.id,f.name,f.label,f.issuer,f.benchmark,f.exposure,f.isin,f.exchange].some(x=>String(x??'').toLocaleLowerCase().includes(q)))).map((fund,index)=>({fund,index})).sort((a,b)=>{
  const exact=Number(b.fund.id.toLowerCase()===q)-Number(a.fund.id.toLowerCase()===q);if(exact)return exact;
  if(sort==='fee'){const cost=f=>Number.isFinite(f.fee)?f.fee+(Number.isFinite(f.extraFee)?f.extraFee:0):Infinity;return cost(a.fund)-cost(b.fund)||a.fund.id.localeCompare(b.fund.id);}
  if(sort==='name')return a.fund.name.localeCompare(b.fund.name);
  if(sort==='selected')return Number(ids.has(b.fund.id))-Number(ids.has(a.fund.id))||a.index-b.index;
  return a.index-b.index;
 }).map(x=>x.fund);
}

// Add one allocation without changing any existing holding or accepting an over-allocation.
export function allocatePortfolioFund(state,id,rawValue,inputMode=state.mode){
 const summary=analyzePortfolio(state,[]),value=parsePortfolioNumber(rawValue);
 if(summary.invalid||!summary.validBudget)return {ok:false,error:'invalid-portfolio'};
 if(state.rows.some(row=>row.id===id))return {ok:false,error:'duplicate'};
 if(state.rows.length>=100)return {ok:false,error:'limit'};
 if(!Number.isFinite(value)||value<0||inputMode==='percent'&&value>100)return {ok:false,error:'invalid-value'};
 const money=inputMode==='amount'?value:summary.budget*value/100;
 if(money>summary.remaining+Math.max(1e-7,summary.budget*1e-12))return {ok:false,error:'over-allocation'};
 const stored=state.mode==='amount'?money:money/summary.budget*100;
 return {ok:true,state:{...state,rows:[...state.rows,{id,value:Number(stored.toPrecision(14))}]}};
}
