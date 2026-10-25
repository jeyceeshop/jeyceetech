import {createHash} from 'node:crypto';
import nodemailer from 'nodemailer';
import {makePortalStore,requestIp,trackingLink} from './portal-store.js';
import {buildContactEmail} from './contact-email.js';
import {notifyPortal} from './portal-email.js';
import {displayReference} from '../src/portal-data.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function capturePortal({env,req,fields,reference,kind,submissionId,proof,product,offer,content=fields.message,config,transportFactory=nodemailer.createTransport,store,notifier=notifyPortal}){
 if(!uuid.test(submissionId||'')){const error=Error('Recarga el formulario para registrar tu solicitud con seguimiento.');error.status=400;throw error;}
 const db=store||makePortalStore(env);await db.limit('portal-intake',requestIp(req),10,600);
 const values={kind,name:fields.name,email:fields.email,phone:fields.phone||'',company:fields.company||'',service:product?.serviceName||(fields.service==='Por definir'?fields.topic.title:fields.service),product_key:product?.key||'',plan:product?.tierName||'',price:offer?.price??null,coupon:offer?.code||'',content,topic:fields.topic.id||'order',recipient:fields.topic.email,project_ref:kind==='order'?'':fields.projectRef||''};
 const fingerprint=createHash('sha256').update(JSON.stringify(values)).digest('hex');
 const record={...values,reference,tracking_hash:createHash('sha256').update('retired-column:'+submissionId).digest('hex'),submission_key:submissionId,submission_fingerprint:fingerprint,challenge_nonce:proof.nonce};
 let saved;try{saved=await db.create(record);}catch(error){
  // Keep existing installations accepting requests until their optional SQL upgrade.
  // These shorter references expose status only, never the previous conversation.
  if(!error.portalSchemaOutdated)throw error;
  saved=await db.create({...record,reference:reference.replace(/[A-F0-9]{24}$/,suffix=>suffix.slice(0,8)),tracking_hash:createHash('sha256').update('retired-column:'+submissionId).digest('hex')});
 }
 const {entry,inserted}=saved;
 const publicNumber=displayReference(entry.reference);
 const tracking={url:trackingLink(env,entry.reference)};
 if(inserted){
  const body=kind==='order'?fields.message.replace('Número de pedido: '+reference,'Número de pedido: '+publicNumber):fields.message;
  const mailFields={...fields,projectRef:kind==='order'?publicNumber:fields.projectRef,message:body+'\n\nSEGUIMIENTO\nNúmero: '+publicNumber+'\n'+tracking.url};
  async function primary(){let transport;try{if(!config)return 'failed';transport=transportFactory(config);const result=await transport.sendMail({from:{name:kind==='order'?'Jey Cee · Pedidos':'Jey Cee · Contacto',address:config.auth.user},to:fields.topic.email,...(fields.email?{replyTo:{name:fields.name,address:fields.email}}:{}),subject:`[${kind==='order'?'PEDIDO':'TICKET'}] [${publicNumber}] ${fields.service} — Jey Cee`,...buildContactEmail(mailFields,publicNumber,{kind:kind==='order'?'order':'contact'}),disableFileAccess:true,disableUrlAccess:true});return result.accepted?.some(a=>String(a).toLowerCase()===fields.topic.email.toLowerCase())?'sent':'failed';}catch{return 'failed';}finally{transport?.close?.();}}
  const [mailStatus]=await Promise.all([primary(),notifier(entry,`Tu solicitud ${publicNumber} fue registrada. El equipo revisará el alcance y los próximos pasos. Esto no confirma una contratación ni un pago.\n\nConsulta el seguimiento con tu número de solicitud:\n${tracking.url}`,{env,transportFactory,trackingUrl:tracking.url}).catch(()=> 'failed')]);
  try{await db.mailStatus(entry.reference,mailStatus);}catch{}
 }
 return {entry,tracking,inserted};
}
