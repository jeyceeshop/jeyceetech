import test from 'node:test';
import assert from 'node:assert/strict';
import {buildContactRequest,contactTopics} from '../src/contact.js';
const data={name:'Cliente',email:'cliente@example.com',message:'Quiero conocer el alcance de un proyecto.',privacy:'on',service:'desarrollo-web'};
test('contact requests route by topic and keep draft references without claiming delivery',()=>{
 for(const topic of contactTopics){const request=buildContactRequest({...data,topic:topic.id},'JC-TEST1234');assert.equal(request.email,topic.email);const url=new URL(request.mailto);assert.equal(url.pathname,topic.email);assert.ok(url.searchParams.get('subject').includes('JC-TEST1234'));assert.equal(url.searchParams.get('body'),request.text);assert.ok(request.text.includes('BORRADOR, NO ENVIADO'));assert.ok(request.text.includes('Desarrollo web'));assert.ok(request.text.includes('no un ticket recibido'));}
 assert.equal(buildContactRequest({...data,topic:'soporte'},'JC-1').email,'support@jeycee.shop');
 assert.equal(buildContactRequest({...data,topic:'cotizacion'},'JC-1').email,'business@jeycee.shop');
});
test('contact validation rejects missing consent and malformed requests',()=>{
 assert.throws(()=>buildContactRequest({...data,topic:'cotizacion',privacy:undefined},'JC-1'),/privacidad/);
 assert.throws(()=>buildContactRequest({...data,topic:'unknown'},'JC-1'),/motivo/);
 assert.throws(()=>buildContactRequest({...data,topic:'cotizacion',email:'not-email'},'JC-1'),/correo/);
 assert.throws(()=>buildContactRequest({...data,topic:'cotizacion',message:'corto'},'JC-1'),/10 caracteres/);
 const request=buildContactRequest({...data,topic:'asesoramiento',message:'<script>Datos de prueba & texto</script>'},'JC-1');assert.ok(request.text.includes('<script>'));assert.ok(request.mailto.includes('%3Cscript%3E'));assert.ok(request.text.includes('USD 20'));
});

test('public contact categories use the supplied departmental aliases',()=>{
 const expected={cotizacion:'business',asesoramiento:'business',marketing:'mercadeo',soporte:'support',facturacion:'orders',vip:'vip',colaboraciones:'collabs',empleo:'rrhh',gerencia:'gerencia',general:'hello'};
 assert.equal(contactTopics.length,Object.keys(expected).length);
 for(const [id,alias] of Object.entries(expected)){
  const result=buildContactRequest({...data,topic:id},'JC-ROUTE');assert.equal(result.email,alias+'@jeycee.shop');assert.ok(new URL(result.mailto).searchParams.get('subject').includes('['+id.toUpperCase()+']'));
 }
 assert.ok(!contactTopics.some(t=>/angeline|julian|ventas@/.test(t.email)));
});
