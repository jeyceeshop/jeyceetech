import {buildContactEmail} from './contact-email.js';
import nodemailer from 'nodemailer';
import {randomUUID} from 'node:crypto';
import {issueChallenge,verifyChallenge,claimChallenge} from './antispam.js';
import {validateContact} from '../src/contact-data.js';
export function smtpConfigIssue(env=process.env){
 const user=env.SMTP_USER?.trim();
 if(!user)return 'SMTP_USER_MISSING';
 if(!env.SMTP_PASS)return 'SMTP_PASS_MISSING';
 if(!/^\S+@\S+\.\S+$/.test(user))return 'SMTP_USER_INVALID';
 if(![465,587].includes(Number(env.SMTP_PORT||465)))return 'SMTP_PORT_INVALID';
 return null;
}
export function smtpConfig(env=process.env){
 const user=env.SMTP_USER?.trim(),pass=env.SMTP_PASS;if(!user||!pass)return null;
 const port=Number(env.SMTP_PORT||465);if(![465,587].includes(port)||!/^\S+@\S+\.\S+$/.test(user))return null;
 return {host:env.SMTP_HOST?.trim()||'mail.privateemail.com',port,secure:port===465,requireTLS:port===587,auth:{user,pass},tls:{rejectUnauthorized:true},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000};
}
export function makeContactHandler({env=process.env,transportFactory=nodemailer.createTransport}={}){return async function handler(req,res){
 const send=(code,data)=>res.status(code).json(data);res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{error:'Método no permitido.'});}
 const config=smtpConfig(env);if(!config)return send(503,{code:smtpConfigIssue(env),error:'El envío de correo aún no está disponible. Puedes escribir directamente al equipo desde los correos de contacto.'});
 const secret='contact-form:'+String(env.ANTISPAM_SECRET||env.SMTP_PASS);
 if(req.method==='GET')return send(200,{challenge:issueChallenge(secret)});
 if(!req.headers['content-type']?.includes('application/json'))return send(415,{error:'El formato de la solicitud no es válido.'});
 let body,fields;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!body||body.website)throw Error('La verificación antispam no es válida.');fields=validateContact(body);}catch(error){return send(400,{error:error instanceof SyntaxError?'La solicitud no es válida.':error.message});}
 const proof=verifyChallenge(body.antispam,secret);if(!proof||!claimChallenge(proof))return send(400,{error:'La respuesta antispam es incorrecta o ha caducado. Responde la nueva pregunta e inténtalo de nuevo.'});
 const reference='JC-'+randomUUID().slice(0,8).toUpperCase();
 const emailContent=buildContactEmail(fields,reference);
 let transport;
 try{
  transport=transportFactory(config);
  const info=await transport.sendMail({from:{name:'Jey Cee · Contacto',address:config.auth.user},to:fields.topic.email,replyTo:{name:fields.name,address:fields.email},subject:`[${fields.topic.id.toUpperCase()}] [${reference}] ${fields.topic.title} — Jey Cee`,...emailContent,disableFileAccess:true,disableUrlAccess:true});
  if(!Array.isArray(info.accepted)||!info.accepted.some(email=>String(email).toLowerCase()===fields.topic.email.toLowerCase()))return send(502,{error:'El servidor de correo no aceptó el destinatario. Intenta más tarde o escribe directamente al equipo.'});
  return send(200,{sent:true,reference});
 }catch{return send(502,{error:'No pudimos confirmar el envío del correo. Conservamos tus datos en el formulario; intenta más tarde o escribe directamente al equipo.'});}
 finally{transport?.close?.();}
};}
