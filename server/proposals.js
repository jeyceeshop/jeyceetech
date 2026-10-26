import {createHash} from 'node:crypto';
import {normalizeProposal,proposalText,quoteStatus} from '../src/proposals.js';
import {notifyPortal} from './portal-email.js';
import {trackingLink} from './portal-store.js';
export const quoteUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(message,status=400)=>{const error=Error(message);error.status=status;throw error;};
export function quoteIdentity(data){if(!quoteUuid.test(data.id||'')||!Number.isInteger(data.version)||data.version<0)fail('Recarga la propuesta antes de continuar.');}
export function quoteActor(data){if(typeof data.staffName!=='string'||data.staffName.trim().length<2||data.staffName.length>80||typeof data.staffRole!=='string'||data.staffRole.trim().length<2||data.staffRole.length>100||/[\r\n]/.test(data.staffName+data.staffRole))fail('Completa tu nombre y cargo en la firma de atención.');return {staffName:data.staffName.trim(),staffRole:data.staffRole.trim()};}
export function publicQuote(quote){return Object.fromEntries(['id','number','document','version','created_at','updated_at','sent_at','expires_at','accepted_at','accepted_by','decision_note','staff_name','staff_role'].map(key=>[key,quote[key]]).concat([['status',quoteStatus(quote)]]));}
export async function administerQuote(action,reference,data,{db,env,notifier=notifyPortal}){
 quoteIdentity(data);const actor=quoteActor(data);
 if(action==='quote-save'){const document=normalizeProposal(data.document),hash=createHash('sha256').update(JSON.stringify(document)).digest('hex');return {quote:await db.saveQuote(reference,{...data,...actor,document,hash})};}
 if(action==='quote-withdraw')return {quote:await db.withdrawQuote(reference,data)};
 if(action==='quote-send'||action==='quote-resend'){
  let quote;if(action==='quote-send'){const result=await db.sendQuote(reference,{...data,...actor});quote=result.quote;if(!result.firstSend)return {quote,notification:quote.mail_status};}
  else{quote=(await db.quotes(reference)).find(q=>q.id===data.id);if(!quote||quote.version!==data.version||quoteStatus(quote)!=='sent')fail('Solo puedes reenviar una propuesta vigente y pendiente.',409);}
  let notification='failed';try{notification=await notifier({reference,email:quote.client_email,recipient:'business@jeycee.shop',service:quote.document.title,plan:''},proposalText(quote.document,quote.number),{env,trackingUrl:trackingLink(env,reference),...actor,quoteDocument:quote.document,quoteNumber:quote.number,subject:`[${quote.number}] Propuesta para tu proyecto — Jey Cee`});}catch{}
  await db.quoteMail(quote.id,notification);return {quote:{...quote,mail_status:notification},notification};
 }
 fail('Acción no válida.');
}
