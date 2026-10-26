import {publishedContent} from './content.js';
import {contentPatch,resolveContent} from '../src/content-schema.js';
import {administerQuote} from './proposals.js';
import {adminConfigurationIssues,passwordMatches,sessionValue,isAdmin,sessionCookie,sameOrigin,readJson,privateHeaders} from './admin-auth.js';
import {makePortalStore,portalConfigurationIssues,requestIp,adminEntry,trackingLink} from './portal-store.js';
import {notifyPortal} from './portal-email.js';
import {serviceStatuses,portalReferencePattern,storageReference} from '../src/portal-data.js';
export function makeAdminHandler({env=process.env,store,notifier=notifyPortal}={}){return async function(req,res){
 privateHeaders(res);const send=(status,body)=>res.status(status).json(body);const action=String(req.query?.action||'session');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{error:'Método no permitido.'});}
 if(req.method==='POST'&&!sameOrigin(req))return send(403,{error:'Origen de solicitud no permitido.'});
 const issues=[...portalConfigurationIssues(env),...adminConfigurationIssues(env)];
 if(issues.length)return send(503,{configured:false,code:'PORTAL_CONFIGURATION_REQUIRED',issues,error:'Falta completar la configuración:\n'+issues.map(issue=>'• '+issue.message).join('\n')+'\nCorrige estas variables en Vercel → Production y haz Redeploy.'});
 const db=store||makePortalStore(env);
 try{
  if(action==='session'&&req.method==='GET')return send(isAdmin(req,env)?200:401,{authenticated:isAdmin(req,env)});
  if(action==='login'&&req.method==='POST'){
   const data=readJson(req);await db.limit('admin-login',requestIp(req),5,900);await db.limit('admin-login-global','all',100,900);
   if(!passwordMatches(data.password,env))return send(401,{error:'Contraseña incorrecta.'});
   res.setHeader('Set-Cookie',sessionCookie(req,env,sessionValue(env)));return send(200,{authenticated:true});
  }
  if(!isAdmin(req,env))return send(401,{error:'La sesión expiró. Vuelve a iniciar sesión.'});
  if(action==='logout'&&req.method==='POST'){readJson(req);res.setHeader('Set-Cookie',sessionCookie(req,env));return send(200,{authenticated:false});}
  if(action==='list'&&req.method==='GET'){
   const kind=['order','ticket'].includes(req.query?.kind)?req.query.kind:'',status=serviceStatuses.some(s=>s.id===req.query?.status)?req.query.status:'';
   const rawSearch=String(req.query?.search||'').replace(/[^\p{L}\p{N} @._+-]/gu,'').slice(0,80),search=/^(?:JC-)?\d{4,8}$/i.test(rawSearch)?storageReference(rawSearch.toUpperCase()):rawSearch,page=Math.max(0,Math.min(10000,parseInt(req.query?.page,10)||0));
   const [list,stats]=await Promise.all([db.list({kind,status,search,page}),db.stats()]);return send(200,{...list,entries:list.entries.map(adminEntry),stats,page});
  }
  if(action==='content'&&req.method==='GET')return send(200,await publishedContent({env,store:db}));
  if(action==='content-save'&&req.method==='POST'){
   const data=readJson(req,550000);if(!Number.isInteger(data.version)||data.version<0)return send(400,{error:'Recarga el editor de contenido.'});
   const current=await publishedContent({env,store:db});if(current.setupRequired)return send(503,{error:'Activa las nuevas funciones ejecutando database/admin-proposals-content.sql en el SQL Editor de Supabase.'});
   if(current.version!==data.version)return send(409,{error:'El contenido cambió en otra sesión. Recarga el editor antes de publicar.'});
   const document=contentPatch(current.content,data.section,data.id,data.value);return send(200,resolveContent(await db.publishContent(data.version,document)));
  }
  const reference=storageReference(String(req.query?.reference||'').trim().toUpperCase());if(!portalReferencePattern.test(reference))return send(400,{error:'Referencia no válida.'});
  if(action==='detail'&&req.method==='GET'){const entry=await db.find(reference);if(!entry)return send(404,{error:'No encontramos esa solicitud.'});return send(200,{entry:adminEntry(entry),messages:await db.messages(reference)});}
  if(req.method==='GET'&&action==='quotes')return send(200,{quotes:await db.quotes(reference)});
  if(req.method==='POST'&&['quote-save','quote-send','quote-resend','quote-withdraw'].includes(action))return send(200,await administerQuote(action,reference,readJson(req,70000),{db,env,notifier}));
  if(req.method!=='POST'||!['update','reply','note'].includes(action))return send(405,{error:'Acción o método no permitido.'});
  const data=readJson(req);if(!Number.isInteger(data.version)||data.version<1)return send(400,{error:'Recarga el registro antes de modificarlo.'});
  let payload={};
  const message=typeof data.message==='string'?data.message.trim():'';
  if(message.length>3000)return send(400,{error:'El mensaje admite hasta 3000 caracteres.'});
  if(action==='update'){
   if(!serviceStatuses.some(s=>s.id===data.status)||typeof data.assignee!=='string'||data.assignee.length>100||typeof data.dueDate!=='string'||data.dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)||data.dueDate&&(!Number.isFinite(Date.parse(data.dueDate+'T00:00:00Z'))||new Date(data.dueDate+'T00:00:00Z').toISOString().slice(0,10)!==data.dueDate))return send(400,{error:'Revisa el estado, responsable y fecha objetivo.'});
   payload={status:data.status,assignee:data.assignee.trim(),dueDate:data.dueDate,message};
  }else{if(!message)return send(400,{error:'Escribe un mensaje.'});payload={message};}
  if(action!=='note'){
   if(typeof data.staffName!=='string'||data.staffName.trim().length<2||data.staffName.length>80||typeof data.staffRole!=='string'||data.staffRole.trim().length<2||data.staffRole.length>100||/[\r\n]/.test(data.staffName+data.staffRole))return send(400,{error:'Indica tu nombre y cargo para identificar la atención al cliente.'});
  }
  payload.staffName=typeof data.staffName==='string'?data.staffName.trim().slice(0,80):'';payload.staffRole=typeof data.staffRole==='string'?data.staffRole.trim().slice(0,100):'';
  const entry=await db.action(reference,data.version,action,payload);if(!entry)return send(404,{error:'No encontramos esa solicitud.'});
  let notification='not_requested';
  if(data.notify===true&&action!=='note'){
   const link=trackingLink(env,reference);
   const text=message||'Actualizamos el estado de tu solicitud a: '+serviceStatuses.find(s=>s.id===entry.status).label+'. Revisa el historial con tu número de solicitud: '+link;
   try{notification=await notifier(entry,text,{env,trackingUrl:link,staffName:payload.staffName,staffRole:payload.staffRole});}catch{notification='failed';}
  }
  return send(200,{entry:adminEntry(entry),notification});
 }catch(error){if(error.portalCode==='PORTAL_DATABASE_SETUP_REQUIRED'&&(action.startsWith('quote')||action.startsWith('content')))error.portalMessage='Activa las nuevas funciones ejecutando el archivo completo database/admin-proposals-content.sql en Supabase → SQL Editor.';if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));return send(error.status||503,{...(error.portalCode?{code:error.portalCode}:{}),error:error.portalMessage||(error.status&&error.status!==503?error.message:'No pudimos completar la operación. Revisa la configuración del portal e inténtalo de nuevo.')});}
};}
