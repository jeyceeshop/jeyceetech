import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export const portalEnabled=env=>env.PORTAL_ENABLED==='true';
export function portalConfigured(env){return portalEnabled(env)&&/^https:\/\/[^/]+\/?$/.test(env.SUPABASE_URL||'')&&!!env.SUPABASE_SERVICE_ROLE_KEY;}
export function trackingKey(env,reference,submission){return createHmac('sha256',env.SUPABASE_SERVICE_ROLE_KEY).update('jeycee-tracking-v1\0'+reference+'\0'+submission).digest('base64url');}
export const hashKey=key=>createHash('sha256').update(key).digest('hex');
export function keyMatches(key,hash){const actual=hashKey(key);return typeof hash==='string'&&hash.length===actual.length&&timingSafeEqual(Buffer.from(hash),Buffer.from(actual));}
export function trackingLink(env,reference,key){let base='https://jeycee-tech.vercel.app';try{const url=new URL(env.PUBLIC_SITE_URL);if(url.protocol==='https:'&&!url.username&&!url.password)base=url.origin;}catch{}return base+'/seguimiento#'+new URLSearchParams({pedido:reference,clave:key});}
export function newTrackingKey(){return randomBytes(32).toString('base64url');}
export function makePortalStore(env=process.env,fetcher=fetch){
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'};
 async function request(path,{method='GET',body,prefer}={}){
  const response=await fetcher(env.SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+path,{method,headers:{...headers,...(prefer?{Prefer:prefer}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
  if(!response.ok){const error=Error('El almacenamiento del portal no está disponible.');error.status=503;throw error;}
  if(response.status===204)return null;return response.json();
 }
 async function rpc(name,args){return request('rpc/'+name,{method:'POST',body:args});}
 return {
  async limit(scope,identity,max=10,seconds=600){const key=createHmac('sha256',env.SUPABASE_SERVICE_ROLE_KEY).update(scope+'\0'+identity).digest('hex');const allowed=await rpc('portal_allow_request',{p_key:key,p_limit:max,p_seconds:seconds});if(allowed!==true){const error=Error('Demasiados intentos. Espera unos minutos antes de reintentar.');error.status=429;error.retryAfter=seconds;throw error;}},
  async create(record){const result=await rpc('portal_create_entry',{p_entry:record});if(result?.conflict){const error=Error('La solicitud cambió. Recarga la página antes de volver a enviar.');error.status=409;throw error;}return result;},
  async find(reference){const rows=await request('portal_entries?reference=eq.'+encodeURIComponent(reference)+'&select=*&limit=1');return rows[0]||null;},
  async messages(reference,publicOnly=false){const rows=await request('portal_messages?entry_reference=eq.'+encodeURIComponent(reference)+(publicOnly?'&visibility=eq.public':'')+'&select=id,author,visibility,body,status,created_at&order=created_at.desc,id.desc&limit=200');return rows.reverse();},
  async list({kind='',status='',search='',page=0}={}){const params=new URLSearchParams({select:'reference,kind,name,email,phone,service,plan,status,price,coupon,assignee,due_date,created_at,updated_at,version,mail_status',order:'updated_at.desc',limit:'51',offset:String(page*50)});if(kind)params.set('kind','eq.'+kind);if(status)params.set('status','eq.'+status);if(search)params.set('or',`(reference.ilike.*${search}*,name.ilike.*${search}*,service.ilike.*${search}*)`);const rows=await request('portal_entries?'+params);return {entries:rows.slice(0,50),hasMore:rows.length>50};},
  async stats(){return rpc('portal_stats',{});},
  async action(reference,version,action,payload){const result=await rpc('portal_admin_action',{p_reference:reference,p_version:version,p_action:action,p_payload:payload});if(result?.conflict){const e=Error('Otro cambio actualizó este registro. Recarga el detalle y vuelve a intentarlo.');e.status=409;throw e;}return result;},
  async clientMessage(reference,body,id){return rpc('portal_client_message',{p_reference:reference,p_body:body,p_message_id:id});},
  async mailStatus(reference,status){return request('portal_entries?reference=eq.'+encodeURIComponent(reference),{method:'PATCH',body:{mail_status:status},prefer:'return=minimal'});}
 };
}
export function requestIp(req){return String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,100);}
const dateOnly=value=>value instanceof Date?value.toISOString().slice(0,10):value||null;
export function publicEntry(record){return {reference:record.reference,kind:record.kind,service:record.service,plan:record.plan,status:record.status,dueDate:dateOnly(record.due_date),createdAt:record.created_at,updatedAt:record.updated_at};}
export function adminEntry(record){const {tracking_hash,submission_key,submission_fingerprint,challenge_nonce,...safe}=record;return {...safe,due_date:dateOnly(record.due_date)};}
