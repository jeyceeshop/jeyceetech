import {products} from './premium.js';
import {orderSummary} from './pages.js';
import {briefMessage,whatsappUrl} from './whatsapp.js';
import {couponQuote,activeCoupons} from './coupons.js';
import {createOrderNumber,saveOrderNumber,recentOrderNumber} from './order-drafts.js';
import {priceLabel} from './pricing.js';
export function initBrief(){
 const form=document.querySelector('#checkout-form');if(!form)return;
 const select=form.elements.product,result=document.querySelector('#brief-result'),status=document.querySelector('#brief-status'),couponInput=form.elements.coupon,couponStatus=document.querySelector('#coupon-status');
 let currentOrder=null,lastFingerprint='';
 try{const number=recentOrderNumber(localStorage);if(number){const note=document.querySelector('#recent-order-number');note.textContent='Último pedido creado en este navegador: '+number+'. No confirma recepción ni pago por la agencia.';note.hidden=false;}}catch{}
 function getProduct(){return products.find(p=>p.key===select.value);}
 function update({announce=false}={}){
  const product=getProduct();let offer;
  try{offer=couponQuote(product,couponInput.value);couponInput.removeAttribute('aria-invalid');couponStatus.textContent=offer.code?offer.pending?'Cupón incluido para revisión en la propuesta Business.':offer.applied?'Cupón aplicado. Base estimada: '+priceLabel(offer.price,product.cadence)+'. Sujeto a confirmación por la agencia.':'Tu promoción actual ya ofrece un precio igual o mejor.':activeCoupons.some(c=>c.active)?'Si tienes un cupón, aplícalo antes de solicitar.':'Por ahora no hay cupones activos. Puedes continuar sin cupón.';}
  catch(error){couponInput.setAttribute('aria-invalid','true');couponStatus.textContent=error.message;document.querySelector('#order-summary').innerHTML=orderSummary(product);if(announce)couponInput.focus();return null;}
  document.querySelector('#order-summary').innerHTML=orderSummary(product,{coupon:offer});return offer;
 }
 select.addEventListener('change',()=>update());document.querySelector('#apply-coupon').addEventListener('click',()=>update({announce:true}));
 form.addEventListener('invalid',()=>{status.textContent='Completa los campos obligatorios y la pregunta antispam antes de solicitar tu pedido.';},true);
 form.addEventListener('input',()=>{status.textContent='';result.hidden=true;document.querySelector('#brief-whatsapp').removeAttribute('href');});
 couponInput.addEventListener('input',()=>{couponInput.removeAttribute('aria-invalid');couponStatus.textContent='Pulsa Aplicar cupón para validarlo.';document.querySelector('#order-summary').innerHTML=orderSummary(getProduct());});
 form.addEventListener('submit',event=>{event.preventDefault();try{
  const data=Object.fromEntries(new FormData(form)),product=getProduct(),offer=update({announce:true});if(!offer)return;
  // Validate the brief before assigning a number or retaining metadata.
  briefMessage(product,data,'por asignar',offer);
  const fingerprint=JSON.stringify([data.name,data.email,data.company,data.brief,product.key,offer.code,offer.price]);
  if(!currentOrder||fingerprint!==lastFingerprint){currentOrder={number:createOrderNumber(),productKey:product.key,createdAt:new Date().toISOString(),price:offer.price,coupon:offer.code};lastFingerprint=fingerprint;}
  let saved=false;try{saved=saveOrderNumber(currentOrder,localStorage);}catch{}
  const message=briefMessage(product,data,currentOrder.number,offer);
  const link=document.querySelector('#brief-whatsapp');link.href=whatsappUrl(message);document.querySelector('#brief-preview').textContent=message;document.querySelector('#brief-order-number').textContent=currentOrder.number;
  document.querySelector('#brief-order-storage').textContent=saved?'Número guardado en este navegador, sin datos personales. Pendiente de envío por WhatsApp.':'Tu navegador no permite guardar el número. Consérvalo antes de cerrar esta página; sigue pendiente de envío por WhatsApp.';
  result.hidden=false;status.textContent='Pedido creado: '+currentOrder.number+'. Revisa el mensaje y pulsa Enviar en WhatsApp para solicitarlo. Sin pago verificado.';
  link.click();result.focus({preventScroll:true});result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 }catch(error){status.textContent=error.message;}});
}
