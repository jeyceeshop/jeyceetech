import {publicQuote,quoteIdentity} from './proposals.js';
import {makePortalStore,portalConfigured,requestIp,publicEntry} from './portal-store.js';
import {readJson,privateHeaders,sameOrigin} from './admin-auth.js';
import {issueChallenge,verifyChallenge,claimChallenge} from './antispam.js';
import {portalReferencePattern,referenceHasConversation,referenceNeedsContact,storageReference,statusFor} from '../src/portal-data.js';
import {matchesOrderContact} from './contact-verification.js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function makeTrackingHandler({env=process.env,store}={}){return async function(req,res){
 privateHeaders(res);const send=(status,body)=>res.status(status).json(body);
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{error:'Método no permitido.'});}
 if(!portalConfigured(env))return send(503,{error:'El seguimiento está pendiente de activación. Puedes consultar tu servicio por el WhatsApp oficial +507 6091-3544.'});
 const secret='portal-tracking:'+env.SUPABASE_SERVICE_ROLE_KEY,db=store||makePortalStore(env);
 if(req.method==='GET')return send(200,{challenge:issueChallenge(secret)});
 if(!sameOrigin(req))return send(403,{error:'Origen no permitido.'});
 try{
  const data=readJson(req);await db.limit('tracking',requestIp(req),20,900);
  const proof=verifyChallenge(data.antispam,secret);if(data.website||!proof||!claimChallenge(proof))return send(400,{error:'Responde la pregunta antispam actual o solicita una nueva.'});
  const reference=storageReference(typeof data.reference==='string'?data.reference.trim().toUpperCase():'');
  if(!portalReferencePattern.test(reference))return send(404,{error:'No encontramos la solicitud con ese número. Revisa tu referencia.'});
  const entry=await db.find(reference);
  if(!entry)return send(404,{error:'No encontramos la solicitud con ese número. Revisa tu referencia.'});
  const needsContact=referenceNeedsContact(reference);
  if(data.contact!==undefined&&(typeof data.contact!=='string'||data.contact.length>254))return send(400,{error:'Revisa el correo o teléfono indicado.'});
  const suppliedContact=typeof data.contact==='string'&&!!data.contact.trim();let verifiedContact=false;
  if(suppliedContact){await db.limit('tracking-contact',reference+':'+requestIp(req),10,900);verifiedContact=matchesOrderContact(data.contact,entry);if(!verifiedContact)return send(403,{error:'El correo o teléfono no coincide con la solicitud. Revisa el dato e incluye el código de país si usas tu teléfono.'});}
  const conversationAvailable=referenceHasConversation(reference)&&(!needsContact||verifiedContact);
  if(data.action==='quote-decision'){
   if(!verifiedContact)return send(403,{error:'Confirma el correo o teléfono de tu solicitud para responder a la propuesta.'});
   quoteIdentity(data);if(!['accept','changes'].includes(data.decision)||typeof data.name!=='string'||data.name.trim().length<2||data.name.trim().length>100||/[\r\n]/.test(data.name)||typeof data.note!=='string'||data.note.length>1000||data.decision==='accept'&&data.consent!==true||data.decision==='changes'&&data.note.trim().length<2)return send(400,{error:'Indica tu nombre y confirma la aceptación, o explica los ajustes que necesitas.'});
   await db.limit('tracking-quote',reference,10,900);await db.decideQuote(reference,{...data,name:data.name.trim(),note:data.decision==='accept'?'':data.note.trim()});
  }else if(data.action==='message'){
   if(!conversationAvailable)return send(403,{error:needsContact?'Confirma el correo o teléfono de tu solicitud para abrir la conversación.':'Esta referencia anterior permite consultar el estado. Para continuar la conversación, contacta al equipo con tu número.'});
   if(typeof data.message!=='string'||data.message.trim().length<2||data.message.length>3000||!uuid.test(data.messageId||''))return send(400,{error:'Escribe un mensaje de 2 a 3000 caracteres.'});
   await db.limit('tracking-message',reference,10,600);await db.clientMessage(reference,data.message.trim(),data.messageId);
  }else if(data.action!=='lookup')return send(400,{error:'Acción no válida.'});
  const updated=['message','quote-decision'].includes(data.action)?await db.find(reference):entry;
  const messages=conversationAvailable?(await db.messages(reference,true)).filter(m=>m.visibility==='public').map(({id,author,body,status,created_at,staff_name,staff_role})=>({id,author,body,status,created_at,staff_name,staff_role})):[{id:'current-status',author:'system',body:statusFor(entry.status).hint,status:entry.status,created_at:entry.updated_at||entry.created_at}];
  // The original ticket text is part of its conversation only after contact verification.
  // Order briefs and legacy number-only views remain excluded.
  if(conversationAvailable&&verifiedContact&&entry.kind==='ticket')messages.unshift({id:'original-ticket',author:'client',body:entry.content,status:null,created_at:entry.created_at});
  const quotes=verifiedContact&&db.quotes?(await db.quotes(reference)).filter(q=>q.sent_at&&q.status!=='draft').map(publicQuote):[];
  return send(200,{quotes,quoteContactRequired:!verifiedContact&&!!(entry.email||entry.phone),entry:publicEntry(updated),conversationAvailable,contactRequired:needsContact&&!verifiedContact&&!!(entry.email||entry.phone),messages});
 }catch(error){if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));return send(error.status||503,{error:error.status&&error.status!==503?error.message:'No pudimos consultar el seguimiento. Inténtalo de nuevo más tarde.'});}
};}
