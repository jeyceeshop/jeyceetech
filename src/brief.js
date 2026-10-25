import {products} from './premium.js';
import {orderSummary} from './pages.js';
import {briefMessage,whatsappUrl} from './whatsapp.js';
import {couponQuote,activeCoupons} from './coupons.js';
import {createOrderNumber,saveOrderNumber,recentOrderNumber} from './order-drafts.js';
import {priceLabel} from './pricing.js';
export function initBrief(){
 const form=document.querySelector('#checkout-form');if(!form)return;
 const select=form.elements.product,status=document.querySelector('#brief-status'),couponInput=form.elements.coupon,couponStatus=document.querySelector('#coupon-status');
 const main=document.querySelector('main');
 const restored=history.state?.jeyceeOrderConfirmation;
 if(restored&&/^JC-\d{8}-[A-F0-9]{8}$/.test(restored.number||'')&&restored.source===location.search){
  const product=products.find(p=>p.key===restored.productKey);
  showOrderConfirmation(main,restored.number,whatsappUrl(`Hola, equipo de Jey Cee. Quiero seguir mi pedido ${restored.number}${product?' de '+product.name:''}. Fue creado en mi dispositivo y quisiera confirmar el envío de mi brief y los siguientes pasos. Todavía no implica confirmación de recepción o pago.`));return;
 }
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
 form.addEventListener('input',()=>{status.textContent='';});
 couponInput.addEventListener('input',()=>{couponInput.removeAttribute('aria-invalid');couponStatus.textContent='Pulsa Aplicar cupón para validarlo.';document.querySelector('#order-summary').innerHTML=orderSummary(getProduct());});
 form.addEventListener('submit',event=>{event.preventDefault();try{
  const data=Object.fromEntries(new FormData(form)),product=getProduct(),offer=update({announce:true});if(!offer)return;
  // Validate the brief before assigning a number or retaining metadata.
  briefMessage(product,data,'por asignar',offer);
  const fingerprint=JSON.stringify([data.name,data.email,data.company,data.brief,product.key,offer.code,offer.price]);
  if(!currentOrder||fingerprint!==lastFingerprint){currentOrder={number:createOrderNumber(),productKey:product.key,createdAt:new Date().toISOString(),price:offer.price,coupon:offer.code};lastFingerprint=fingerprint;}
  try{saveOrderNumber(currentOrder,localStorage);}catch{}
  const message=briefMessage(product,data,currentOrder.number,offer);
  try{history.replaceState({...history.state,jeyceeOrderConfirmation:{number:currentOrder.number,productKey:currentOrder.productKey,source:location.search}},'',location.href);}catch{}
  showOrderConfirmation(main,currentOrder.number,whatsappUrl(message));
 }catch(error){status.textContent=error.message;}});
}

export function showOrderConfirmation(main,number,url){
 const section=document.createElement('section');section.className='order-created-card';section.tabIndex=-1;section.setAttribute('aria-labelledby','order-created-title');section.setAttribute('aria-description','Pedido creado en este dispositivo. Pendiente de envío y confirmación por la agencia a través de WhatsApp.');
 const heading=document.createElement('h1');heading.id='order-created-title';heading.textContent='Pedido creado';
 const reference=document.createElement('p');reference.id='brief-order-number';reference.className='order-created-reference';reference.textContent=number;reference.setAttribute('aria-label','Número de pedido: '+number);
 const link=document.createElement('a');link.id='brief-whatsapp';link.className='button light';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Seguir pedido en WhatsApp';
 section.append(heading,reference,link);main.replaceChildren(section);main.className='inner-page section order-created-page';window.scrollTo({top:0,behavior:'instant'});section.focus({preventScroll:true});
}
