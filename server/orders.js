import nodemailer from 'nodemailer';
import {smtpConfig,smtpConfigIssue} from './contact.js';
import {issueChallenge,verifyChallenge,claimChallenge} from './antispam.js';
import {premiumServices,tiersFor} from '../src/premium.js';
import {couponQuote} from '../src/coupons.js';
import {createOrderNumber} from '../src/order-drafts.js';
import {briefMessage,whatsappUrl} from '../src/whatsapp.js';
import {mailboxes} from '../src/email-routing.js';
import {buildContactEmail} from './contact-email.js';
import {orderPhone} from '../src/phone.js';
import {portalEnabled,portalConfigured} from './portal-store.js';
import {capturePortal} from './portal-intake.js';
export function makeOrdersHandler({env=process.env,transportFactory=nodemailer.createTransport,portalStore,notifier}={}){return async function handler(req,res){
 const send=(code,data)=>res.status(code).json(data);res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{error:'Método no permitido.'});}
 const portal=portalEnabled(env),config=smtpConfig(env);if(portal&&!portalConfigured(env))return send(503,{error:'El portal de pedidos está pendiente de configuración. Contacta por WhatsApp.'});if(!config&&!portal)return send(503,{code:smtpConfigIssue(env),error:'No podemos registrar el pedido por correo en este momento. Reintenta más tarde o contacta por WhatsApp.'});
 const secret='order-form:'+String(env.ANTISPAM_SECRET||env.SMTP_PASS||env.SUPABASE_SERVICE_ROLE_KEY);
 if(req.method==='GET')return send(200,{challenge:issueChallenge(secret)});
 if(!req.headers['content-type']?.includes('application/json'))return send(415,{error:'Formato de solicitud no válido.'});
 let data,product,offer;
 try{
  data=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!data||data.website||data.privacy!==true)throw Error('Revisa el consentimiento y la verificación antispam.');
  if(typeof data.product!=='string')throw Error('Selecciona un servicio y un plan.');
  const service=premiumServices.find(s=>data.product.startsWith(s.slug+'--'));
  product=service?tiersFor(service).find(p=>p.key===data.product):null;
  if(!product)throw Error('El servicio o plan no existe.');
  for(const key of ['name','brief','email','company','coupon','countryCode','phone'])if(data[key]!==undefined&&typeof data[key]!=='string')throw Error('Revisa los datos del pedido.');
  if(/[\r\n]/.test(data.name||''))throw Error('Revisa tu nombre.');
  offer=couponQuote(product,data.coupon);briefMessage(product,data,'por asignar',offer);
 }catch(error){return send(400,{error:error instanceof SyntaxError?'Solicitud no válida.':error.message});}
 const proof=verifyChallenge(data.antispam,secret);if(!proof||!claimChallenge(proof))return send(400,{error:'La verificación antispam es incorrecta o caducó. Responde la nueva pregunta.'});
 const number=createOrderNumber(),createdAt=new Date().toISOString();
 const message=briefMessage(product,data,number,offer);
 const fields={phone:orderPhone(data),name:data.name.trim(),email:(data.email||'').trim(),company:(data.company||'').trim(),service:product.name,projectRef:number,topic:{title:'Nuevo pedido',email:mailboxes.business},message};
 if(portal){try{
  const saved=await capturePortal({env,req,fields,reference:number,kind:'order',submissionId:data.submissionId,proof,product,offer,content:data.brief.trim(),config,transportFactory,store:portalStore,notifier});
  const e=saved.entry,orderMessage=briefMessage(product,data,e.reference,offer)+(saved.tracking?'\n\nSeguimiento privado: '+saved.tracking.url:'');
  return send(200,{created:true,portal:true,number:e.reference,productKey:e.product_key,createdAt:e.created_at,price:e.price,coupon:e.coupon,whatsappUrl:whatsappUrl(orderMessage),tracking:saved.tracking});
 }catch(error){if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));return send(error.status||503,{error:error.status&&error.status!==503?error.message:'No pudimos guardar tu pedido. Tus datos siguen en el formulario; reintenta en un momento.'});}}
 let transport;
 try{
  transport=transportFactory(config);
  const info=await transport.sendMail({from:{name:'Jey Cee · Pedidos',address:config.auth.user},to:mailboxes.business,...(fields.email?{replyTo:{name:fields.name,address:fields.email}}:{}),subject:`[PEDIDO] [${number}] ${product.name} — Jey Cee`,...buildContactEmail(fields,number,{kind:'order'}),disableFileAccess:true,disableUrlAccess:true});
  if(!info.accepted?.some(address=>String(address).toLowerCase()===mailboxes.business))return send(502,{error:'El correo del pedido no fue aceptado. Tus datos siguen en el formulario para reintentar.'});
  return send(200,{created:true,number,productKey:product.key,createdAt,price:offer.price,coupon:offer.code,whatsappUrl:whatsappUrl(message)});
 }catch{return send(502,{error:'No pudimos confirmar el correo del pedido. No cierres el formulario; reintenta más tarde o consulta por WhatsApp.'});}
 finally{transport?.close?.();}
};}
