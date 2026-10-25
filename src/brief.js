import {orderReferencePattern} from './portal-data.js';
import {trackingReceipt} from './tracking-receipt.js';
import {installAntiSpam} from './antispam.js';
import {products} from './premium.js';
import {orderSummary} from './pages.js';
import {briefMessage,whatsappUrl} from './whatsapp.js';
import {couponQuote} from './coupons.js';
import {saveOrderNumber,recentOrderNumber} from './order-drafts.js';
import {priceLabel} from './pricing.js';
export function initBrief(){
 const form=document.querySelector('#checkout-form');if(!form)return;
 const select=form.elements.product,status=document.querySelector('#brief-status'),couponInput=form.elements.coupon,couponStatus=document.querySelector('#coupon-status');
 const main=document.querySelector('main');
 const restored=history.state?.jeyceeOrderConfirmation;
 if(restored&&orderReferencePattern.test(restored.number||'')&&restored.source===location.search){
  const product=products.find(p=>p.key===restored.productKey);
  showOrderConfirmation(main,restored.number,whatsappUrl(`Hola, equipo de Jey Cee. Quiero seguir mi pedido ${restored.number}${product?' de '+product.name:''}. Quisiera confirmar el estado y los siguientes pasos. Esta consulta no confirma una contratación ni un pago.`),{emailed:restored.emailed===true,portal:restored.portal===true});return;
 }
 let submissionId=crypto.randomUUID(),lastSubmission='';
 let busy=false;const submit=form.querySelector('[type=submit]');
 async function fetchChallenge(){const response=await fetch('/api/orders',{cache:'no-store',headers:{Accept:'application/json'}});let body;try{body=await response.json();}catch{throw Error('No pudimos conectar con el servicio de pedidos. Reintenta en un momento.');}if(!response.ok||!body.challenge?.token)throw Error(body.error||'No pudimos cargar la verificación.');return body.challenge;}
 const guard=installAntiSpam(form,{refresh:fetchChallenge,requireServer:true,onStateChange:state=>{submit.disabled=busy||state!=='ready';if(state==='ready'&&!busy)status.textContent='';}});
 guard.renew().then(ok=>{if(!ok)status.textContent='El servicio de pedidos no está disponible en este momento. Puedes reintentar la validación.';});
 try{const number=recentOrderNumber(localStorage);if(number){const note=document.querySelector('#recent-order-number');note.textContent='Último pedido creado en este navegador: '+number+'. No confirma recepción ni pago por la agencia.';note.hidden=false;}}catch{}
 function getProduct(){return products.find(p=>p.key===select.value);}
 let quoteVersion=0,submitting=false;
 async function update({announce=false}={}){
  const version=++quoteVersion,product=getProduct(),code=couponInput.value.trim().toUpperCase();let offer;
  try{
   if(code){
    if(!product)throw Error('Selecciona primero un servicio y un plan.');
    if(!form.elements.email.value.trim()||!form.elements.email.checkValidity())throw Error('Indica el correo al que enviamos tu cupón para aplicarlo.');
    couponStatus.textContent='Validando tu cupón…';
    const response=await fetch('/api/promotions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'quote',product:product.key,coupon:code,email:form.elements.email.value})});
    const data=await response.json();if(!response.ok)throw Error(data.error||'No pudimos validar el cupón.');offer=data.offer;
   }else offer=couponQuote(product);
   if(version!==quoteVersion)return null;
   couponInput.removeAttribute('aria-invalid');couponStatus.textContent=offer.code?offer.pending?'Cupón incluido para revisión en la propuesta Business.':offer.applied?'Cupón aplicado. Base estimada: '+priceLabel(offer.price,product.cadence)+(product.cadence==='month'?' (primer periodo)':'')+'. Sujeto a confirmación por la agencia.':'Tu promoción actual ya ofrece un precio igual o mejor.':'¿Tienes un código personal? Indica el mismo correo al que lo enviamos y pulsa Aplicar cupón.';
  }catch(error){if(version!==quoteVersion)return null;couponInput.setAttribute('aria-invalid','true');couponStatus.textContent=error.message;document.querySelector('#order-summary').innerHTML=orderSummary(product);if(announce)couponInput.focus();return null;}
  document.querySelector('#order-summary').innerHTML=orderSummary(product,{coupon:offer});return offer;
 }
 select.addEventListener('change',()=>{if(!submitting)update();});document.querySelector('#apply-coupon').addEventListener('click',()=>{if(!submitting)update({announce:true});});
 form.addEventListener('invalid',()=>{status.textContent='Completa los campos obligatorios y la pregunta antispam antes de solicitar tu pedido.';},true);
 form.addEventListener('input',()=>{status.textContent='';});
 for(const input of [couponInput,form.elements.email])input.addEventListener('input',()=>{quoteVersion++;couponInput.removeAttribute('aria-invalid');couponStatus.textContent='Pulsa Aplicar cupón para validarlo con tu correo.';document.querySelector('#order-summary').innerHTML=orderSummary(getProduct());});
 const savedCoupon=(new URLSearchParams(location.search).get('cupon')||'').trim().toUpperCase();
 if(/^JC-[A-F0-9]{12}$/.test(savedCoupon)){couponInput.value=savedCoupon;couponStatus.textContent='Tu código está listo. Indica el correo al que lo enviamos, elige el servicio y pulsa Aplicar cupón.';}
 form.addEventListener('submit',async event=>{event.preventDefault();if(busy||submitting)return;submitting=true;
  let data;try{data=Object.fromEntries(new FormData(form));const product=getProduct(),offer=await update({announce:true});if(!offer){submitting=false;return;}briefMessage(product,data,'por asignar',offer);}catch(error){status.textContent=error.message;submitting=false;return;}
  busy=true;submit.disabled=true;submit.textContent='Creando pedido…';status.textContent='Enviando tu pedido a Jey Cee…';
  try{
   const fingerprint=JSON.stringify([data.name,data.email,data.company,data.countryCode,data.phone,data.product,data.brief,data.coupon]);if(lastSubmission&&lastSubmission!==fingerprint)submissionId=crypto.randomUUID();lastSubmission=fingerprint;
   const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,submissionId,privacy:form.elements.privacy.checked,antispam:guard.payload()})});
   let order;try{order=await response.json();}catch{throw Error('No pudimos confirmar la creación del pedido. Tus datos siguen en el formulario.');}
   if(!response.ok||order.created!==true)throw Error(order.error||'No pudimos crear el pedido. Intenta más tarde.');
   if(!orderReferencePattern.test(order.number))throw Error('No pudimos confirmar el número del pedido. Consulta con la agencia antes de repetirlo.');
   const target=new URL(order.whatsappUrl);if(target.hostname!=='wa.me'||target.pathname!=='/50760913544')throw Error('No pudimos preparar el seguimiento por WhatsApp.');
   try{saveOrderNumber(order,localStorage);}catch{}
   try{history.replaceState({...history.state,jeyceeOrderConfirmation:{number:order.number,productKey:order.productKey,source:location.search,emailed:order.portal!==true,portal:order.portal===true}},'',location.href);}catch{}
   showOrderConfirmation(main,order.number,order.whatsappUrl,{emailed:order.portal!==true,portal:order.portal===true,tracking:order.tracking});
  }catch(error){status.textContent=error.message;await guard.renew();}
  finally{busy=false;submitting=false;submit.disabled=!guard.ready();submit.textContent='Solicitar por WhatsApp ↗';}
 });
}

export function showOrderConfirmation(main,number,url,{emailed=true,portal=false,tracking=null}={}){
 const section=document.createElement('section');section.className='order-created-card';section.tabIndex=-1;section.setAttribute('aria-labelledby','order-created-title');section.setAttribute('aria-description',portal?'Solicitud registrada en el portal de Jey Cee. Pendiente de confirmación y pago.':emailed?'Solicitud de pedido enviada a Jey Cee por correo. Pendiente de confirmación y pago.':'Pedido creado en este dispositivo. Pendiente de envío y confirmación por la agencia a través de WhatsApp.');
 const heading=document.createElement('h1');heading.id='order-created-title';heading.textContent='Pedido creado';
 const reference=document.createElement('p');reference.id='brief-order-number';reference.className='order-created-reference';reference.textContent=number;reference.setAttribute('aria-label','Número de pedido: '+number);
 const link=document.createElement('a');link.id='brief-whatsapp';link.className='button light';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Seguir pedido en WhatsApp';
 section.append(heading,reference,link);if(portal)section.append(trackingReceipt(number,tracking));main.replaceChildren(section);main.className='inner-page section order-created-page';window.scrollTo({top:0,behavior:'instant'});section.focus({preventScroll:true});
}
