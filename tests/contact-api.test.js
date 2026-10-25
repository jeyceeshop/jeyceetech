import test from 'node:test';
import assert from 'node:assert/strict';
import {makeContactHandler,smtpConfig,smtpConfigIssue} from '../server/contact.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};}
const env={SMTP_USER:'hello@jeycee.shop',SMTP_PASS:'test-only-placeholder'};
const req=body=>({method:'POST',headers:{'content-type':'application/json'},body});
const data={topic:'soporte',name:'Cliente',email:'cliente@example.com',message:'Necesito soporte para mi web.',privacy:true,website:''};
async function proof(handler){const r=response();await handler({method:'GET'},r);assert.equal(r.code,200);const c=r.data.challenge;return {token:c.token,answer:String(c.operation==='subtract'?c.a-c.b:c.a+c.b)};}
test('SMTP is mandatory, TLS is verified and recipients cannot be overridden',async()=>{
 let r=response();await makeContactHandler({env:{}})({method:'GET'},r);assert.equal(r.code,503);assert.equal(r.data.sent,undefined);assert.equal(r.data.code,'SMTP_USER_MISSING');
 assert.equal(smtpConfigIssue({SMTP_USER:'hello@jeycee.shop'}),'SMTP_PASS_MISSING');assert.equal(smtpConfigIssue({...env,SMTP_USER:'hello'}),'SMTP_USER_INVALID');assert.equal(smtpConfigIssue({...env,SMTP_PORT:'25'}),'SMTP_PORT_INVALID');assert.equal(smtpConfigIssue({...env,SMTP_USER:' hello@jeycee.shop '}),null);
 assert.equal(smtpConfig(env).secure,true);assert.equal(smtpConfig(env).tls.rejectUnauthorized,true);assert.equal(smtpConfig({...env,SMTP_PORT:'587'}).requireTLS,true);
 let sends=0;let message;const handler=makeContactHandler({env,transportFactory:config=>{assert.equal(config.auth.user,env.SMTP_USER);return {sendMail:async mail=>{sends++;message=mail;return {accepted:[mail.to]};},close(){}};}});
 for(const body of [{...data},{...data,privacy:false},{...data,website:'bot'},{...data,email:'bad'}]){r=response();await handler(req(body),r);assert.equal(r.code,400);}assert.equal(sends,0);
 let antispam=await proof(handler);r=response();await handler(req({...data,antispam:{...antispam,answer:'99'}}),r);assert.equal(r.code,400);assert.equal(sends,0);
 r=response();await handler(req({...data,antispam,to:'attacker@example.com'}),r);assert.equal(r.code,200);assert.equal(r.data.sent,true);assert.match(r.data.reference,/^JC-[A-F0-9]{8}$/);assert.equal(message.to,'support@jeycee.shop');assert.equal(message.from.address,'hello@jeycee.shop');assert.equal(message.replyTo.address,'cliente@example.com');assert.ok(message.html.includes('Nueva consulta'));assert.ok(message.html.includes('Necesito soporte para mi web.'));assert.equal(message.attachments[0].cid,'jeycee-contact-mark');assert.ok(!message.text.includes(env.SMTP_PASS));assert.ok(message.subject.includes('[SOPORTE]'));assert.equal(sends,1);
 r=response();await handler(req({...data,antispam}),r);assert.equal(r.code,400);assert.equal(sends,1);
});
test('delivery failures never produce a success response or leak SMTP details',async()=>{
 for(const behavior of ['reject','throw']){const handler=makeContactHandler({env,transportFactory:()=>({sendMail:async()=>{if(behavior==='throw')throw Error('private SMTP failure '+env.SMTP_PASS);return {accepted:[],rejected:['support@jeycee.shop']};},close(){}})});const antispam=await proof(handler);const r=response();await handler(req({...data,antispam}),r);assert.equal(r.code,502);assert.notEqual(r.data.sent,true);assert.ok(!JSON.stringify(r.data).includes(env.SMTP_PASS));}
});
