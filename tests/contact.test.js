import test from 'node:test';
import assert from 'node:assert/strict';
import {validateContact,contactTopics} from '../src/contact-data.js';
const data={name:'Cliente',email:'cliente@example.com',message:'Quiero conocer el alcance de un proyecto.',privacy:true,service:'desarrollo-web'};
test('contact validation preserves departmental routing and rejects invalid fields',()=>{
 const expected={cotizacion:'business',asesoramiento:'business',marketing:'mercadeo',soporte:'support',facturacion:'orders',vip:'vip',colaboraciones:'collabs',empleo:'rrhh',gerencia:'gerencia',general:'hello'};
 assert.equal(contactTopics.length,10);for(const [topic,alias] of Object.entries(expected)){const value=validateContact({...data,topic,to:'attacker@example.com'});assert.equal(value.topic.email,alias+'@jeycee.shop');assert.equal(value.service,'Desarrollo web');}
 for(const change of [{privacy:false},{topic:''},{name:''},{email:'bad'},{message:'corto'},{name:'Cliente\r\nBcc: someone'},{message:'x'.repeat(3001)},{company:[]}])assert.throws(()=>validateContact({...data,topic:'cotizacion',...change}));
});
