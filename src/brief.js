import {products} from './premium.js';
import {orderSummary} from './pages.js';
import {briefMessage,whatsappUrl} from './whatsapp.js';
export function initBrief(){
 const form=document.querySelector('#checkout-form');if(!form)return;
 const select=form.elements.product,advisory=form.elements.advisoryPaid,result=document.querySelector('#brief-result'),status=document.querySelector('#brief-status');
 function update(){document.querySelector('#order-summary').innerHTML=orderSummary(products.find(p=>p.key===select.value),{advisoryPaid:advisory.checked});}
 select.addEventListener('change',update);advisory.addEventListener('change',update);
 form.addEventListener('invalid',()=>{status.textContent='Completa los campos obligatorios y la pregunta antispam antes de solicitar tu cotización.';},true);
 form.addEventListener('input',()=>{status.textContent='';result.hidden=true;document.querySelector('#brief-whatsapp').removeAttribute('href');});
 form.addEventListener('submit',event=>{event.preventDefault();try{
  const data=Object.fromEntries(new FormData(form));data.advisoryPaid=advisory.checked;
  const message=briefMessage(products.find(p=>p.key===select.value),data,'JC-'+crypto.randomUUID().slice(0,8).toUpperCase());
  const link=document.querySelector('#brief-whatsapp');link.href=whatsappUrl(message);document.querySelector('#brief-preview').textContent=message;result.hidden=false;status.textContent='Tu brief está listo. Revisa el mensaje y pulsa Enviar en WhatsApp. Todavía no se ha enviado desde esta web.';
  // Synchronous user action opens WhatsApp; the visible link remains if a popup is blocked.
  link.click();result.focus({preventScroll:true});result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 }catch(error){status.textContent=error.message;}});
}
