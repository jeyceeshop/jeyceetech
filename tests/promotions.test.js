import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makePromotionsHandler,personalCouponQuote} from '../server/promotions.js';
import {makeOrdersHandler} from '../server/orders.js';
import {makeAdminHandler} from '../server/admin.js';
import {sessionValue} from '../server/admin-auth.js';
import {buildCouponEmail} from '../server/promotion-email.js';
const env={PORTAL_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-server-only',SMTP_USER:'hello@jeycee.shop',SMTP_PASS:'test-only',ADMIN_PASSWORD:'long-admin-test-password',ADMIN_SESSION_SECRET:'admin-session-test-value-with-32-characters',PUBLIC_SITE_URL:'https://jeycee.test'};
const headers={host:'jeycee.test',origin:'https://jeycee.test','content-type':'application/json'};
const req=(method='GET',body={},action='session',auth=false)=>({method,body,headers:{...headers,...(auth?{cookie:'jeycee_admin='+sessionValue(env)}:{})},query:{action}});
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
async function proof(handler){const res=response();await handler(req(),res);assert.equal(res.code,200);const c=res.data.challenge;return {token:c.token,answer:String(c.operation==='subtract'?c.a-c.b:c.a+c.b)};}
function fixture(){const rows=new Map();return {rows,async limit(){},async registerPromotion(data){const row=rows.get(data.email);if(row)return {send:false};const subscriber={id:randomUUID(),...data,marketing_opt_in:data.marketing,active:true};rows.set(data.email,subscriber);return {send:true,subscriber};},async promotionMailStatus(id,status){[...rows.values()].find(c=>c.id===id).mail_status=status;},async coupon(code,email){const c=rows.get(email);return c?.code===code&&c.active?c:null;},async subscribers(){return {subscribers:[...rows.values()],hasMore:false};},async toggleCoupon(id,active){[...rows.values()].find(c=>c.id===id).active=active;}};}
test('subscription sends a private, stable, random 1–15% coupon only to the registered mailbox',async()=>{
 const db=fixture(),mails=[];const handler=makePromotionsHandler({env,store:db,transportFactory:()=>({async sendMail(m){mails.push(m);return {accepted:[m.to]};},close(){}})});
 const data={action:'subscribe',email:' Persona@Example.com ',consent:true,marketing:false};
 let res=response();await handler(req('POST',{...data,antispam:await proof(handler)}),res);assert.equal(res.code,200);assert.equal(res.data.accepted,true);assert.equal(mails.length,1);
 const row=db.rows.get('persona@example.com');assert.match(row.code,/^JC-[A-F0-9]{12}$/);assert.ok(row.percent>=1&&row.percent<=15);assert.equal(row.marketing_opt_in,false);assert.equal(row.mail_status,'sent');assert.equal(mails[0].to,'persona@example.com');assert.ok(mails[0].html.includes(row.code));assert.ok(mails[0].text.includes(row.code));assert.ok(mails[0].html.includes('cid:jeycee-promotion-mark'));assert.ok(!JSON.stringify(res.data).includes(row.code));assert.ok(!JSON.stringify(res.data).includes('persona@example.com'));
 res=response();await handler(req('POST',{...data,antispam:await proof(handler)}),res);assert.equal(res.code,200);assert.equal(db.rows.size,1);assert.equal(mails.length,1);
 const bad=response();await handler(req('POST',{...data,consent:false,antispam:await proof(handler)}),bad);assert.equal(bad.code,400);assert.equal(mails.length,1);
 const foreign=response(),request=req('POST',data);request.headers.origin='https://evil.example';await handler(request,foreign);assert.equal(foreign.code,403);
 const noMath=response();await handler(req('POST',data),noMath);assert.equal(noMath.code,400);assert.equal(mails.length,1);
});
test('SMTP failure does not claim delivery and preserves the assigned coupon for a retry',async()=>{
 const db=fixture();const handler=makePromotionsHandler({env,store:db,transportFactory:()=>({async sendMail(){throw Error('PRIVATE_PASSWORD_AND_SMTP_DETAIL');},close(){}})}),res=response();
 await handler(req('POST',{action:'subscribe',email:'test@example.com',consent:true,antispam:await proof(handler)}),res);assert.equal(res.code,502);assert.equal(res.data.accepted,undefined);assert.equal(db.rows.get('test@example.com').mail_status,'failed');assert.ok(!res.data.error.includes('PRIVATE_PASSWORD'));
});
test('personal coupons are email-bound, cannot stack, and ignore prices or percentages supplied by the browser',async()=>{
 const db=fixture(),code='JC-AABBCCDDEEFF';db.rows.set('test@example.com',{code,percent:15,active:true});const p={basePrice:100,price:90,serviceSlug:'sample',id:'pro'};
 const offer=await personalCouponQuote(db,p,code,' Test@example.com ');assert.equal(offer.price,85);assert.equal(offer.discount,5);
 await assert.rejects(()=>personalCouponQuote(db,p,code,'other@example.com'),/no coincide/);await assert.rejects(()=>personalCouponQuote(db,p,'JEYCEE10','test@example.com'),/código personal/);assert.equal((await personalCouponQuote(null,p,'')).price,90);
 db.rows.get('test@example.com').percent=1;assert.equal((await personalCouponQuote(db,p,code,'test@example.com')).price,90);
 db.rows.get('test@example.com').active=false;await assert.rejects(()=>personalCouponQuote(db,p,code,'test@example.com'),/no coincide/);
});
test('checkout uses the stored coupon and emails the actual final total with its order reference',async()=>{
 const db=fixture(),code='JC-AABBCCDDEEFF',mail=[];db.rows.set('test@example.com',{code,percent:15,active:true});
 db.create=async record=>({entry:{...record,reference:'JC-00000001',created_at:new Date().toISOString()},inserted:true});db.mailStatus=async()=>{};
 const handler=makeOrdersHandler({env,portalStore:db,notifier:async()=> 'sent',transportFactory:()=>({async sendMail(m){mail.push(m);return {accepted:[m.to]};},close(){}})}),res=response();
 const body={product:'desarrollo-web--basico',name:'Cliente',email:'test@example.com',countryCode:'+507',phone:'61234567',brief:'Quiero crear una página para mi proyecto.',privacy:true,submissionId:randomUUID(),coupon:code,price:1,percent:99,antispam:await proof(handler)};
 await handler(req('POST',body),res);assert.equal(res.code,200);assert.equal(res.data.number,'JC-0001');assert.equal(res.data.price,246.5);assert.equal(mail[0].to,'business@jeycee.shop');assert.ok(mail[0].text.includes(code));assert.ok(mail[0].text.includes('$246.50'));assert.ok(new URL(res.data.whatsappUrl).searchParams.get('text').includes('$246.50'));
});
test('subscriber directory is private, and signed agent names and roles are required for public replies',async()=>{
 const db=fixture(),handler=makeAdminHandler({env,store:db});
 let res=response();await handler(req('GET',{},'subscribers'),res);assert.equal(res.code,401);
 res=response();await handler(req('GET',{},'subscribers',true),res);assert.equal(res.code,200);assert.deepEqual(res.data.subscribers,[]);
 const r=req('POST',{version:1,message:'Hola, revisamos tu solicitud.'},'reply',true);r.query.reference='JC-0001';res=response();await handler(r,res);assert.equal(res.code,400);assert.match(res.data.error,/nombre y cargo/);
 let captured;db.action=async(ref,version,action,payload)=>{captured=payload;return {reference:ref,name:'Cliente',status:'in_progress',email:'',version:2};};r.body.staffName='Ana Pérez';r.body.staffRole='Especialista de soporte';res=response();await handler(r,res);assert.equal(res.code,200);assert.equal(captured.staffName,'Ana Pérez');assert.equal(captured.staffRole,'Especialista de soporte');
});
test('coupon HTML escapes content, has a plain-text alternative and no remote tracking image',()=>{
 const mail=buildCouponEmail({email:'<unsafe>@example.com',code:'JC-<SCRIPT>',percent:12},'https://jeycee.test');assert.ok(mail.html.includes('&lt;unsafe&gt;'));assert.ok(!mail.html.includes('<SCRIPT>'));assert.ok(mail.text.includes('12%'));assert.equal(mail.attachments[0].cid,'jeycee-promotion-mark');assert.ok(!/<img[^>]+src="https?:/i.test(mail.html));
});
