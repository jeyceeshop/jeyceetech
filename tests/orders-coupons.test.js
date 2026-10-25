import test from 'node:test';
import assert from 'node:assert/strict';
import {activeCoupons,couponQuote} from '../src/coupons.js';
import {createOrderNumber,saveOrderNumber,recentOrderNumber} from '../src/order-drafts.js';
const product={key:'sample--pro',serviceSlug:'sample',id:'pro',basePrice:100,price:90};
test('no unauthorized active coupons; eligibility, expiry and nonstacking preserve valid prices',()=>{
 assert.equal(activeCoupons.length,0);assert.equal(couponQuote(product).price,90);
 assert.throws(()=>couponQuote(product,'NOEXISTE'),/no está disponible/);
 const rules=[{code:'TEST20',type:'percent',value:20,active:true,serviceSlugs:['sample'],tiers:['pro']}];
 const result=couponQuote(product,' test20 ',{rules});assert.equal(result.price,80);assert.equal(result.discount,10);assert.equal(result.code,'TEST20');
 assert.equal(couponQuote(product,'TEST20',{rules:[{...rules[0],value:5}]}).price,90);
 assert.equal(couponQuote(product,'TEST20',{rules:[{...rules[0],stackWithPromotion:true}]}).price,72);
 assert.equal(couponQuote(product,'TEST20',{rules:[{...rules[0],type:'amount',value:200}]}).price,0);
 assert.throws(()=>couponQuote(product,'TEST20',{rules:[{...rules[0],expiresAt:'2026-01-01T00:00:00Z'}],now:new Date('2026-01-02')}),/caducado/);
 assert.throws(()=>couponQuote({...product,serviceSlug:'other'},'TEST20',{rules}),/no aplica/);
 assert.throws(()=>couponQuote(product,'TEST20',{rules:[{...rules[0],active:false}]}),/no está disponible/);
 assert.equal(couponQuote({...product,price:null},'TEST20',{rules}).pending,true);
});
test('local order references preserve numbers and never retain personal form data',()=>{
 const number=createOrderNumber(new Date('2026-11-01T02:00:00Z'));assert.match(number,/^JC-20261031-[A-F0-9]{8}$/);
 const state=new Map();const storage={getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,v)};
 const order={number,productKey:'sample--pro',createdAt:'2026-11-01T02:00:00Z',price:90,coupon:'',name:'Persona privada',countryCode:'+507',phone:'61234567',email:'private@example.com',brief:'Texto privado'};
 assert.equal(saveOrderNumber(order,storage),true);assert.equal(saveOrderNumber(order,storage),true);assert.equal(recentOrderNumber(storage),number);
 const raw=[...state.values()][0],rows=JSON.parse(raw);assert.equal(rows.length,1);assert.ok(!raw.includes('Persona privada'));assert.ok(!raw.includes('private@example.com'));assert.ok(!raw.includes('Texto privado'));assert.ok(!raw.includes('61234567'));assert.equal(rows[0].status,'pending-whatsapp');
 for(let i=0;i<25;i++)saveOrderNumber({...order,number:createOrderNumber()},storage);assert.equal(JSON.parse([...state.values()][0]).length,20);
 assert.equal(saveOrderNumber(order,{getItem(){throw Error('blocked');}}),false);assert.equal(recentOrderNumber({getItem(){return '{bad json';}}),null);
});
