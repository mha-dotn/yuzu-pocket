const test=require('node:test');
const assert=require('node:assert/strict');
require('../ledger.js');
const {reconcile,balance,monthTotals}=global.PocketLedger;
let next=0;const id=()=>`t${++next}`;
const fixture=()=>({createdMonth:'2026-10',categories:[{id:'g',name:'原神',active:true,plans:[{from:'2026-10',amount:2500}]}],transactions:[],skippedRecurring:[]});

test('month rollover carries the old balance and adds one new monthly deposit',()=>{
  const s=fixture();reconcile(s,'2026-10',id);s.transactions.push({id:'e1',date:'2026-10-20',categoryId:'g',type:'expense',amount:1500});
  assert.equal(balance(s.transactions,'g'),1000);reconcile(s,'2026-11',id);assert.equal(balance(s.transactions,'g'),3500);
  assert.equal(s.transactions.filter(t=>t.type==='contribution').length,2);
});
test('months without opening the app are all reconciled, without duplicate deposits',()=>{
  const s=fixture();reconcile(s,'2026-10',id);reconcile(s,'2027-02',id);reconcile(s,'2027-02',id);
  assert.equal(balance(s.transactions,'g'),12500);assert.equal(s.transactions.filter(t=>t.type==='contribution').length,5);
});
test('recurring deposit amount changes only on its effective month; prior records remain',()=>{
  const s=fixture();reconcile(s,'2026-10',id);s.categories[0].plans.push({from:'2026-11',amount:4000});reconcile(s,'2026-12',id);
  assert.deepEqual(s.transactions.filter(t=>t.type==='contribution').map(t=>t.amount),[2500,4000,4000]);
});
test('editing and deleting an expense recalculates its category balance',()=>{
  const s=fixture();reconcile(s,'2026-10',id);s.transactions.push({id:'e',date:'2026-10-20',categoryId:'g',type:'expense',amount:500});assert.equal(balance(s.transactions,'g'),2000);
  s.transactions.find(t=>t.id==='e').amount=700;assert.equal(balance(s.transactions,'g'),1800);s.transactions=s.transactions.filter(t=>t.id!=='e');assert.equal(balance(s.transactions,'g'),2500);
});
test('recurring history deleted by the user is not generated again',()=>{
  const s=fixture();reconcile(s,'2026-10',id);s.skippedRecurring.push('g:2026-10');s.transactions=s.transactions.filter(t=>t.recurringKey!=='g:2026-10');reconcile(s,'2026-10',id);assert.equal(s.transactions.length,0);
});
test('month summary separates saved and spent totals',()=>{
  const s=fixture();reconcile(s,'2026-10',id);s.transactions.push({id:'e',date:'2026-10-20',categoryId:'g',type:'expense',amount:500});assert.deepEqual(monthTotals(s.transactions,'2026-10'),{saved:2500,spent:500});
});
test('JSON backup restore preserves balances and prior contribution plans',()=>{
  const s=fixture();reconcile(s,'2026-10',id);s.transactions.push({id:'e',date:'2026-10-20',categoryId:'g',type:'expense',amount:500});s.categories[0].plans.push({from:'2026-11',amount:4000});
  const restored=JSON.parse(JSON.stringify(s));assert.equal(balance(restored.transactions,'g'),2000);assert.equal(restored.categories[0].plans[0].amount,2500);assert.equal(restored.categories[0].plans[1].amount,4000);
});
test('balances remain independent between categories',()=>{
  const s=fixture();s.categories.push({id:'goods',name:'グッズ',active:true,plans:[{from:'2026-10',amount:3000}]});reconcile(s,'2026-10',id);s.transactions.push({id:'e',date:'2026-10-20',categoryId:'g',type:'expense',amount:3000});assert.equal(balance(s.transactions,'g'),-500);assert.equal(balance(s.transactions,'goods'),3000);
});
