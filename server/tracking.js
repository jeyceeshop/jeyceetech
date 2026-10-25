import {makePortalStore,portalConfigured,requestIp,publicEntry} from './portal-store.js';
import {readJson,privateHeaders,sameOrigin} from './admin-auth.js';
import {issueChallenge,verifyChallenge,claimChallenge} from './antispam.js';
import {portalReferencePattern,referenceHasConversation,statusFor} from '../src/portal-data.js';
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
  const reference=typeof data.reference==='string'?data.reference.trim().toUpperCase():'';
  if(!portalReferencePattern.test(reference))return send(404,{error:'No encontramos la solicitud con ese número. Revisa tu referencia.'});
  const entry=await db.find(reference);
  if(!entry)return send(404,{error:'No encontramos la solicitud con ese número. Revisa tu referencia.'});
  const conversationAvailable=referenceHasConversation(reference);
  if(data.action==='message'){
   if(!conversationAvailable)return send(403,{error:'Esta referencia anterior permite consultar el estado. Para continuar la conversación, contacta al equipo con tu número.'});
   if(typeof data.message!=='string'||data.message.trim().length<2||data.message.length>3000||!uuid.test(data.messageId||''))return send(400,{error:'Escribe un mensaje de 2 a 3000 caracteres.'});
   await db.limit('tracking-message',reference,10,600);await db.clientMessage(reference,data.message.trim(),data.messageId);
  }else if(data.action!=='lookup')return send(400,{error:'Acción no válida.'});
  const updated=data.action==='message'?await db.find(reference):entry;
  const messages=conversationAvailable?(await db.messages(reference,true)).filter(m=>m.visibility==='public').map(({id,author,body,status,created_at})=>({id,author,body,status,created_at})):[{id:'current-status',author:'system',body:statusFor(entry.status).hint,status:entry.status,created_at:entry.updated_at||entry.created_at}];
  return send(200,{entry:publicEntry(updated),conversationAvailable,messages});
 }catch(error){if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));return send(error.status||503,{error:error.status&&error.status!==503?error.message:'No pudimos consultar el seguimiento. Inténtalo de nuevo más tarde.'});}
};}
