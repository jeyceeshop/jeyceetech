import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makeAdminHandler} from '../server/admin.js';
import {makeTrackingHandler} from '../server/tracking.js';
import {makeOrdersHandler} from '../server/orders.js';
import {makeContactHandler} from '../server/contact.js';
import {sessionValue,isAdmin} from '../server/admin-auth.js';
import {notifyPortal} from '../server/portal-email.js';
import {makePortalStore,trackingLink} from '../server/portal-store.js';
import {storageReference,displayReference} from '../src/portal-data.js';
const env={PORTAL_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-only-test-placeholder',ADMIN_PASSWORD:'test-long-password-only',ADMIN_SESSION_SECRET:'test-session-secret-with-more-than-32-characters',SMTP_USER:'hello@jeycee.shop',SMTP_PASS:'test-smtp-placeholder',VERCEL:'1'};
const headers={host:'jeycee.test',origin:'https://jeycee.test','content-type':'application/json','x-forwarded-proto':'https'};
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
function req(method='GET',query={},body={},auth=false){return {method,query,body,headers:{...headers,...(auth?{cookie:'jeycee_admin='+sessionValue(env)}:{})}};}
const reference='JC-20261025-A1B2C3D4A1B2C3D4A1B2C3D4';
test('configuration diagnostics identify the failing variable without exposing values or opening access',async()=>{
 const cases=[
  [{PORTAL_ENABLED:undefined},'PORTAL_ENABLED','NOT_ENABLED'],
  [{PORTAL_ENABLED:'"true"'},'PORTAL_ENABLED','NOT_ENABLED'],
  [{SUPABASE_URL:undefined},'SUPABASE_URL','MISSING'],
  [{SUPABASE_URL:'https://private:do-not-echo@example.supabase.co/rest/v1'},'SUPABASE_URL','INVALID_URL'],
  [{SUPABASE_SERVICE_ROLE_KEY:' \n'},'SUPABASE_SERVICE_ROLE_KEY','MISSING'],
  [{ADMIN_PASSWORD:undefined},'ADMIN_PASSWORD','MISSING'],
  [{ADMIN_PASSWORD:'private12'},'ADMIN_PASSWORD','INVALID_LENGTH'],
  [{ADMIN_SESSION_SECRET:undefined},'ADMIN_SESSION_SECRET','MISSING'],
  [{ADMIN_SESSION_SECRET:'internal-short-test'},'ADMIN_SESSION_SECRET','INVALID_LENGTH']
 ];
 for(const [change,variable,code] of cases){
  const configured={...env,...change},res=response();await makeAdminHandler({env:configured,store:new Proxy({},{get(){throw Error('Must not access storage');}})})(req(),res);
  assert.equal(res.code,503);assert.equal(res.data.code,'PORTAL_CONFIGURATION_REQUIRED');assert.deepEqual(res.data.issues.map(i=>[i.variable,i.code]),[[variable,code]]);assert.ok(res.data.error.includes(variable));assert.ok(!res.headers['Set-Cookie']);
  const raw=JSON.stringify(res.data);for(const secret of [configured.ADMIN_PASSWORD,configured.ADMIN_SESSION_SECRET,configured.SUPABASE_SERVICE_ROLE_KEY,configured.SUPABASE_URL].filter(s=>s&&s.trim().length>5))assert.ok(!raw.includes(secret));
 }
 const res=response();await makeAdminHandler({env:{...env,PORTAL_ENABLED:' TRUE \n',SUPABASE_URL:' https://example.supabase.co/ \n'}})(req(),res);assert.equal(res.code,401);assert.equal(res.data.authenticated,false);
});
test('Supabase connection tolerates copied outer whitespace without exposing the key',async()=>{
 let called;const db=makePortalStore({...env,SUPABASE_URL:' https://example.supabase.co/ \n',SUPABASE_SERVICE_ROLE_KEY:' test-key \n'},async(url,options)=>{called={url,options};return new Response(JSON.stringify({orders:0}),{status:200,headers:{'Content-Type':'application/json'}});});
 assert.deepEqual(await db.stats(),{orders:0});assert.equal(called.url,'https://example.supabase.co/rest/v1/rpc/portal_stats');assert.equal(called.options.headers.apikey,'test-key');assert.equal(called.options.headers.Authorization,'Bearer test-key');
});
test('admin reports rejected Supabase credentials and missing SQL without exposing database error details',async()=>{
 for(const [status,code,expected] of [[401,'PGRST301','SUPABASE_ACCESS_REJECTED'],[404,'PGRST202','PORTAL_DATABASE_SETUP_REQUIRED']]){
  const db=makePortalStore(env,async()=>new Response(JSON.stringify({code,message:'RAW_DATABASE_DETAIL_PRIVATE',details:'do-not-show'}),{status,headers:{'Content-Type':'application/json'}}));
  const res=response();await makeAdminHandler({env,store:db})(req('POST',{action:'login'},{password:env.ADMIN_PASSWORD}),res);assert.equal(res.code,503);assert.equal(res.data.code,expected);const raw=JSON.stringify(res.data);for(const secret of ['RAW_DATABASE_DETAIL_PRIVATE','do-not-show',env.SUPABASE_SERVICE_ROLE_KEY,env.ADMIN_PASSWORD])assert.ok(!raw.includes(secret));assert.ok(!res.headers['Set-Cookie']);
 }
 assert.ok(trackingLink({VERCEL_PROJECT_PRODUCTION_URL:'agency-example.vercel.app'},reference).startsWith('https://agency-example.vercel.app/seguimiento#'));
 assert.ok(trackingLink({PUBLIC_SITE_URL:'https://agency.example',VERCEL_PROJECT_PRODUCTION_URL:'agency-example.vercel.app'},reference).startsWith('https://agency.example/seguimiento#'));
});
function store(){
 let entry={reference,kind:'order',name:'Nombre privado',email:'private@example.com',phone:'+507 61234567',company:'Privada',service:'Desarrollo web',plan:'Básico',content:'Brief confidencial',recipient:'business@jeycee.shop',tracking_hash:'legacy-column-hidden',submission_key:randomUUID(),submission_fingerprint:'private fingerprint',challenge_nonce:'nonce',status:'received',version:1,created_at:new Date().toISOString()};
 const messages=[{id:'public',author:'staff',visibility:'public',body:'Respuesta pública',created_at:entry.created_at},{id:'private',author:'staff',visibility:'internal',body:'NOTA SECRETA',created_at:entry.created_at}];
 let created=null,sends=0;const db={entry,thread:messages,async limit(){},async find(ref){return ref===entry.reference?entry:null;},async messages(){return messages;},async list(){return {entries:[entry],hasMore:false};},async stats(){return {orders:1,tickets:0,active:1,waiting:0};},async action(ref,version,action,data){if(version!==entry.version){const e=Error('conflict');e.status=409;throw e;}entry.version++;if(action==='update')entry.status=data.status;if(['reply','note'].includes(action))messages.push({id:randomUUID(),author:'staff',visibility:action==='note'?'internal':'public',body:data.message,created_at:new Date().toISOString()});return {...entry};},async clientMessage(ref,body){messages.push({id:randomUUID(),author:'client',visibility:'public',body});},async create(data){if(created)return {entry:created,inserted:false};created={...data,created_at:new Date().toISOString()};return {entry:created,inserted:true};},async mailStatus(){},get captured(){return created;}};return db;
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
test('tracking uses only the number and signed antispam; internal notes and contact details remain private',async()=>{
 const db=store(),handler=makeTrackingHandler({env,store:db});
 for(const invalid of ['', 'JEYCEE10','JC-FFFFFFFF']){const res=response();await handler(req('POST',{}, {action:'lookup',reference:invalid,antispam:await challenge(handler)}),res);assert.equal(res.code,404);}
 const proof=await challenge(handler);let res=response();await handler(req('POST',{}, {action:'lookup',reference,antispam:proof}),res);assert.equal(res.code,200);assert.equal(res.data.conversationAvailable,true);assert.equal(res.data.messages.length,1);const serialized=JSON.stringify(res.data);for(const hidden of ['Nombre privado','private@example.com','61234567','Brief confidencial','NOTA SECRETA','legacy-column-hidden'])assert.ok(!serialized.includes(hidden));
 res=response();await handler(req('POST',{}, {action:'lookup',reference,antispam:proof}),res);assert.equal(res.code,400);
 res=response();await handler(req('POST',{}, {action:'message',reference,message:'Mi consulta',messageId:randomUUID(),antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.ok(res.data.messages.some(m=>m.body==='Mi consulta'));
 res=response();await handler(req('POST',{}, {action:'lookup',reference}),res);assert.equal(res.code,400);
});
test('short sequential references require the existing contact before reading or writing the conversation',async()=>{
 assert.equal(storageReference('JC-0001'),'JC-00000001');assert.equal(storageReference('0001'),'JC-00000001');assert.equal(displayReference('JC-00000001'),'JC-0001');assert.equal(displayReference('JC-00010000'),'JC-10000');assert.equal(storageReference(reference),reference);
 const db=store();db.entry.reference='JC-00000001';const handler=makeTrackingHandler({env,store:db});
 let res=response();await handler(req('POST',{}, {action:'lookup',reference:'JC-0001',antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.equal(res.data.entry.reference,'JC-0001');assert.equal(res.data.contactRequired,true);assert.equal(res.data.conversationAvailable,false);assert.ok(!JSON.stringify(res.data).includes('Respuesta pública'));
 res=response();await handler(req('POST',{}, {action:'lookup',reference:'JC-0001',contact:'someone@example.com',antispam:await challenge(handler)}),res);assert.equal(res.code,403);assert.ok(!JSON.stringify(res.data).includes('private@example.com'));
 for(const contact of ['PRIVATE@EXAMPLE.COM','+507 (6123)-4567']){res=response();await handler(req('POST',{}, {action:'lookup',reference:'JC-0001',contact,antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.equal(res.data.conversationAvailable,true);assert.equal(res.data.contactRequired,false);assert.ok(res.data.messages.some(m=>m.body==='Respuesta pública'));assert.ok(!JSON.stringify(res.data).includes('NOTA SECRETA'));}
 res=response();await handler(req('POST',{}, {action:'message',reference:'JC-0001',message:'Intento sin contacto',messageId:randomUUID(),antispam:await challenge(handler)}),res);assert.equal(res.code,403);
 res=response();await handler(req('POST',{}, {action:'message',reference:'JC-0001',contact:'+507 61234567',message:'Mensaje confirmado',messageId:randomUUID(),antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.ok(res.data.messages.some(m=>m.body==='Mensaje confirmado'));
 const admin=response();await makeAdminHandler({env,store:db})(req('GET',{action:'detail',reference:'JC-0001'},{},true),admin);assert.equal(admin.code,200);assert.equal(admin.data.entry.reference,'JC-0001');
});
test('numbered RPC is preferred, and only an absent numbering function falls back to the existing intake',async()=>{
 for(const missing of [false,true]){const calls=[];const db=makePortalStore(env,async(url)=>{calls.push(url);if(missing&&url.endsWith('portal_create_numbered_entry'))return new Response(JSON.stringify({code:'PGRST202',message:'Could not find the function public.portal_create_numbered_entry(p_entry)'}),{status:404});return new Response(JSON.stringify({entry:{reference:'JC-00000001'},inserted:true}),{status:200});});assert.equal((await db.create({})).entry.reference,'JC-00000001');assert.equal(calls.length,missing?2:1);assert.ok(calls[0].endsWith('portal_create_numbered_entry'));if(missing)assert.ok(calls[1].endsWith('portal_create_entry'));}
});
test('sequential number is consistent across API response, email, WhatsApp and tracking links after an idempotent retry',async()=>{
 const db=store(),mail=[];let saved;db.create=async record=>{if(saved)return {entry:saved,inserted:false};saved={...record,reference:'JC-00000001',created_at:new Date().toISOString()};return {entry:saved,inserted:true};};
 const handler=makeOrdersHandler({env,portalStore:db,notifier:async()=> 'not_requested',transportFactory:()=>({async sendMail(data){mail.push(data);return {accepted:[data.to]};},close(){}})}),submissionId=randomUUID();
 for(let i=0;i<2;i++){const res=response();await handler(req('POST',{}, {name:'Cliente',phone:'61234567',countryCode:'+507',product:'desarrollo-web--basico',brief:'Web de prueba.',privacy:true,submissionId,antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.equal(res.data.number,'JC-0001');assert.ok(new URL(res.data.whatsappUrl).searchParams.get('text').includes('Número de pedido: JC-0001'));assert.equal(new URLSearchParams(new URL(res.data.tracking.url).hash.slice(1)).get('pedido'),'JC-0001');}
 assert.equal(mail.length,1);assert.ok(mail[0].subject.includes('[JC-0001]'));assert.ok(mail[0].html.includes('JC-0001'));assert.ok(!mail[0].text.includes('JC-00000001'));assert.ok(!/JC-\d{8}-[A-F0-9]{24}/.test(mail[0].text));
});
test('legacy references show status without publishing their former private conversations',async()=>{
 const db=store();db.entry.reference='JC-20261025-A1B2C3D4';const handler=makeTrackingHandler({env,store:db});let res=response();await handler(req('POST',{}, {action:'lookup',reference:db.entry.reference,antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.equal(res.data.conversationAvailable,false);assert.equal(res.data.entry.status,'received');assert.ok(!JSON.stringify(res.data).includes('Respuesta pública'));assert.ok(!JSON.stringify(res.data).includes('NOTA SECRETA'));
 res=response();await handler(req('POST',{}, {action:'message',reference:db.entry.reference,message:'Mensaje',messageId:randomUUID(),antispam:await challenge(handler)}),res);assert.equal(res.code,403);
 const admin=makeAdminHandler({env,store:db});res=response();await admin(req('GET',{action:'detail',reference:db.entry.reference},{},true),res);assert.equal(res.code,200);assert.equal(res.data.messages.length,2);
});
test('an existing schema keeps receiving orders with status-only references until its SQL upgrade',async()=>{
 const db=store(),create=db.create;let attempts=0;db.create=async record=>{attempts++;if(/[A-F0-9]{24}$/.test(record.reference)){const error=Error('Old schema');error.portalSchemaOutdated=true;throw error;}assert.match(record.tracking_hash,/^[a-f0-9]{64}$/);return create(record);};
 const handler=makeOrdersHandler({env,portalStore:db,notifier:async()=> 'not_requested',transportFactory:()=>({async sendMail(data){return {accepted:[data.to]};},close(){}})}),res=response();
 await handler(req('POST',{}, {name:'Cliente',phone:'61234567',countryCode:'+507',product:'desarrollo-web--basico',brief:'Una web para mi negocio.',privacy:true,submissionId:randomUUID(),antispam:await challenge(handler)}),res);
 assert.equal(res.code,200);assert.equal(res.data.created,true);assert.equal(attempts,2);assert.match(res.data.number,/^JC-\d{8}-[A-F0-9]{8}$/);assert.equal('key' in res.data.tracking,false);
});
test('admin replies and internal notes persist independently of SMTP; stale versions and invalid dates are rejected',async()=>{
 const db=store();let notified=0;const handler=makeAdminHandler({env,store:db,notifier:async()=>{notified++;throw Error('SMTP failure');}});
 let res=response();await handler(req('POST',{action:'note',reference},{version:1,message:'Nota privada',notify:true},true),res);assert.equal(res.code,200);assert.equal(notified,0);
 res=response();await handler(req('POST',{action:'reply',reference},{version:2,message:'Respuesta para cliente',notify:true,staffName:'Ana Pérez',staffRole:'Soporte'},true),res);assert.equal(res.code,200);assert.equal(res.data.notification,'failed');assert.equal(notified,1);assert.ok(db.thread.some(m=>m.body==='Respuesta para cliente'&&m.visibility==='public'));
 res=response();await handler(req('POST',{action:'update',reference},{version:1,status:'completed',assignee:'A',dueDate:'',staffName:'Ana Pérez',staffRole:'Soporte'},true),res);assert.equal(res.code,409);
 res=response();await handler(req('POST',{action:'update',reference},{version:3,status:'completed',assignee:'A',dueDate:'2026-02-30'},true),res);assert.equal(res.code,400);
});
test('new orders and contact forms are saved once with number-only tracking and preserve existing mail routes',async()=>{
 for(const kind of ['order','ticket']){
  const db=store(),mail=[];const options={env,portalStore:db,notifier:async()=> 'not_requested',transportFactory:()=>({async sendMail(data){mail.push(data);return {accepted:[data.to]};},close(){}})};
  const handler=kind==='order'?makeOrdersHandler(options):makeContactHandler(options),submissionId=randomUUID();
  const data=kind==='order'?{product:'desarrollo-web--basico',name:'Cliente',countryCode:'+507',phone:'61234567',brief:'Quiero una web para mi marca.',coupon:'',privacy:true,submissionId}:{topic:'soporte',name:'Cliente',email:'cliente@example.com',message:'Necesito ayuda con mi entrega.',privacy:true,submissionId};
  let first;
  for(let i=0;i<2;i++){const res=response();await handler(req('POST',{}, {...data,antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.equal(res.data.portal,true);assert.equal('key' in res.data.tracking,false);assert.match(res.data.number||res.data.reference,/^JC-\d{8}-[A-F0-9]{24}$/);const ref=res.data.number||res.data.reference;if(first)assert.equal(ref,first);first=ref;assert.ok(res.data.tracking.url.includes('#'));assert.ok(!res.data.tracking.url.includes('clave='));}
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
 assert.equal(result,'sent');assert.equal(mail.to,'private@example.com');assert.equal(mail.replyTo,'business@jeycee.shop');assert.ok(mail.html.includes('Tu proyecto.<br>Cada paso, más cerca.'));assert.ok(mail.html.includes('Ver seguimiento'));assert.ok(mail.html.includes('&lt;script&gt;'));assert.ok(!mail.html.includes('<script>'));assert.ok(mail.text.includes('Respuesta <script>'));assert.equal(mail.attachments[0].cid,'jeycee-contact-mark');
});

test('verified ticket conversations include the original question and the staff signature without exposing internal notes',async()=>{
 const db=store();db.entry.reference='JC-00000001';db.entry.kind='ticket';db.entry.content='Mi consulta inicial de soporte.';db.thread[0].staff_name='Ana Pérez';db.thread[0].staff_role='Soporte especializado';const handler=makeTrackingHandler({env,store:db});
 let res=response();await handler(req('POST',{}, {action:'lookup',reference:'JC-0001',antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.ok(!JSON.stringify(res.data).includes('Mi consulta inicial'));
 res=response();await handler(req('POST',{}, {action:'lookup',reference:'JC-0001',contact:'private@example.com',antispam:await challenge(handler)}),res);assert.equal(res.code,200);assert.ok(res.data.messages.some(m=>m.body==='Mi consulta inicial de soporte.'));assert.ok(res.data.messages.some(m=>m.staff_name==='Ana Pérez'&&m.staff_role==='Soporte especializado'));assert.ok(!JSON.stringify(res.data).includes('NOTA SECRETA'));
});
