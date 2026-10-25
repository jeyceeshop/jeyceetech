import test from 'node:test';
import assert from 'node:assert/strict';
import {buildContactRequest,contactTopics} from '../src/contact.js';
const data={name:'Cliente',email:'cliente@example.com',message:'Quiero conocer el alcance de un proyecto.',privacy:'on',service:'desarrollo-web'};
test('contact requests route by topic and keep draft references without claiming delivery',()=>{
 for(const topic of contactTopics){const request=buildContactRequest({...data,topic:topic.id},'JC-TEST1234');assert.equal(request.email,topic.email);const url=new URL(request.mailto);assert.equal(url.pathname,topic.email);assert.ok(url.searchParams.get('subject').includes('JC-TEST1234'));assert.equal(url.searchParams.get('body'),request.text);assert.ok(request.text.includes('BORRADOR, NO ENVIADO'));assert.ok(request.text.includes('Desarrollo web'));assert.ok(request.text.includes('no un ticket recibido'));}
 assert.equal(buildContactRequest({...data,topic:'soporte'},'JC-1').email,'hello@jeycee.shop');
 assert.equal(buildContactRequest({...data,topic:'cotizacion'},'JC-1').email,'ventas@jeycee.shop');
});
test('contact validation rejects missing consent and malformed requests',()=>{
 assert.throws(()=>buildContactRequest({...data,topic:'cotizacion',privacy:undefined},'JC-1'),/privacidad/);
 assert.throws(()=>buildContactRequest({...data,topic:'unknown'},'JC-1'),/motivo/);
 assert.throws(()=>buildContactRequest({...data,topic:'cotizacion',email:'not-email'},'JC-1'),/correo/);
 assert.throws(()=>buildContactRequest({...data,topic:'cotizacion',message:'corto'},'JC-1'),/10 caracteres/);
 const request=buildContactRequest({...data,topic:'asesoramiento',message:'<script>Datos de prueba & texto</script>'},'JC-1');assert.ok(request.text.includes('<script>'));assert.ok(request.mailto.includes('%3Cscript%3E'));assert.ok(request.text.includes('USD 20'));
});
