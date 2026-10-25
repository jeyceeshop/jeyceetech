// Los códigos personales se emiten y validan en el servidor, nunca en el navegador.
export const activeCoupons=[];
export const couponTerms='Cupón personal del 1% al 15%, asignado al azar una sola vez por correo y vinculado a esa dirección. Sobre el precio regular del servicio. No acumulable con otras promociones: conservamos el mejor precio. En planes mensuales aplica al primer periodo; en Business se calcula en la propuesta. No incluye asesoramiento, impuestos ni costos de terceros. Sin fecha de vencimiento programada; la agencia puede desactivar códigos por uso indebido. No acredita contratación ni pago.';
export function couponQuote(product,raw='',{rules=activeCoupons,now=new Date()}={}){
 const code=String(raw).trim().toUpperCase();
 if(!code)return {code:'',discount:0,price:product?.price??null,applied:false,pending:false};
 if(!product)throw Error('Selecciona primero un servicio y un plan.');
 if(!/^[A-Z0-9-]{2,32}$/.test(code))throw Error('Revisa el formato del cupón.');
 const rule=rules.find(r=>r.code===code&&r.active);
 if(!rule)throw Error('Este cupón no está disponible. Revisa el código o continúa sin cupón.');
 if(rule.expiresAt&&(!Number.isFinite(Date.parse(rule.expiresAt))||new Date(now).getTime()>=Date.parse(rule.expiresAt)))throw Error('Este cupón ha caducado.');
 if(rule.serviceSlugs?.length&&!rule.serviceSlugs.includes(product.serviceSlug)||rule.tiers?.length&&!rule.tiers.includes(product.id))throw Error('El cupón no aplica a este servicio o plan.');
 if(!Number.isFinite(rule.value)||rule.value<=0||!['percent','amount'].includes(rule.type)||rule.type==='percent'&&rule.value>100)throw Error('El cupón no está disponible. Consulta con la agencia.');
 if(product.price===null)return {code,discount:null,price:null,applied:false,pending:true};
 const base=rule.stackWithPromotion?product.price:product.basePrice;
 const reduction=rule.type==='percent'?base*rule.value/100:rule.value;
 const price=Math.round(Math.max(0,Math.min(product.price,base-reduction))*100)/100;
 return {code,discount:Math.round((product.price-price)*100)/100,price,applied:price<product.price,pending:false};
}
