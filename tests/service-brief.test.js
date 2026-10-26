import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {premiumServices,products} from '../src/premium.js';
import {briefProfile,normalizeServiceDetails,projectBriefContent} from '../src/brief-schema.js';
import {briefMessage} from '../src/whatsapp.js';
import {makeOrdersHandler} from '../server/orders.js';
const web=products.find(p=>p.key==='desarrollo-web--basico');
const details={pages:'Inicio, servicios y contacto',features:['WhatsApp','Formulario de contacto'],references:'https://example.com'};
const data={name:'Cliente',email:'cliente@example.com',countryCode:'+507',phone:'61234567',brief:'Necesito una web para mi negocio.',privacy:true,product:web.key,briefVersion:1,serviceDetails:details};
const env={PORTAL_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-server-key',SMTP_USER:'hello@jeycee.shop',SMTP_PASS:'test-only-password'};
const request=body=>({method:'POST',headers:{'content-type':'application/json'},body});
const response=()=>({setHeader(){},status(code){this.code=code;return this;},json(body){this.data=body;return this;}});
async function proof(handler){const res=response();await handler({method:'GET'},res);const c=res.data.challenge;return {token:c.token,answer:String(c.operation==='subtract'?c.a-c.b:c.a+c.b)};}
test('all 21 services have a brief and specialized services ask relevant questions',()=>{
 assert.equal(premiumServices.length,21);for(const service of premiumServices)assert.ok(briefProfile(service.slug)?.fields.length>=3,service.slug);
 assert.ok(briefProfile(web).fields.some(f=>f.id==='pages'));assert.ok(briefProfile('diseno-grafico').fields.some(f=>f.id==='formats'));assert.ok(briefProfile('marketing-digital').fields.some(f=>f.id==='audience'));assert.ok(briefProfile('tiendas-online').fields.some(f=>f.id==='payments'));assert.ok(briefProfile('seo').fields.some(f=>f.id==='site'));assert.ok(briefProfile('automatizacion').fields.some(f=>f.id==='systems'));
});
test('service answers validate required fields, types, lengths and choices and never accept another service schema',()=>{
 const normalized=normalizeServiceDetails(web,details);assert.deepEqual(normalized.features,['Formulario de contacto','WhatsApp']);
 for(const value of [null,[],{...details,pages:''},{...details,pages:'x'.repeat(281)},{...details,features:[]},{...details,features:'WhatsApp'},{...details,features:['Opción inventada']},{...details,pages:{text:'Inicio'}},{...details,goals:['Aumentar ventas']}])assert.throws(()=>normalizeServiceDetails(web,value),/Revisa/);
 assert.throws(()=>normalizeServiceDetails('diseno-grafico',details),/Revisa/);
 assert.throws(()=>normalizeServiceDetails('seo',{site:'javascript:alert(1)',keywords:'Diseño'}),/Revisa/);
 assert.throws(()=>normalizeServiceDetails('seo',{site:'https://secret:password@example.com',keywords:'Diseño'}),/Revisa/);
 assert.deepEqual(normalizeServiceDetails(web,undefined,{required:false}),{});
});
test('legacy briefs keep working and versioned briefs include only validated current service answers',()=>{
 assert.equal(projectBriefContent(web,{brief:data.brief}),data.brief);
 assert.throws(()=>projectBriefContent(web,{brief:data.brief,briefVersion:1}),/Revisa/);
 assert.throws(()=>projectBriefContent(web,{...data,briefVersion:'1'}),/Actualiza/);
 const content=projectBriefContent(web,data);assert.ok(content.includes('DETALLES DEL SERVICIO'));assert.ok(content.includes('Páginas que necesitas: Inicio, servicios y contacto'));assert.ok(content.includes('Funciones que necesitas: Formulario de contacto, WhatsApp'));assert.ok(!content.includes('Estado de tus contenidos:'));
 const message=briefMessage(web,data,'JC-0001');assert.ok(message.includes(content));assert.ok(message.includes('JC-0001'));
});
test('new service-specific answers are persisted and included in the HTML mail and official WhatsApp message',async()=>{
 const mail=[];let captured;
 const store={async limit(){},async create(record){captured=record;return {entry:{...record,reference:'JC-00000001',created_at:new Date().toISOString()},inserted:true};},async mailStatus(){}};
 const handler=makeOrdersHandler({env,portalStore:store,notifier:async()=> 'sent',transportFactory:()=>({async sendMail(message){mail.push(message);return {accepted:[message.to]};},close(){}})}),res=response();
 await handler(request({...data,serviceDetails:{...details,references:'Referencia <img src=x onerror=alert(1)>'},submissionId:randomUUID(),antispam:await proof(handler)}),res);
 assert.equal(res.code,200);assert.equal(res.data.number,'JC-0001');assert.ok(captured.content.includes('Inicio, servicios y contacto'));assert.ok(captured.content.includes('Funciones que necesitas: Formulario de contacto, WhatsApp'));assert.equal(mail.length,1);assert.equal(mail[0].to,'business@jeycee.shop');assert.ok(mail[0].text.includes(captured.content));assert.ok(mail[0].html.includes('&lt;img'));assert.ok(!mail[0].html.includes('<img src=x'));
 const message=new URL(res.data.whatsappUrl).searchParams.get('text');assert.ok(message.includes(captured.content));assert.ok(message.includes('JC-0001'));
});
test('invalid or unrelated service answers cannot be saved or mailed',async()=>{
 let writes=0,sends=0;const handler=makeOrdersHandler({env,portalStore:{async create(){writes++;}},transportFactory:()=>{sends++;}});
 for(const change of [{serviceDetails:{}},{serviceDetails:{...details,features:['Descuento automático']}},{product:'diseno-grafico--basico'},{briefVersion:2}]){
  const res=response();await handler(request({...data,...change,submissionId:randomUUID(),antispam:await proof(handler)}),res);assert.equal(res.code,400);assert.notEqual(res.data.created,true);
 }
 assert.equal(writes,0);assert.equal(sends,0);
});
test('changing a service answer changes the persisted idempotency fingerprint',async()=>{
 const fingerprints=[];let saved;
 const store={async limit(){},async create(record){fingerprints.push(record.submission_fingerprint);if(saved&&saved.submission_fingerprint!==record.submission_fingerprint){const error=Error('La solicitud cambió.');error.status=409;throw error;}saved||={...record,reference:'JC-00000001',created_at:new Date().toISOString()};return {entry:saved,inserted:fingerprints.length===1};},async mailStatus(){}};
 const handler=makeOrdersHandler({env,portalStore:store,notifier:async()=> 'sent',transportFactory:()=>({async sendMail(message){return {accepted:[message.to]};},close(){}})}),submissionId=randomUUID();
 for(const [i,serviceDetails] of [details,{...details,pages:'Inicio, catálogo y contacto'}].entries()){
  const res=response();await handler(request({...data,serviceDetails,submissionId,antispam:await proof(handler)}),res);assert.equal(res.code,i===0?200:409);
 }
 assert.notEqual(fingerprints[0],fingerprints[1]);
});
