import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makeAdminHandler} from '../server/admin.js';
import {makeTrackingHandler} from '../server/tracking.js';
import {makeOrdersHandler} from '../server/orders.js';
import {makeContactHandler} from '../server/contact.js';
import {sessionValue,isAdmin} from '../server/admin-auth.js';
import {hashKey,newTrackingKey} from '../server/portal-store.js';
import {notifyPortal} from '../server/portal-email.js';
const env={PORTAL_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-only-test-placeholder',ADMIN_PASSWORD:'test-long-password-only',ADMIN_SESSION_SECRET:'test-session-secret-with-more-than-32-characters',SMTP_USER:'hello@jeycee.shop',SMTP_PASS:'test-smtp-placeholder',VERCEL:'1'};
const headers={host:'jeycee.test',origin:'https://jeycee.test','content-type':'application/json','x-forwarded-proto':'https'};
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
function req(method='GET',query={},body={},auth=false){return {method,query,body,headers:{...headers,...(auth?{cookie:'jeycee_admin='+sessionValue(env)}:{})}};}
const reference='JC-20261025-A1B2C3D4';
function store(){
 const key=newTrackingKey();let entry={reference,kind:'order',name:'Nombre privado',email:'private@example.com',phone:'+507 61234567',company:'Privada',service:'Desarrollo web',plan:'Básico',content:'Brief confidencial',recipient:'business@jeycee.shop',tracking_hash:hashKey(key),submission_key:randomUUID(),submission_fingerprint:'private fingerprint',challenge_nonce:'nonce',status:'received',version:1,created_at:new Date().toISOString()};
 const messages=[{id:'public',author:'staff',visibility:'public',body:'Respuesta pública',created_at:entry.created_at},{id:'private',author:'staff',visibility:'internal',body:'NOTA SECRETA',created_at:entry.created_at}];
 let created=null,sends=0;const db={key,entry,thread:messages,async limit(){},async find(ref){return ref===entry.reference?entry:null;},async messages(){return messages;},async list(){return {entries:[entry],hasMore:false};},async stats(){return {orders:1,tickets:0,active:1,waiting:0};},async action(ref,version,action,data){if(version!==entry.version){const e=Error('conflict');e.status=409;throw e;}entry.version++;if(action==='rotate')entry.tracking_hash=data.hash;if(action==='update')entry.status=data.status;if(['reply','note'].includes(action))messages.push({id:randomUUID(),author:'staff',visibility:action==='note'?'internal':'public',body:data.message,created_at:new Date().toISOString()});return {...entry};},async clientMessage(ref,body){messages.push({id:randomUUID(),author:'client',visibility:'public',body});},async create(data){if(created)return {entry:created,inserted:false};created={...data,created_at:new Date().toISOString()};return {entry:created,inserted:true};},async mailStatus(){},get captured(){return created;}};return db;
}
async function challenge(handler){const res=response();await handler(req(),res);assert.equal(res.code,200);const c=res.data.challenge;return {token:c.token,answer:String(c.operation==='subtract'?c.a-c.b:c.a+c.b)};}
test('admin enforces server authentication, same-origin writes, secure cookie and revocable expiring sessions',async()=>{
 const db=store(),handler=makeAdminHandler({env,store:db});
 for(const action of ['list','detail','reply','update','rotate']){const res=response();await handler(req(action==='list'||action==='detail'?'GET':'POST',{action,reference},{message:'x'}),res);assert.equal(res.code,401);}
 let res=response();await handler(req('POST',{action:'login'},{password:'wrong'}),res);assert.equal(res.code,401);
 res=response();await handler(req('POST',{action:'login'},{password:env.ADMIN_PASSWORD}),res);assert.equal(res.code,200);const cookie=res.headers['Set-Cookie'];for(const attribute of ['HttpOnly','Secure','SameSite=Strict','Max-Age=28800'])assert.ok(cookie.includes(attribute));assert.ok(!cookie.includes(env.ADMIN_PASSWORD));
 const session=req();session.headers.cookie=cookie;assert.equal(isAdmin(session,env),true);assert.equal(isAdmin(session,{...env,ADMIN_PASSWORD:'changed-long-password'}),false);assert.equal(isAdmin(session,env,Date.now()+9*3600000),false);
 const foreign=req('POST',{action:'reply',reference},{version:1,message:'x'},true);foreign.headers.origin='https://evil.example';res=response();await handler(foreign,res);assert.equal(res.code,403);
 res=response();await handler(req('GET',{action:'detail',reference},{},true),res);assert.equal(res.code,200);for(const hidden of ['tracking_hash','submission_key','submission_fingerprint','challenge_nonce'])assert.ok(!(hidden in res.data.entry));
 res=response();await handler(req('POST',{action:'logout'},{},true),res);assert.ok(res.headers['Set-Cookie'].includes('Max-Age=0'));
 const limited=makeAdminHandler({env,store:{...db,async limit(){const e=Error('limited');e.status=429;e.retryAfter=900;throw e;}}});res=response();await limited(req('POST',{action:'login'},{password:env.ADMIN_PASSWORD}),res);assert.equal(res.code,429);assert.equal(res.headers['Retry-After'],'900');
});
test('public tracking requires number, private key and signed proof; private data and notes never leave the server',async()=>{
 const db=store(),handler=makeTrackingHandler({env,store:db});
 for(const change of [{key:''},{key:newTrackingKey()},{reference:'JC-FFFFFFFF'}]){const res=response();await handler(req('POST',{}, {action:'lookup',reference,key:db.key,...change,antispam:await challenge(handler)}),res);assert.equal(res.code,404);assert.ok(!JSON.stringify(res.data).includes('NOTA SECRETA'));}
 const proof=await challenge(handler);let res=response();await handler(req('POST',{}, {action:'lookup',reference,key:db.key,antispam:proof}),res);assert.equal(res.code,200);assert.equal(res.data.messages.length,1);const serialized=JSON.stringify(res.data);for(const hidden of ['Nombre privado','private@example.com','61234567','Brief confidencial','NOTA SECRETA',db.key])assert.ok(!serialized.includes(hidden));
 res=response();await handler(req('POST',{}, {action:'lookup',reference,key:db.key,antispam:proof}),res);assert.equal(res.code,400);
 res=response();await handler(req('POST',{}, {action:'message',reference,key:db.key,message:'Mi consulta',messageId:randomUUID(),antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.ok(res.data.messages.some(m=>m.body==='Mi consulta'));
 const admin=makeAdminHandler({env,store:db});res=response();await admin(req('POST',{action:'rotate',reference},{version:db.entry.version,confirm:true},true),res);assert.equal(res.code,200);assert.notEqual(res.data.tracking.key,db.key);
 res=response();await handler(req('POST',{}, {action:'lookup',reference,key:db.key,antispam:await challenge(handler)}),res);assert.equal(res.code,404);
});
test('admin replies and internal notes persist independently of SMTP; stale versions and invalid dates are rejected',async()=>{
 const db=store();let notified=0;const handler=makeAdminHandler({env,store:db,notifier:async()=>{notified++;throw Error('SMTP failure');}});
 let res=response();await handler(req('POST',{action:'note',reference},{version:1,message:'Nota privada',notify:true},true),res);assert.equal(res.code,200);assert.equal(notified,0);
 res=response();await handler(req('POST',{action:'reply',reference},{version:2,message:'Respuesta para cliente',notify:true},true),res);assert.equal(res.code,200);assert.equal(res.data.notification,'failed');assert.equal(notified,1);assert.ok(db.thread.some(m=>m.body==='Respuesta para cliente'&&m.visibility==='public'));
 res=response();await handler(req('POST',{action:'update',reference},{version:1,status:'completed',assignee:'A',dueDate:''},true),res);assert.equal(res.code,409);
 res=response();await handler(req('POST',{action:'update',reference},{version:3,status:'completed',assignee:'A',dueDate:'2026-02-30'},true),res);assert.equal(res.code,400);
});
test('new orders and contact forms are saved once with private tracking and preserve existing mail routes',async()=>{
 for(const kind of ['order','ticket']){
  const db=store(),mail=[];const options={env,portalStore:db,notifier:async()=> 'not_requested',transportFactory:()=>({async sendMail(data){mail.push(data);return {accepted:[data.to]};},close(){}})};
  const handler=kind==='order'?makeOrdersHandler(options):makeContactHandler(options),submissionId=randomUUID();
  const data=kind==='order'?{product:'desarrollo-web--basico',name:'Cliente',countryCode:'+507',phone:'61234567',brief:'Quiero una web para mi marca.',coupon:'JEYCEE10',privacy:true,submissionId}:{topic:'soporte',name:'Cliente',email:'cliente@example.com',message:'Necesito ayuda con mi entrega.',privacy:true,submissionId};
  let first;
  for(let i=0;i<2;i++){const res=response();await handler(req('POST',{}, {...data,antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.equal(res.data.portal,true);assert.equal(res.data.tracking.key.length,43);const ref=res.data.number||res.data.reference;if(first)assert.equal(ref,first);first=ref;assert.ok(res.data.tracking.url.includes('#'));assert.ok(!res.data.tracking.url.split('#')[0].includes(res.data.tracking.key));}
  assert.equal(mail.length,1);assert.equal(mail[0].to,kind==='order'?'business@jeycee.shop':'support@jeycee.shop');assert.ok(mail[0].text.includes(first));assert.equal(db.captured.price,kind==='order'?261:null);assert.ok(!JSON.stringify(db.captured).includes('SEGUIMIENTO PRIVADO'));
 }
 const broken=store();broken.create=async()=>{throw Error('DB down');};let sent=false;const handler=makeOrdersHandler({env,portalStore:broken,transportFactory:()=>{sent=true;}}),res=response();await handler(req('POST',{}, {name:'Cliente',phone:'61234567',countryCode:'+507',product:'desarrollo-web--basico',brief:'Quiero una web corporativa.',privacy:true,submissionId:randomUUID(),antispam:await challenge(handler)}),res);assert.equal(res.code,503);assert.equal(sent,false);assert.notEqual(res.data.created,true);
});
test('a persisted order remains created when mail fails; portal notifications use branded HTML and the fixed reply area',async()=>{
 const db=store();let mailStatus;db.mailStatus=async(ref,status)=>{mailStatus=status;};
 const handler=makeOrdersHandler({env,portalStore:db,notifier:async()=> 'failed',transportFactory:()=>({async sendMail(){throw Error('SMTP unavailable');},close(){}})}),res=response();
 await handler(req('POST',{}, {name:'Cliente',email:'cliente@example.com',phone:'61234567',countryCode:'+507',product:'desarrollo-web--basico',brief:'Una web para mi negocio.',privacy:true,submissionId:randomUUID(),antispam:await challenge(handler)}),res);
 assert.equal(res.code,200);assert.equal(res.data.created,true);assert.ok(db.captured);assert.equal(mailStatus,'failed');
 let mail;const result=await notifyPortal(db.entry,'Respuesta <script>no ejecutar</script>',{env,trackingUrl:'https://jeycee-tech.vercel.app/seguimiento#pedido='+reference,transportFactory:()=>({async sendMail(data){mail=data;return {accepted:[data.to]};},close(){}})});
 assert.equal(result,'sent');assert.equal(mail.to,'private@example.com');assert.equal(mail.replyTo,'business@jeycee.shop');assert.ok(mail.html.includes('Tu proyecto.<br>Cada paso, más cerca.'));assert.ok(mail.html.includes('Ver seguimiento privado'));assert.ok(mail.html.includes('&lt;script&gt;'));assert.ok(!mail.html.includes('<script>'));assert.ok(mail.text.includes('Respuesta <script>'));assert.equal(mail.attachments[0].cid,'jeycee-contact-mark');
});
