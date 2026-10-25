import nodemailer from 'nodemailer';
import {randomBytes,randomInt} from 'node:crypto';
import {makePortalStore,portalConfigured,requestIp,trackingLink} from './portal-store.js';
import {privateHeaders,readJson,sameOrigin} from './admin-auth.js';
import {issueChallenge,verifyChallenge,claimChallenge} from './antispam.js';
import {smtpConfig} from './contact.js';
import {couponQuote} from '../src/coupons.js';
import {premiumServices,tiersFor} from '../src/premium.js';
import {buildCouponEmail} from './promotion-email.js';
export const normalizeEmail=value=>typeof value==='string'?value.trim().toLowerCase():'';
export const validEmail=value=>value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)&&!/[\r\n]/.test(value);
export async function personalCouponQuote(db,product,code,email){
 const normalized=String(code||'').trim().toUpperCase();if(!normalized)return couponQuote(product);
 if(!/^JC-[A-F0-9]{12}$/.test(normalized)||!validEmail(normalizeEmail(email)))throw Error('Usa tu código personal y el correo al que lo enviamos.');
 const rule=await db.coupon(normalized,normalizeEmail(email));
 if(!rule?.active)throw Error('El cupón no coincide con este correo o no está activo.');
 return couponQuote(product,normalized,{rules:[{code:rule.code,type:'percent',value:rule.percent,active:true,stackWithPromotion:false}]});
}
export function makePromotionsHandler({env=process.env,store,transportFactory=nodemailer.createTransport}={}){return async(req,res)=>{
 privateHeaders(res);const send=(status,body)=>res.status(status).json(body);
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{error:'Método no permitido.'});}
 if(!portalConfigured(env))return send(503,{error:'La promoción por correo está pendiente de activación.'});
 const db=store||makePortalStore(env),secret='promotion-form:'+env.SUPABASE_SERVICE_ROLE_KEY;
 if(req.method==='GET')return send(200,{challenge:issueChallenge(secret)});
 if(!sameOrigin(req))return send(403,{error:'Origen no permitido.'});
 try{
  const data=readJson(req);await db.limit('promotions',requestIp(req),12,900);
  const email=normalizeEmail(data.email);if(!validEmail(email))return send(400,{error:'Introduce un correo electrónico válido.'});
  if(data.action==='quote'){
   const service=premiumServices.find(s=>typeof data.product==='string'&&data.product.startsWith(s.slug+'--'));
   const product=service&&tiersFor(service).find(p=>p.key===data.product);
   if(!product)return send(400,{error:'Selecciona un servicio y un plan.'});
   try{return send(200,{offer:await personalCouponQuote(db,product,data.coupon,email)});}catch(error){if(error.status)throw error;return send(400,{error:error.message});}
  }
  if(data.action!=='subscribe')return send(400,{error:'Acción no válida.'});
  if(data.consent!==true||data.website)return send(400,{error:'Acepta el envío del cupón y revisa la verificación antispam.'});
  const config=smtpConfig(env);if(!config)return send(503,{error:'No podemos enviar el cupón en este momento. Reintenta más tarde.'});
  const proof=verifyChallenge(data.antispam,secret);if(!proof||!claimChallenge(proof))return send(400,{error:'Revisa la pregunta antispam o solicita una nueva.'});
  await db.limit('promotion-email',email,3,3600);
  const result=await db.registerPromotion({email,code:'JC-'+randomBytes(6).toString('hex').toUpperCase(),percent:randomInt(1,16),marketing:data.marketing===true,nonce:proof.nonce});
  if(result.send){
   const contact=result.subscriber,origin=new URL(trackingLink(env,'JC-0001')).origin;let transport,sent=false;
   try{
    transport=transportFactory(config);const info=await transport.sendMail({from:{name:'Jey Cee · Tu próximo proyecto',address:config.auth.user},to:contact.email,replyTo:'business@jeycee.shop',subject:`Tu cupón personal del ${contact.percent}% — Jey Cee`,...buildCouponEmail(contact,origin),disableFileAccess:true,disableUrlAccess:true});
    sent=info.accepted?.some(address=>String(address).toLowerCase()===contact.email)===true;
   }catch{}finally{transport?.close?.();}
   await db.promotionMailStatus(contact.id,sent?'sent':'failed');
   if(!sent)return send(502,{error:'Guardamos tu registro, pero no pudimos confirmar el envío. Reintenta en 5 minutos; conservarás el mismo cupón.'});
  }
  // No email address, code, value or existence is disclosed by this public endpoint.
  return send(200,{accepted:true,message:'Revisa tu correo y la carpeta de spam. Si ya estabas registrado, conservas tu cupón; los reenvíos se permiten cada 5 minutos.'});
 }catch(error){if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));return send(error.status||503,{error:error.status&&error.status!==503?error.message:'La promoción no está disponible en este momento. Reintenta más tarde.'});}
};}
