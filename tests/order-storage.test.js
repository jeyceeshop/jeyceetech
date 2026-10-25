import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrderNumber,saveOrderNumber,recentOrderNumber} from '../src/order-drafts.js';
test('local order references preserve numbers and never retain personal form data',()=>{
 const number=createOrderNumber(new Date('2026-11-01T02:00:00Z'));assert.match(number,/^JC-20261031-[A-F0-9]{24}$/);
 const state=new Map();const storage={getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,v)};
 const order={number,productKey:'sample--pro',createdAt:'2026-11-01T02:00:00Z',price:90,coupon:'',name:'Persona privada',countryCode:'+507',phone:'61234567',email:'private@example.com',brief:'Texto privado'};
 assert.equal(saveOrderNumber(order,storage),true);assert.equal(saveOrderNumber(order,storage),true);assert.equal(recentOrderNumber(storage),number);
 const raw=[...state.values()][0],rows=JSON.parse(raw);assert.equal(rows.length,1);assert.ok(!raw.includes('Persona privada'));assert.ok(!raw.includes('private@example.com'));assert.ok(!raw.includes('Texto privado'));assert.ok(!raw.includes('61234567'));assert.equal(rows[0].status,'pending-whatsapp');
 for(let i=0;i<25;i++)saveOrderNumber({...order,number:createOrderNumber()},storage);assert.equal(JSON.parse([...state.values()][0]).length,20);
 assert.equal(saveOrderNumber(order,{getItem(){throw Error('blocked');}}),false);assert.equal(recentOrderNumber({getItem(){return '{bad json';}}),null);
});
