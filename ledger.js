/* Pure balance and recurring-deposit rules, shared by the app and its tests. */
(() => {
  const monthAfter=(month,n=1)=>{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-1+n,1)).toISOString().slice(0,7)};
  const planFor=(cat,month)=>(cat.plans||[]).filter(p=>p.from<=month).sort((a,b)=>a.from.localeCompare(b.from)).at(-1)?.amount||0;
  const balance=(transactions,catId)=>transactions.reduce((sum,t)=>t.categoryId===catId?sum+(t.type==='expense'?-Number(t.amount):Number(t.amount)):sum,0);
  const monthTotals=(transactions,month)=>{const ts=transactions.filter(t=>t.date?.slice(0,7)===month);return{saved:ts.filter(t=>t.type==='contribution').reduce((a,t)=>a+Number(t.amount),0),spent:ts.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0)}};
  function reconcile(state,endMonth,idFactory){const initialMonth=state.createdMonth||endMonth;state.skippedRecurring ||= [];for(const cat of state.categories){if(!cat.active)continue;const start=cat.createdMonth&&cat.createdMonth>initialMonth?cat.createdMonth:initialMonth;for(let m=start;m<=endMonth;m=monthAfter(m)){const key=`${cat.id}:${m}`;if(state.skippedRecurring.includes(key))continue;if(!state.transactions.some(t=>t.recurringKey===key))state.transactions.push({id:idFactory(),date:`${m}-01`,categoryId:cat.id,type:'contribution',amount:planFor(cat,m),note:'毎月の自動積立',recurringKey:key,createdAt:Date.now()})}}return state}
  globalThis.PocketLedger={planFor,balance,monthTotals,reconcile,monthAfter};
})();
