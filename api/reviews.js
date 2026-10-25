import {issueChallenge,verifyChallenge,claimChallenge} from '../server/antispam.js';
// Vercel Node function. Credentials stay server-side; never use VITE_ prefixes.
const send=(res,status,data)=>res.status(status).json(data);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return send(res,503,{configured:false,error:'Las reseñas públicas aún no están habilitadas.'});
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(res,405,{error:'Método no permitido.'});}
 const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
 try{
  if(req.method==='GET'){
   const r=await fetch(`${base.replace(/\/$/,'')}/rest/v1/reviews?status=eq.approved&select=id,author,rating,text,created_at&order=created_at.desc&limit=50`,{headers,signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw Error('storage');return send(res,200,{configured:true,reviews:await r.json(),challenge:issueChallenge(key)});
  }
  if(!req.headers['content-type']?.includes('application/json'))return send(res,415,{error:'Se requiere JSON.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||body.consent!==true||body.website)return send(res,400,{error:'Solicitud no válida.'});
  const {author,text,rating}=body;
  if(typeof author!=='string'||author.trim().length<1||author.length>70||typeof text!=='string'||text.trim().length<10||text.length>1500||!Number.isInteger(rating)||rating<1||rating>5)return send(res,400,{error:'Revisa el nombre, el texto y la valoración.'});
  const proof=verifyChallenge(body.antispam,key);if(!proof||!claimChallenge(proof))return send(res,400,{error:'Verificación antispam incorrecta, caducada o ya utilizada. Solicita otra pregunta.'});
  const r=await fetch(`${base.replace(/\/$/,'')}/rest/v1/reviews`,{method:'POST',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({author:author.trim(),text:text.trim(),rating,status:'pending'}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('storage');return send(res,201,{status:'pending',message:'Reseña recibida. Se publicará después de moderación.'});
 }catch{return send(res,502,{error:'No pudimos procesar la reseña. Intenta más tarde.'});}
}
