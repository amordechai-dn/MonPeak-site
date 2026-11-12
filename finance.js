export const money = n => new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:0}).format(n);
export function invest({initial=0,monthly=0,years=20,rate=6,fee=.5,tax=25}) {
 const months=Math.round(years*12), growth=(1+rate/100)**(1/12), cost=(1-fee/100)**(1/12);
 let gross=initial,balance=initial,paid=initial,fees=0; const rows=[{year:0,paid,gross,balance,net:initial,tax:0,fees:0}];
 for(let m=1;m<=months;m++) { gross=gross*growth+monthly; const charge=balance*growth*(1-cost); fees+=charge; balance=balance*growth*cost+monthly;paid+=monthly;
 if(m%12===0||m===months) {const t=Math.max(0,balance-paid)*tax/100;rows.push({year:m/12,paid,gross,balance,net:balance-t,tax:t,fees});}}
 const t=Math.max(0,balance-paid)*tax/100;
 return {gross,balance,paid,fees,tax:t,net:balance-t,profit:balance-paid,rows};
}
export function requiredSaving(target,params){if(invest({...params,monthly:0}).net>=target)return 0;let lo=0,hi=Math.max(1,target);for(let i=0;i<65;i++){let m=(lo+hi)/2;if(invest({...params,monthly:m}).net<target)lo=m;else hi=m;}return hi;}
export function freedom(p){const target=p.income*12/(p.withdrawal/100); const years=p.targetAge-p.age;const result=invest({...p,years});let reached=null;
 for(let m=0;m<=Math.max(0,(110-p.age)*12);m++){if(invest({...p,years:m/12}).net>=target){reached=p.age+m/12;break;}}
 return {...result,target,reached,required:requiredSaving(target,{...p,years}),monthlyIncome:result.net*p.withdrawal/100/12};}
export function payment(principal,monthlyRate,months){if(!months)return principal;return Math.abs(monthlyRate)<1e-12?principal/months:principal*monthlyRate/(1-(1+monthlyRate)**(-months));}
export function loan({amount,years,rate=8,rateType='nominal',method='spitzer',inflation=0,setup=0,monthlyFee=0,reset=12,change=0,variable=false}){
 const n=Math.round(years*12);let balance=amount,totalInterest=0,totalIndex=0,total=setup,rows=[],max=0,first=0;
 for(let m=1;m<=n;m++){const annual=rate+(variable?Math.floor((m-1)/reset)*change:0);const r=rateType==='effective'?(1+annual/100)**(1/12)-1:annual/1200;
 const index=balance*((1+inflation/100)**(1/12)-1);balance+=index;totalIndex+=index;const interest=balance*r;
 let due=method==='equal'?Math.min(balance,amount/n*(1+inflation/100)**(m/12))+interest:method==='balloon'?(m===n?balance+interest:interest):payment(balance,r,n-m+1);
 const principal=due-interest;balance=Math.max(0,balance-principal);due+=monthlyFee;total+=due;totalInterest+=interest;max=Math.max(max,due);if(m===1)first=due;
 rows.push({month:m,payment:due,interest,principal,index,balance,total});}
 return {first,max,total,interest:totalInterest,index:totalIndex,fees:setup+n*monthlyFee,rows};
}
export function mortgage(p){const ltv={single:.75,replacement:.7,investment:.5}[p.buyer];const maximum=p.price*ltv;const need=Math.max(0,p.price-p.equity);const amount=Math.min(maximum,need);const equityGap=Math.max(0,need-maximum)+p.costs;
 const tracks=p.mix==='fixed'?[{share:1,rate:p.fixed,inflation:0}]:p.mix==='half'?[{share:.5,rate:p.fixed,inflation:0},{share:.5,rate:p.prime+p.spread,inflation:0}]:p.mix==='custom'?[{share:p.fixedShare/100,rate:p.fixed,inflation:0},{share:p.indexShare/100,rate:p.indexed,inflation:p.inflation},{share:1-(p.fixedShare+p.indexShare)/100,rate:p.prime+p.spread,inflation:0}]:[{share:1/3,rate:p.fixed,inflation:0},{share:1/3,rate:p.indexed,inflation:p.inflation},{share:1/3,rate:p.prime+p.spread,inflation:0}];
 const results=tracks.map(t=>loan({amount:amount*t.share,years:p.years,rate:t.rate,rateType:'effective',inflation:t.inflation}));
 const rows=results[0].rows.map((r,i)=>({month:r.month,payment:results.reduce((s,t)=>s+t.rows[i].payment,0),balance:results.reduce((s,t)=>s+t.rows[i].balance,0)}));
 const first=rows[0].payment,total=results.reduce((s,r)=>s+r.total,0);const signing=p.price*p.upfront/100;const linked=Math.max(0,p.price-signing)*p.linkShare/100*((1+p.buildIndex/100)**p.delivery-1);
 const bridge=loan({amount:p.bridge,years:p.delivery,rate:p.bridgeRate,method:'balloon'});const bridgeInterest=bridge.interest*(1-p.subsidy/100);
 const atDelivery=Math.max(0,p.price-signing+linked-amount+p.bridge);const ownAtSigning=Math.max(0,signing-p.bridge);const signingGap=Math.max(0,ownAtSigning-p.equity);const remainingEquity=Math.max(0,p.equity-ownAtSigning);const futureCash=invest({initial:remainingEquity,monthly:p.saving,years:p.delivery,rate:p.savingRate,fee:p.fee,tax:p.tax});
 return {amount,maximum,ltv,equityGap,signingGap,first,total,max:Math.max(...rows.map(r=>r.payment)),rows,signing,linked,atDelivery,bridgeInterest,bridgeDue:p.bridge,deliveryGap:Math.max(0,atDelivery+p.costs+bridgeInterest-futureCash.net),futureCash,ratio:first/Math.max(1,p.income-p.obligations)*100};}
