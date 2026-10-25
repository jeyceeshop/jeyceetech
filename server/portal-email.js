import nodemailer from 'nodemailer';
import {smtpConfig} from './contact.js';
import {buildContactEmail} from './contact-email.js';
import {displayReference} from '../src/portal-data.js';
export async function notifyPortal(record,message,{env=process.env,transportFactory=nodemailer.createTransport,trackingUrl,staffName,staffRole}={}){
 if(!record.email)return 'not_requested';const config=smtpConfig(env);if(!config)return 'failed';let transport;
 try{
  const reference=displayReference(record.reference),content=buildContactEmail({trackingUrl,name:staffName||'Equipo de Jey Cee',email:record.recipient,company:staffRole||'',service:record.service+(record.plan?' · '+record.plan:''),projectRef:reference,topic:{title:'Seguimiento de tu solicitud',email:record.email},message},reference,{kind:'update'});
  transport=transportFactory(config);const result=await transport.sendMail({from:{name:'Jey Cee · Seguimiento',address:config.auth.user},to:record.email,replyTo:record.recipient,subject:`[${reference}] Actualización de tu solicitud — Jey Cee`,...content,disableFileAccess:true,disableUrlAccess:true});
  return result.accepted?.some(a=>String(a).toLowerCase()===record.email.toLowerCase())?'sent':'failed';
 }catch{return 'failed';}finally{transport?.close?.();}
}
