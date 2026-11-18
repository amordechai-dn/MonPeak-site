import {analyzePortfolio} from './portfolio-model.js?v=1.27.2';
import {riskSnapshot} from './portfolio-risk-data.js?v=1.27.2';

const monthNumber=month=>/^\d{4}-(0[1-9]|1[0-2])$/.test(month)?Number(month.slice(0,4))*12+Number(month.slice(5))-1:NaN;
const previousMonth=month=>{const n=monthNumber(month)-1;return `${Math.floor(n/12)}-${String(n%12+1).padStart(2,'0')}`;};
export function annualizedStandardDeviation(returns){
 if(returns.length<2||returns.some(r=>!Number.isFinite(r)))return null;
 const mean=returns.reduce((sum,r)=>sum+r,0)/returns.length;
 const variance=returns.reduce((sum,r)=>sum+(r-mean)**2,0)/(returns.length-1);
 return Math.sqrt(variance*12)*100;
}
function prepare(state,catalog,snapshot){
 const analysis=analyzePortfolio(state,catalog),empty={valid:false,annualized:null,currency:'ILS',months:0,sources:[]};
 if(!analysis.complete||analysis.invalid||analysis.over)return {...empty,reason:'allocation'};
 const rows=analysis.rows.filter(r=>r.weight>0),assets=[],missing=[];
 for(const row of rows){
  const mapping=snapshot.funds[row.id],series=snapshot.series[mapping?.series];
  if(!row.fund||!mapping?.series||!series){missing.push(row.id);continue;}
  if(series.currency!=='ILS')return {...empty,reason:'currency',missing:[row.id]};
  const returns=new Map(),seen=new Set();let prior=null;
  for(const point of series.points){
   const [month,price]=point;
   if(!Number.isFinite(monthNumber(month))||!Number.isFinite(price)||price<=0||seen.has(month)||(prior&&month<=prior[0]))return {...empty,reason:'bad-data',missing:[row.id]};
   seen.add(month);
   if(prior&&monthNumber(month)-monthNumber(prior[0])===1&&month<=snapshot.lastMonth)returns.set(month,price/prior[1]-1);
   prior=point;
  }
  if(!returns.size)return {...empty,reason:'history',missing:[row.id]};
  assets.push({id:row.id,weight:row.weight/100,returns,...mapping,method:series.method,sourceCurrency:series.sourceCurrency});
 }
 if(missing.length)return {...empty,reason:'missing',missing};
 return {valid:true,assets,analysis};
}
function commonWindow(prepared,snapshot){
 let end=snapshot.lastMonth,best=[];
 for(let lag=0;lag<=(snapshot.maxLagMonths??3);lag++,end=previousMonth(end)){
  const months=[];let month=end;
  for(let i=0;i<snapshot.lookbackMonths;i++){
   if(!prepared.every(p=>p.assets.every(a=>a.returns.has(month))))break;
   months.unshift(month);month=previousMonth(month);
  }
  if(months.length>=snapshot.minimumMonths)return months;
  if(months.length>best.length)best=months;
 }
 return best;
}
function finish(prepared,months,snapshot){
 if(!prepared.valid)return prepared;
 if(months.length<snapshot.minimumMonths)return {valid:false,annualized:null,currency:'ILS',months:months.length,reason:'history',sources:prepared.assets};
 // Fixed weights every month imply monthly rebalancing. Combining synchronized
 // returns first incorporates covariance, including negatively correlated assets.
 const returns=months.map(month=>prepared.assets.reduce((sum,a)=>sum+a.weight*a.returns.get(month),0));
 return {valid:true,annualized:annualizedStandardDeviation(returns),currency:'ILS',months:months.length,start:previousMonth(months[0]),end:months.at(-1),returns,monthKeys:months,shortHistory:months.length<snapshot.lookbackMonths,lagMonths:monthNumber(snapshot.lastMonth)-monthNumber(months.at(-1)),estimated:true,sources:prepared.assets.map(({returns,...asset})=>({...asset,annualized:annualizedStandardDeviation(months.map(month=>returns.get(month))),months:months.length})),asOf:snapshot.asOf};
}
export function portfolioVolatility(state,catalog,{snapshot=riskSnapshot}={}){
 const prepared=prepare(state,catalog,snapshot);
 return finish(prepared,prepared.valid?commonWindow([prepared],snapshot):[],snapshot);
}
export function portfolioVolatilityGroup(states,catalog,{snapshot=riskSnapshot}={}){
 const prepared=states.map(state=>prepare(state,catalog,snapshot)),valid=prepared.filter(p=>p.valid);
 const months=valid.length?commonWindow(valid,snapshot):[];
 const comparable=prepared.length>1&&prepared.every(p=>p.valid)&&months.length>=snapshot.minimumMonths;
 // When a shared window is impossible, known individual results remain visible
 // with their own dates, but callers must not rank their volatility against peers.
 const results=prepared.map(p=>finish(p,p.valid?(months.length>=snapshot.minimumMonths?months:commonWindow([p],snapshot)):[],snapshot));
 return {results,comparable,months:comparable?months.length:0,currency:'ILS'};
}

// The same calculation at 100% allocation gives each fund/proxy's own risk.
const singleFund=id=>({budget:100,mode:'percent',rows:[{id,value:100}]});
export function fundVolatility(id,catalog,options){return portfolioVolatility(singleFund(id),catalog,options);}
export function fundVolatilityGroup(ids,catalog,options){return portfolioVolatilityGroup(ids.map(singleFund),catalog,options);}
