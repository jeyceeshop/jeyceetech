import {createHash,timingSafeEqual} from 'node:crypto';
const equal=(a,b)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
export function matchesOrderContact(value,entry){
 if(typeof value!=='string'||value.trim().length<3||value.length>254)return false;
 const input=value.trim();
 if(entry.email&&equal(input.toLowerCase(),entry.email.trim().toLowerCase()))return true;
 if(entry.phone&&/^[+0-9 ()-]{6,32}$/.test(input))return equal(input.replace(/\D/g,''),entry.phone.replace(/\D/g,''));
 return false;
}
