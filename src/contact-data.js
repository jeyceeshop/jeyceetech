import {topicRecipient} from './email-routing.js';
import {services} from './catalog.js';
export const contactTopics=[
 {id:'cotizacion',title:'Cotización gratis',description:'Cuéntanos qué quieres crear.'},
 {id:'asesoramiento',title:'Asesoramiento · $20',description:'Orientación para definir tu proyecto.'},
 {id:'soporte',title:'Soporte de un proyecto',description:'Ayuda con una entrega o incidencia.'},
 {id:'facturacion',title:'Pedidos, pagos y facturación',description:'Consultas sobre tu propuesta o pago.'},
 {id:'marketing',title:'Marketing y campañas',description:'Coordinación de acciones y canales.'},
 {id:'vip',title:'Atención VIP',description:'Consultas y acompañamiento VIP.'},
 {id:'colaboraciones',title:'Colaboraciones',description:'Alianzas, creadores y propuestas conjuntas.'},
 {id:'empleo',title:'Talento y empleo',description:'Oportunidades y propuestas profesionales.'},
 {id:'gerencia',title:'Gerencia',description:'Asuntos de dirección o escalamiento.'},
 {id:'general',title:'Otra consulta',description:'Conversemos sobre tu idea.'}
].map(t=>({...t,email:topicRecipient(t.id)}));

export function validateContact(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('La solicitud no es válida.');
 if(data.privacy!==true&&data.privacy!=='on')throw Error('Debes aceptar la política de privacidad.');
 const topic=contactTopics.find(t=>t.id===data.topic);if(!topic)throw Error('Selecciona el motivo de tu consulta.');
 const field=(key,max,required=false)=>{if(data[key]!==undefined&&typeof data[key]!=='string')throw Error('Revisa los campos del formulario.');const value=(data[key]||'').trim();if(value.length>max||(required&&!value))throw Error('Revisa los campos obligatorios y su longitud.');return value;};
 const name=field('name',100,true),email=field('email',200,true),message=field('message',3000,true),company=field('company',150),projectRef=field('projectRef',100);
 if(/[\r\n]/.test(name)||!/^\S+@\S+\.\S+$/.test(email)||message.length<10)throw Error('Revisa tu nombre, el correo y el mensaje (mínimo 10 caracteres).');
 const service=services.find(s=>s.slug===data.service)?.name||'Por definir';
 return {topic,name,email,message,company,projectRef,service};
}
