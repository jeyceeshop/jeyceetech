import {createHash} from 'node:crypto';
import nodemailer from 'nodemailer';
import {makePortalStore,requestIp,trackingKey,trackingLink,hashKey,keyMatches} from './portal-store.js';
import {buildContactEmail} from './contact-email.js';
import {notifyPortal} from './portal-email.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function capturePortal({env,req,fields,reference,kind,submissionId,proof,product,offer,content=fields.message,config,transportFactory=nodemailer.createTransport,store,notifier=notifyPortal}){
 if(!uuid.test(submissionId||'')){const error=Error('Recarga el formulario para registrar tu solicitud con seguimiento.');error.status=400;throw error;}
 const db=store||makePortalStore(env);await db.limit('portal-intake',requestIp(req),10,600);
 const values={kind,name:fields.name,email:fields.email,phone:fields.phone||'',company:fields.company||'',service:product?.serviceName||(fields.service==='Por definir'?fields.topic.title:fields.service),product_key:product?.key||'',plan:product?.tierName||'',price:offer?.price??null,coupon:offer?.code||'',content,topic:fields.topic.id||'order',recipient:fields.topic.email,project_ref:kind==='order'?'':fields.projectRef||''};
 const fingerprint=createHash('sha256').update(JSON.stringify(values)).digest('hex');
 const candidate=trackingKey(env,reference,submissionId);
 const {entry,inserted}=await db.create({...values,reference,tracking_hash:hashKey(candidate),submission_key:submissionId,submission_fingerprint:fingerprint,challenge_nonce:proof.nonce});
 const key=trackingKey(env,entry.reference,submissionId),tracking=keyMatches(key,entry.tracking_hash)?{key,url:trackingLink(env,entry.reference,key)}:null;
 if(inserted){
  const mailFields={...fields,projectRef:kind==='order'?entry.reference:fields.projectRef,message:fields.message+(tracking?'\n\nSEGUIMIENTO PRIVADO\nNúmero: '+entry.reference+'\nClave: '+tracking.key+'\n'+tracking.url+'\nGuarda este enlace y compártelo únicamente con el cliente.':'')};
  async function primary(){let transport;try{if(!config)return 'failed';transport=transportFactory(config);const result=await transport.sendMail({from:{name:kind==='order'?'Jey Cee · Pedidos':'Jey Cee · Contacto',address:config.auth.user},to:fields.topic.email,...(fields.email?{replyTo:{name:fields.name,address:fields.email}}:{}),subject:`[${kind==='order'?'PEDIDO':'TICKET'}] [${entry.reference}] ${fields.service} — Jey Cee`,...buildContactEmail(mailFields,entry.reference,{kind:kind==='order'?'order':'contact'}),disableFileAccess:true,disableUrlAccess:true});return result.accepted?.some(a=>String(a).toLowerCase()===fields.topic.email.toLowerCase())?'sent':'failed';}catch{return 'failed';}finally{transport?.close?.();}}
  const [mailStatus]=await Promise.all([primary(),notifier(entry,`Tu solicitud ${entry.reference} fue registrada. El equipo revisará el alcance y los próximos pasos. Esto no confirma una contratación ni un pago.\n\n${tracking?'Tu clave privada es: '+tracking.key+'\nGuarda este enlace de seguimiento y no lo compartas:\n'+tracking.url:'Puedes consultar el seguimiento con el equipo.'}`,{env,transportFactory,trackingUrl:tracking?.url}).catch(()=> 'failed')]);
  try{await db.mailStatus(entry.reference,mailStatus);}catch{}
 }
 return {entry,tracking,inserted};
}
