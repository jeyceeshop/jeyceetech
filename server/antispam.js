import {createHmac,randomInt,randomBytes,timingSafeEqual} from 'node:crypto';
const lifetime=10*60*1000,used=new Map();
const sign=(payload,secret)=>createHmac('sha256',secret).update('jeycee-antispam-v1\0'+payload).digest('base64url');
export function issueChallenge(secret,now=Date.now()){
 const a=randomInt(3,10),b=randomInt(1,a+1),operation=randomInt(0,2)?'subtract':'add';
 const payload={a,b,operation,issued:now,expires:now+lifetime,nonce:randomBytes(16).toString('base64url')};const encoded=Buffer.from(JSON.stringify(payload)).toString('base64url');
 return {a,b,operation,question:`${a} ${operation==='subtract'?'−':'+'} ${b}`,token:encoded+'.'+sign(encoded,secret)};
}
export function verifyChallenge(value,secret,now=Date.now()){
 try{
  if(!value||typeof value.token!=='string'||value.token.length>2048||typeof value.answer!=='string'||!/^\d{1,2}$/.test(value.answer.trim()))return null;
  const parts=value.token.split('.');if(parts.length!==2)return null;const [encoded,signature]=parts,expected=sign(encoded,secret);if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;
  const p=JSON.parse(Buffer.from(encoded,'base64url').toString());if(!Number.isInteger(p.a)||p.a<3||p.a>9||!Number.isInteger(p.b)||p.b<1||p.b>p.a||!['add','subtract'].includes(p.operation)||!Number.isFinite(p.issued)||p.issued>now||p.expires!==p.issued+lifetime||now>=p.expires||typeof p.nonce!=='string'||!/^[A-Za-z0-9_-]{22}$/.test(p.nonce))return null;
  if(Number(value.answer.trim())!==(p.operation==='subtract'?p.a-p.b:p.a+p.b))return null;
  return {nonce:p.nonce,expires:p.expires};
 }catch{return null;}
}
export function claimChallenge(proof,now=Date.now()){
 for(const [nonce,expires] of used)if(expires<=now)used.delete(nonce);
 if(!proof||proof.expires<=now||used.has(proof.nonce)||used.size>=10000)return false;
 used.set(proof.nonce,proof.expires);return true;
}
