import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOrdersHandler} from '../server/orders.js';
import {offerFor} from '../src/pricing.js';
function response(){return {setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};}
const env={SMTP_USER:'hello@jeycee.shop',SMTP_PASS:'test-only-placeholder'};
const body={product:'desarrollo-web--basico',name:'Cliente',countryCode:'+507',phone:'6123-4567',email:'cliente@example.com',brief:'Quiero una web para mi emprendimiento.',privacy:true,website:''};
const request=body=>({method:'POST',headers:{'content-type':'application/json'},body});
async function proof(handler){const res=response();await handler({method:'GET'},res);assert.equal(res.code,200);const c=res.data.challenge;return {token:c.token,answer:String(c.operation==='subtract'?c.a-c.b:c.a+c.b)};}
test('orders mail only to business, calculate prices server-side and return the same order number for WhatsApp',async()=>{
 let message,sends=0;const handler=makeOrdersHandler({env,transportFactory:()=>({sendMail:async mail=>{sends++;message=mail;return {accepted:['business@jeycee.shop']};},close(){}})});
 let res=response();await handler(request(body),res);assert.equal(res.code,400);assert.equal(sends,0);
 for(const change of [{privacy:false},{countryCode:undefined},{phone:undefined},{countryCode:''},{phone:''},{countryCode:'507'},{countryCode:'+1234'},{phone:'123'},{phone:'abc61234567'},{countryCode:'+507',phone:'12345678901234'},{phone:{number:'61234567'}},{product:'unknown'},{coupon:'NO-ACTIVO'},{website:'spam'},{name:'Name\r\nBcc: malicious@example.com'}]){res=response();await handler(request({...body,...change}),res);assert.equal(res.code,400);}assert.equal(sends,0);
 const antispam=await proof(handler);res=response();await handler(request({...body,antispam,to:'someone@example.com',price:1,number:'FORGED'}),res);assert.equal(res.code,200);assert.equal(res.data.created,true);assert.match(res.data.number,/^JC-\d{8}-[A-F0-9]{24}$/);assert.equal(res.data.price,offerFor('desarrollo-web','basico').price);assert.equal(sends,1);assert.equal(message.to,'business@jeycee.shop');assert.equal(message.replyTo.address,'cliente@example.com');assert.ok(message.subject.includes(res.data.number));assert.ok(message.html.includes(res.data.number));assert.ok(message.html.includes('NÚMERO DE PEDIDO'));assert.ok(message.text.includes(body.brief));assert.ok(message.html.includes('+507 61234567'));assert.ok(message.text.includes('+507 61234567'));assert.ok(new URL(res.data.whatsappUrl).searchParams.get('text').includes('+507 61234567'));assert.equal(message.attachments[0].cid,'jeycee-contact-mark');const url=new URL(res.data.whatsappUrl);assert.equal(url.pathname,'/50760913544');assert.ok(url.searchParams.get('text').includes(res.data.number));assert.ok(!JSON.stringify(res.data).includes(env.SMTP_PASS));
 res=response();await handler(request({...body,antispam}),res);assert.equal(res.code,400);assert.equal(sends,1);
});
test('mail errors never create a successful order; email remains optional',async()=>{
 for(const accepted of [false,true]){let message;const handler=makeOrdersHandler({env,transportFactory:()=>({sendMail:async mail=>{message=mail;return {accepted:accepted?['business@jeycee.shop']:[]};},close(){}})});const antispam=await proof(handler),res=response();await handler(request({...body,email:'',antispam}),res);assert.equal(res.code,accepted?200:502);if(!accepted)assert.notEqual(res.data.created,true);else{assert.equal(message.replyTo,undefined);assert.ok(message.html.includes('El cliente no indicó correo'));}}
 const missing=response();await makeOrdersHandler({env:{}})({method:'GET'},missing);assert.equal(missing.code,503);
});
test('JEYCEE10 is recalculated by the server and included in email and WhatsApp without stacking promotions',async()=>{
 let message;const handler=makeOrdersHandler({env,transportFactory:()=>({sendMail:async mail=>{message=mail;return {accepted:['business@jeycee.shop']};},close(){}})});
 for(const [product,expected] of [['redes-sociales--pro',179.1],['desarrollo-web--basico',261],['desarrollo-web--business',null]]){
  const antispam=await proof(handler),res=response();await handler(request({...body,product,coupon:' jeycee10 ',price:1,discount:99,antispam}),res);
  assert.equal(res.code,200);assert.equal(res.data.coupon,'JEYCEE10');assert.equal(res.data.price,expected);assert.equal(message.to,'business@jeycee.shop');assert.ok(message.html.includes('JEYCEE10'));assert.ok(message.text.includes('JEYCEE10'));
  const text=new URL(res.data.whatsappUrl).searchParams.get('text');assert.ok(text.includes('JEYCEE10'));
  if(product==='redes-sociales--pro'){assert.ok(text.includes('$179.10'));assert.ok(text.includes('solo para el primer periodo'));}
 }
});
