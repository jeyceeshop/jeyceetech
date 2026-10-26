import {applyPromotion} from '../src/offers.js';
import {money} from '../src/pricing.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fixture,env} from './managed-fixture.js';
import {defaultContent} from '../src/content-defaults.js';
import {normalizeContent} from '../src/content-schema.js';
import {normalizeProposal,panamaDate} from '../src/proposals.js';
import {applyContent} from '../src/content.js';
import {makeAdminHandler} from '../server/admin.js';
import {makeTrackingHandler} from '../server/tracking.js';
import {makeOrdersHandler} from '../server/orders.js';
import {sessionValue} from '../server/admin-auth.js';
import {renderSite} from '../server/site-render.js';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
function req(method,query={},body={},auth=false){return {method,query,body,headers:{host:'jeycee.test',origin:'https://jeycee.test','content-type':'application/json',...(auth?{cookie:'jeycee_admin='+sessionValue(env)}:{})}};}
async function call(handler,method,query,body,auth=false){const res=response();await handler(req(method,query,body,auth),res);return res;}
async function proof(handler){const {data}=await call(handler,'GET');const c=data.challenge;return {token:c.token,answer:String(c.operation==='subtract'?c.a-c.b:c.a+c.b)};}
const actor={staffName:'Julian',staffRole:'Director creativo'};
const document=()=>({title:'Web para negocio',summary:'Propuesta personalizada',items:[{description:'Web corporativa de cinco páginas',quantity:1,unitPriceCents:25000},{description:'Adaptación de contenidos',quantity:2,unitPriceCents:1250}],taxBasisPoints:700,deliveryTime:'15 días hábiles tras recibir los contenidos',validUntil:panamaDate(new Date(Date.now()+86400000*5)),terms:'Anticipo acordado por Yappy. Dos rondas de revisión.'});
const data=()=>{const doc=normalizeProposal(document());return {id:randomUUID(),version:0,document:doc,hash:createHash('sha256').update(JSON.stringify(doc)).digest('hex'),...actor};};

test('content publishing validates all sections, handles concurrent editors and renders current SEO and prices without JavaScript',async()=>{
 const {pg,db}=await fixture();try{
  const handler=makeAdminHandler({env,store:db});assert.equal((await call(handler,'POST',{action:'content-save'},{},false)).code,401);
  const initial=(await call(handler,'GET',{action:'content'},null,true)).data;assert.equal(initial.version,0);const value=initial.content.services['desarrollo-web'];value.plans.basico.price=199;value.definition='Desarrollo web administrado desde el portal.';value.seoTitle='Desarrollo web profesional en Panamá | Jey Cee';
  let r=await call(handler,'POST',{action:'content-save'},{version:0,section:'service',id:'desarrollo-web',value},true);assert.equal(r.code,200);assert.equal(r.data.version,1);
  assert.equal((await call(handler,'POST',{action:'content-save'},{version:0,section:'home',value:initial.content.home},true)).code,409);
  value.name='<img src=x onerror=alert(1)>';assert.equal((await call(handler,'POST',{action:'content-save'},{version:1,section:'service',id:'desarrollo-web',value},true)).code,400);
  const current=(await call(handler,'GET',{action:'content'},null,true)).data;const template='<!doctype html><html><head><!--SEO_HEAD--></head><body id="top"><!--APP_BANNER--><nav><!--APP_NAV--></nav><main id="main-content"><!--APP_MAIN--></main><footer><!--APP_FOOTER--></footer></body></html>';const html=renderSite(template,'/servicios/desarrollo-web',current);assert.ok(html.includes('Desarrollo web administrado desde el portal.'));assert.ok(html.includes('<title data-seo>Desarrollo web profesional en Panamá | Jey Cee</title>'));assert.ok(html.includes(money(applyPromotion(199,'desarrollo-web').price)));assert.ok(html.includes('id="published-content"'));
  const jobs=current.content.vacancies.map(j=>({...j,active:false}));r=await call(handler,'POST',{action:'content-save'},{version:1,section:'vacancies',value:jobs},true);assert.equal(r.code,200);assert.ok(renderSite(template,'/trabaja-con-nosotros',r.data).includes('Por ahora no hay vacantes abiertas.'));
  assert.equal((await pg.query('select count(*)::int as count from public.site_content_history')).rows[0].count,2);
  await pg.exec('set role anon');await assert.rejects(pg.query('select * from public.site_content'));await assert.rejects(pg.query('select public.portal_publish_content(2,$1)',[JSON.stringify(current.content)]));await pg.exec('reset role');
 }finally{applyContent({version:0,content:defaultContent()});await pg.close();}
});

test('proposal SQL preserves snapshots, serializes publication and acceptance, rejects stale or expired decisions and protects privileged tables',async()=>{
 const {pg,db,entry}=await fixture();try{
  // Upgrade is safe to rerun on an existing database.
  await pg.exec(await readFile(new URL('../database/admin-proposals-content.sql',import.meta.url),'utf8'));
  const e=await entry(),a=data(),q=await db.saveQuote(e.reference,a);assert.equal(q.number,'COT-0001');assert.equal(q.document.totalCents,29425);
  assert.equal((await db.saveQuote(e.reference,a)).id,q.id);const second=await db.saveQuote(e.reference,data());
  const firstSent=await db.sendQuote(e.reference,{id:q.id,version:q.version,...actor});assert.equal(firstSent.firstSend,true);assert.equal((await db.sendQuote(e.reference,{id:q.id,version:q.version,...actor})).firstSend,false);
  const next=await db.sendQuote(e.reference,{id:second.id,version:second.version,...actor});assert.equal((await db.quotes(e.reference)).find(x=>x.id===q.id).status,'superseded');
  await assert.rejects(db.decideQuote(e.reference,{id:q.id,version:2,decision:'accept',name:'Cliente',note:''}),{status:409});
  const change=await db.decideQuote(e.reference,{id:second.id,version:next.quote.version,decision:'changes',name:'Cliente',note:'Añadir otra página'});assert.equal(change.status,'changes_requested');
  const third=await db.saveQuote(e.reference,data()),sent=await db.sendQuote(e.reference,{id:third.id,version:third.version,...actor});
  const decisions=await Promise.allSettled([db.decideQuote(e.reference,{id:third.id,version:sent.quote.version,decision:'accept',name:'Cliente',note:''}),db.withdrawQuote(e.reference,{id:third.id,version:sent.quote.version})]);assert.equal(decisions.filter(x=>x.status==='fulfilled').length,1);assert.equal(decisions[0].value.status,'accepted');
  assert.equal((await db.decideQuote(e.reference,{id:third.id,version:sent.quote.version,decision:'accept',name:'Cliente',note:''})).id,third.id);
  await assert.rejects(db.saveQuote(e.reference,data()),{status:409});await assert.rejects(db.withdrawQuote(e.reference,{id:third.id,version:3}),{status:409});assert.equal((await db.find(e.reference)).status,'confirmed');
  const e2=await entry(),expired=await db.saveQuote(e2.reference,data());await pg.query("update public.portal_quotes set expires_at=now()-interval '1 minute' where id=$1",[expired.id]);await assert.rejects(db.sendQuote(e2.reference,{id:expired.id,version:1,...actor}),{status:409});
  await pg.exec('set role anon');await assert.rejects(pg.query('select * from public.portal_quotes'));await assert.rejects(pg.query('select public.portal_decide_quote($1,$2,2,\'accept\',\'Cliente\',\'\')',[e.reference,third.id]));await pg.exec('reset role');
 }finally{await pg.close();}
});

test('quotes are private until contact verification; mail failure keeps a published quote and retries do not duplicate it; customers accept the exact published version',async()=>{
 const {pg,db,entry}=await fixture();try{
  const e=await entry();let sent=0;const admin=makeAdminHandler({env,store:db,notifier:async()=>{sent++;return sent===1?'failed':'sent';}}),tracking=makeTrackingHandler({env,store:db});const qdata={id:randomUUID(),version:0,document:document(),...actor};
  let r=await call(admin,'POST',{action:'quote-save',reference:e.reference},qdata,true);assert.equal(r.code,200);const q=r.data.quote;
  r=await call(admin,'POST',{action:'quote-send',reference:e.reference},{id:q.id,version:q.version,...actor},true);assert.equal(r.code,200);assert.equal(r.data.quote.status,'sent');assert.equal(r.data.notification,'failed');
  r=await call(admin,'POST',{action:'quote-send',reference:e.reference},{id:q.id,version:q.version,...actor},true);assert.equal(sent,1);
  r=await call(admin,'POST',{action:'quote-resend',reference:e.reference},{id:q.id,version:2,...actor},true);assert.equal(r.data.notification,'sent');assert.equal(sent,2);
  async function lookup(extra={}){return call(tracking,'POST',{}, {reference:e.reference,action:'lookup',...extra,antispam:await proof(tracking)});}
  r=await lookup();assert.deepEqual(r.data.quotes,[]);assert.ok(!JSON.stringify(r.data).includes('29425'));
  assert.equal((await lookup({contact:'wrong@example.test'})).code,403);r=await lookup({contact:e.email});assert.equal(r.data.quotes.length,1);assert.ok(!('client_email' in r.data.quotes[0]));
  let decision={reference:e.reference,action:'quote-decision',id:q.id,version:2,name:'Cliente de prueba',note:'',decision:'accept',consent:true};assert.equal((await call(tracking,'POST',{}, {...decision,antispam:await proof(tracking)})).code,403);
  assert.equal((await call(tracking,'POST',{}, {...decision,contact:e.email,consent:false,antispam:await proof(tracking)})).code,400);
  r=await call(tracking,'POST',{}, {...decision,contact:e.email,antispam:await proof(tracking)});assert.equal(r.code,200);assert.equal(r.data.quotes[0].status,'accepted');assert.equal(r.data.quotes[0].document.totalCents,29425);assert.ok(r.data.messages.some(m=>m.body.includes('aceptó la propuesta')));
  await pg.query("insert into public.portal_entries(reference,kind,name,email,phone,service,content,topic,recipient,submission_key,submission_fingerprint,challenge_nonce) values('JC-AAAAAAAAAAAAAAAAAAAAAAAA','order','Cliente','cliente@example.test','+507 61234567','Web','Privado','order','business@jeycee.shop',$1,$2,$3)",[randomUUID(),randomUUID(),randomUUID()]);
  const l=await db.saveQuote('JC-AAAAAAAAAAAAAAAAAAAAAAAA',data());await db.sendQuote('JC-AAAAAAAAAAAAAAAAAAAAAAAA',{id:l.id,version:1,...actor});r=await call(tracking,'POST',{}, {reference:'JC-AAAAAAAAAAAAAAAAAAAAAAAA',action:'lookup',antispam:await proof(tracking)});assert.deepEqual(r.data.quotes,[]);assert.equal(r.data.quoteContactRequired,true);
 }finally{await pg.close();}
});

test('new order totals use the published server catalog and stale browser versions cannot create orders',async()=>{
 const {pg,db}=await fixture();try{
  const content=normalizeContent(defaultContent());content.services['desarrollo-web'].plans.basico.price=180;await db.publishContent(0,content);let mail;
  const handler=makeOrdersHandler({env,portalStore:db,transportFactory:()=>({async sendMail(m){mail=m;return {accepted:[m.to]};},close(){}}),notifier:async()=> 'sent'}),body={product:'desarrollo-web--basico',name:'Cliente',brief:'Una web para el negocio con formulario y catálogo.',email:'cliente@example.test',company:'Empresa',countryCode:'+507',phone:'61234567',privacy:true,submissionId:randomUUID()};
  let r=await call(handler,'POST',{}, {...body,contentVersion:0,antispam:await proof(handler)});assert.equal(r.code,409);assert.equal(r.data.code,'CATALOG_CHANGED');
  r=await call(handler,'POST',{}, {...body,contentVersion:1,price:1,antispam:await proof(handler)});assert.equal(r.code,200);assert.equal(Number(r.data.price),applyPromotion(180,'desarrollo-web').price);assert.equal(mail.to,'business@jeycee.shop');const stored=await db.find('JC-00000001');assert.equal(Number(stored.price),applyPromotion(180,'desarrollo-web').price);
 }finally{applyContent({version:0,content:defaultContent()});await pg.close();}
});

test('public snapshots hide closed vacancies and API outage never falls back to stale prices',async()=>{
 const {makeContentHandler,publishedContent}=await import('../server/content.js');const {makePortalStore}=await import('../server/portal-store.js');
 const content=defaultContent();content.vacancies[0].active=false;content.vacancies[0].title='VACANTE AÚN NO PUBLICADA';const handler=makeContentHandler({env,store:{getContent:async()=>({version:1,document:content})}}),r=await call(handler,'GET');assert.equal(r.code,200);assert.ok(!JSON.stringify(r.data).includes('VACANTE AÚN NO PUBLICADA'));
 const missing=makePortalStore(env,async()=>new Response(JSON.stringify({code:'PGRST205',message:'Missing table'}),{status:404}));assert.equal((await publishedContent({env,store:missing})).setupRequired,true);
 const rejected=makePortalStore(env,async()=>new Response(JSON.stringify({code:'PGRST301',message:'PRIVATE_DETAILS'}),{status:401}));const failure=await call(makeContentHandler({env,store:rejected}),'GET');assert.equal(failure.code,503);assert.ok(!JSON.stringify(failure.data).includes('PRIVATE_DETAILS'));
});

test('proposal HTML mail escapes deliverables, shows precise totals and links the client to protected acceptance',async()=>{
 const {notifyPortal}=await import('../server/portal-email.js');let message;const doc=normalizeProposal({...document(),items:[{description:'Web <script>alert(1)</script> & marca',quantity:1,unitPriceCents:12345}]});
 const result=await notifyPortal({reference:'JC-00000001',email:'cliente@example.test',recipient:'business@jeycee.shop',service:'Web',plan:''},'Propuesta para revisar',{env,quoteDocument:doc,quoteNumber:'COT-0001',staffName:'Julian',staffRole:'Director',subject:'[COT-0001] Tu propuesta',trackingUrl:'https://www.jeycee.shop/seguimiento#pedido=JC-0001',transportFactory:()=>({async sendMail(value){message=value;return {accepted:[value.to]};},close(){}})});
 assert.equal(result,'sent');assert.equal(message.to,'cliente@example.test');assert.equal(message.replyTo,'business@jeycee.shop');assert.equal(message.subject,'[COT-0001] Tu propuesta');assert.ok(!message.html.includes('<script>'));assert.ok(message.html.includes('&lt;script&gt;'));assert.ok(message.html.includes('Total: $132.09 USD'));assert.ok(message.html.includes('Revisar y responder la propuesta'));assert.ok(message.text.includes('Propuesta para revisar'));assert.equal(message.attachments[0].cid,'jeycee-contact-mark');
});
