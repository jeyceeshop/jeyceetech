const storageKey='jeycee-order-numbers-v1';
export function createOrderNumber(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Panama',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
 return `JC-${parts.year}${parts.month}${parts.day}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
}
export function saveOrderNumber(order,storage){
 try{
  const stored=JSON.parse(storage.getItem(storageKey)||'[]');
  const previous=Array.isArray(stored)?stored.filter(o=>o&&typeof o.number==='string'&&typeof o.productKey==='string'):[];
  // Deliberately retain only order metadata, never name, email, company or brief.
  const record={number:order.number,productKey:order.productKey,createdAt:order.createdAt,price:order.price,coupon:order.coupon||'',status:'pending-whatsapp'};
  storage.setItem(storageKey,JSON.stringify([record,...previous.filter(o=>o.number!==order.number)].slice(0,20)));return true;
 }catch{return false;}
}

export function recentOrderNumber(storage){try{const rows=JSON.parse(storage.getItem(storageKey)||'[]');if(!Array.isArray(rows))return null;const row=rows.find(r=>r&&typeof r.number==='string'&&/^JC-\d{8}-[A-F0-9]{8}$/.test(r.number));return row?.number||null;}catch{return null;}}
