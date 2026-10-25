// Campaña autorizada: se aplica al precio regular y conserva la mejor promoción.
export const brandCoupon={code:'JEYCEE10',type:'percent',value:10,active:true,stackWithPromotion:false};
export const activeCoupons=[brandCoupon];
export const couponSessionKey='jeycee-brand-coupon';
export const couponTerms='10% sobre el precio regular del servicio. No acumulable con otras promociones: conservamos el mejor precio. En planes mensuales, aplica al primer periodo; en Business, el importe se calcula en la propuesta. No incluye asesoramiento, impuestos ni costos de terceros.';
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
