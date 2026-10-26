import {createHmac,randomUUID,scryptSync,timingSafeEqual} from 'node:crypto';
const cookieName='jeycee_admin',lifetime=8*60*60;
export function adminConfigurationIssues(env){
 const issues=[];
 if(typeof env.ADMIN_PASSWORD!=='string'||!env.ADMIN_PASSWORD.trim())issues.push({variable:'ADMIN_PASSWORD',code:'MISSING',message:'ADMIN_PASSWORD: falta la contraseña de acceso.'});
 else if(env.ADMIN_PASSWORD.length<12||env.ADMIN_PASSWORD.length>1024)issues.push({variable:'ADMIN_PASSWORD',code:'INVALID_LENGTH',message:'ADMIN_PASSWORD: debe tener entre 12 y 1024 caracteres.'});
 if(typeof env.ADMIN_SESSION_SECRET!=='string'||!env.ADMIN_SESSION_SECRET.trim())issues.push({variable:'ADMIN_SESSION_SECRET',code:'MISSING',message:'ADMIN_SESSION_SECRET: falta la clave interna de sesión.'});
 else if(env.ADMIN_SESSION_SECRET.length<32)issues.push({variable:'ADMIN_SESSION_SECRET',code:'INVALID_LENGTH',message:'ADMIN_SESSION_SECRET: debe tener al menos 32 caracteres.'});
 return issues;
}
export function adminConfigured(env){return adminConfigurationIssues(env).length===0;}
const sign=(value,env)=>createHmac('sha256',env.ADMIN_SESSION_SECRET).update('jeycee-admin-v1\0'+env.ADMIN_PASSWORD+'\0'+value).digest('base64url');
export function passwordMatches(password,env){if(typeof password!=='string'||password.length>1024)return false;const salt='jeycee-admin-password-v1';return timingSafeEqual(scryptSync(password,salt,32),scryptSync(env.ADMIN_PASSWORD,salt,32));}
export function sessionValue(env,now=Date.now()){const payload=Buffer.from(JSON.stringify({id:randomUUID(),issued:now,expires:now+lifetime*1000})).toString('base64url');return payload+'.'+sign(payload,env);}
export function isAdmin(req,env,now=Date.now()){
 if(!adminConfigured(env))return false;
 try{const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='));const value=cookie?.slice(cookieName.length+1);if(!value||value.length>1024)return false;const [payload,signature,...extra]=value.split('.'),expected=sign(payload,env);if(extra.length||signature?.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return false;const data=JSON.parse(Buffer.from(payload,'base64url').toString());return Number.isFinite(data.issued)&&data.issued<=now&&data.expires===data.issued+lifetime*1000&&now<data.expires;}catch{return false;}
}
export function sessionCookie(req,env,value=''){const secure=env.VERCEL||env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https';return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${value?lifetime:0}${secure?'; Secure':''}`;}
export function sameOrigin(req){try{return new URL(req.headers.origin).host===req.headers.host&&['https:','http:'].includes(new URL(req.headers.origin).protocol);}catch{return false;}}
export function readJson(req,maxBytes=16000){if(!req.headers['content-type']?.includes('application/json')){const e=Error('Se requiere JSON.');e.status=415;throw e;}const raw=req.body;if(Buffer.byteLength(typeof raw==='string'?raw:JSON.stringify(raw??''))>maxBytes){const e=Error('La solicitud es demasiado larga.');e.status=413;throw e;}let data;try{data=typeof raw==='string'?JSON.parse(raw):raw;}catch{}if(!data||typeof data!=='object'||Array.isArray(data)){const e=Error('Solicitud no válida.');e.status=400;throw e;}return data;}
export function privateHeaders(res){res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');}
