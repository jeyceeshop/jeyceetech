import {createHmac} from 'node:crypto';
import {displayReference} from '../src/portal-data.js';
export const portalEnabled=env=>typeof env.PORTAL_ENABLED==='string'&&env.PORTAL_ENABLED.trim().toLowerCase()==='true';
function databaseOrigin(env){try{const url=new URL(String(env.SUPABASE_URL||'').trim());return url.protocol==='https:'&&url.pathname==='/'&&!url.username&&!url.password&&!url.search&&!url.hash?url.origin:null;}catch{return null;}}
export function portalConfigurationIssues(env){
 const issues=[];
 if(!portalEnabled(env))issues.push({variable:'PORTAL_ENABLED',code:'NOT_ENABLED',message:'PORTAL_ENABLED: establece el valor true, sin comillas, para activar el portal.'});
 if(!String(env.SUPABASE_URL||'').trim())issues.push({variable:'SUPABASE_URL',code:'MISSING',message:'SUPABASE_URL: falta la Project URL de Supabase.'});
 else if(!databaseOrigin(env))issues.push({variable:'SUPABASE_URL',code:'INVALID_URL',message:'SUPABASE_URL: usa la Project URL HTTPS de Supabase, sin rutas de dashboard ni /rest/v1.'});
 if(typeof env.SUPABASE_SERVICE_ROLE_KEY!=='string'||!env.SUPABASE_SERVICE_ROLE_KEY.trim())issues.push({variable:'SUPABASE_SERVICE_ROLE_KEY',code:'MISSING',message:'SUPABASE_SERVICE_ROLE_KEY: falta la clave service_role de Supabase.'});
 return issues;
}
export function portalConfigured(env){return portalConfigurationIssues(env).length===0;}
export function trackingLink(env,reference){let base='https://jeycee-tech.vercel.app';for(const value of [env.PUBLIC_SITE_URL?.trim(),env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+env.VERCEL_PROJECT_PRODUCTION_URL.trim():null]){try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password){base=url.origin;break;}}catch{}}return base+'/seguimiento#'+new URLSearchParams({pedido:displayReference(reference)});}
export function makePortalStore(env=process.env,fetcher=fetch){
 const serviceKey=env.SUPABASE_SERVICE_ROLE_KEY.trim();
 const headers={apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'};
 async function request(path,{method='GET',body,prefer}={}){
  const response=await fetcher(databaseOrigin(env)+'/rest/v1/'+path,{method,headers:{...headers,...(prefer?{Prefer:prefer}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
  if(!response.ok){
   const error=Error('El almacenamiento del portal no está disponible.');error.status=503;
   if([401,403].includes(response.status)){error.portalCode='SUPABASE_ACCESS_REJECTED';error.portalMessage='Supabase rechazó el acceso. Revisa que SUPABASE_SERVICE_ROLE_KEY sea la clave service_role del mismo proyecto que SUPABASE_URL. Guarda en Production y haz Redeploy.';}
   try{const detail=await response.json();error.portalNumberingMissing=detail.code==='PGRST202'&&String(detail.message).includes('portal_create_numbered_entry');error.portalSchemaOutdated=(detail.code==='23514'&&String(detail.message).includes('portal_entries_reference_check'))||(detail.code==='23502'&&String(detail.message).includes('tracking_hash'));if(['PGRST202','PGRST205','42P01','42883'].includes(detail.code)){error.portalCode='PORTAL_DATABASE_SETUP_REQUIRED';error.portalMessage='Faltan tablas o funciones del portal en este proyecto de Supabase. Ejecuta el archivo completo database/portal.sql en su SQL Editor.';}}catch{}
   throw error;
  }
  if(response.status===204)return null;return response.json();
 }
 async function rpc(name,args){return request('rpc/'+name,{method:'POST',body:args});}
 return {
  async limit(scope,identity,max=10,seconds=600){const key=createHmac('sha256',env.SUPABASE_SERVICE_ROLE_KEY).update(scope+'\0'+identity).digest('hex');const allowed=await rpc('portal_allow_request',{p_key:key,p_limit:max,p_seconds:seconds});if(allowed!==true){const error=Error('Demasiados intentos. Espera unos minutos antes de reintentar.');error.status=429;error.retryAfter=seconds;throw error;}},
  async create(record){let result;try{result=await rpc('portal_create_numbered_entry',{p_entry:record});}catch(error){if(!error.portalNumberingMissing)throw error;result=await rpc('portal_create_entry',{p_entry:record});}if(result?.conflict){const error=Error('La solicitud cambió. Recarga la página antes de volver a enviar.');error.status=409;throw error;}return result;},
  async find(reference){const rows=await request('portal_entries?reference=eq.'+encodeURIComponent(reference)+'&select=*&limit=1');return rows[0]||null;},
  async messages(reference,publicOnly=false){const rows=await request('portal_messages?entry_reference=eq.'+encodeURIComponent(reference)+(publicOnly?'&visibility=eq.public':'')+'&select=*&order=created_at.desc,id.desc&limit=200');return rows.reverse();},
  async list({kind='',status='',search='',page=0}={}){const params=new URLSearchParams({select:'reference,kind,name,email,phone,service,plan,status,price,coupon,assignee,due_date,created_at,updated_at,version,mail_status',order:'updated_at.desc',limit:'51',offset:String(page*50)});if(kind)params.set('kind','eq.'+kind);if(status)params.set('status','eq.'+status);if(search)params.set('or',`(reference.ilike.*${search}*,name.ilike.*${search}*,service.ilike.*${search}*)`);const rows=await request('portal_entries?'+params);return {entries:rows.slice(0,50),hasMore:rows.length>50};},
  async stats(){return rpc('portal_stats',{});},
  async action(reference,version,action,payload){const result=await rpc('portal_admin_action',{p_reference:reference,p_version:version,p_action:action,p_payload:payload});if(result?.conflict){const e=Error('Otro cambio actualizó este registro. Recarga el detalle y vuelve a intentarlo.');e.status=409;throw e;}return result;},
  async clientMessage(reference,body,id){return rpc('portal_client_message',{p_reference:reference,p_body:body,p_message_id:id});},
  async mailStatus(reference,status){return request('portal_entries?reference=eq.'+encodeURIComponent(reference),{method:'PATCH',body:{mail_status:status},prefer:'return=minimal'});}
 };
}
export function requestIp(req){return String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,100);}
const dateOnly=value=>value instanceof Date?value.toISOString().slice(0,10):value||null;
export function publicEntry(record){return {reference:displayReference(record.reference),kind:record.kind,service:record.service,plan:record.plan,status:record.status,dueDate:dateOnly(record.due_date),createdAt:record.created_at,updatedAt:record.updated_at};}
export function adminEntry(record){const {tracking_hash,submission_key,submission_fingerprint,challenge_nonce,...safe}=record;return {...safe,reference:displayReference(record.reference),due_date:dateOnly(record.due_date)};}
