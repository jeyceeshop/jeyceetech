import {quoteCard} from './quote-ui.js';
import {installAntiSpam} from './antispam.js';
import {portalRequest,esc,badge,dateLabel,messageCards} from './portal-ui.js';
import {statusFor} from './portal-data.js';
export function initTracking(){
 const lookup=document.querySelector('#tracking-lookup');if(!lookup)return;
 const result=document.querySelector('#tracking-result'),reply=document.querySelector('#tracking-message'),verify=document.querySelector('#tracking-verify');
 let credentials=null,lastMessage='',messageId=crypto.randomUUID();
 const fragment=new URLSearchParams(location.hash.slice(1));lookup.elements.reference.value=fragment.get('pedido')||new URLSearchParams(location.search).get('pedido')||'';
 if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 async function challenge(){return (await portalRequest('/api/tracking')).challenge;}
 function guardFor(form,status){
  const button=form.querySelector('[type=submit]');let busy=false;
  const guard=installAntiSpam(form,{refresh:challenge,requireServer:true,onStateChange:state=>{button.disabled=busy||state!=='ready';}});
  return {guard,button,setBusy(value){busy=value;button.disabled=value||!guard.ready();},async renew(){if(!await guard.renew())status.textContent='El seguimiento no está disponible en este momento. Puedes consultar por WhatsApp o usar Contáctanos.';}};
 }
 const lookupStatus=document.querySelector('#tracking-lookup-status'),replyStatus=document.querySelector('#tracking-message-status'),verifyStatus=document.querySelector('#tracking-verify-status');
 const lookupGuard=guardFor(lookup,lookupStatus),replyGuard=guardFor(reply,replyStatus),verifyGuard=guardFor(verify,verifyStatus);lookupGuard.renew();
 function paint(data){
  reply.hidden=!data.conversationAvailable;verify.hidden=!(data.contactRequired||data.quoteContactRequired);document.querySelector('#tracking-legacy-help').hidden=data.conversationAvailable===true||data.contactRequired===true;
  document.querySelector('#tracking-summary').innerHTML=`<article class="panel tracking-summary"><span class="eyebrow">${data.entry.kind==='order'?'PEDIDO':'TICKET'} / ${esc(data.entry.reference)}</span>${badge(data.entry.status)}<h2>${esc(data.entry.service)}</h2>${data.entry.plan?'<p>'+esc(data.entry.plan)+'</p>':''}<p>${statusFor(data.entry.status).hint}</p><dl><div><dt>Recibido</dt><dd>${dateLabel(data.entry.createdAt)}</dd></div><div><dt>Última actualización</dt><dd>${dateLabel(data.entry.updatedAt)}</dd></div>${data.entry.dueDate?'<div><dt>Fecha objetivo acordada</dt><dd>'+dateLabel(data.entry.dueDate)+'</dd></div>':''}</dl></article>`;
  paintQuotes(data);
  const thread=document.querySelector('#tracking-messages');thread.innerHTML=messageCards(data.messages);thread.scrollTop=thread.scrollHeight;
 }
 function paintQuotes(data){
  let box=document.querySelector('#tracking-quotes');if(!box){box=document.createElement('section');box.id='tracking-quotes';document.querySelector('#tracking-summary').after(box);}
  box.innerHTML=(data.quotes||[]).length?'<h2>Tus cotizaciones.</h2>'+data.quotes.map(q=>quoteCard(q)+(q.status==='sent'?`<form data-portal-form data-quote="${esc(q.id)}" class="panel quote-decision"><h3>Responder a ${esc(q.number)}</h3><label>Tu nombre *<input name="name" required minlength="2" maxlength="100" autocomplete="name"></label><label>Respuesta<select name="decision"><option value="accept">Aceptar esta propuesta</option><option value="changes">Solicitar ajustes</option></select></label><label data-change-note hidden>Ajustes que necesitas *<textarea name="note" rows="3" maxlength="1000"></textarea></label><label class="checkbox" data-consent><input type="checkbox" name="consent" required><span>He leído los entregables, el precio, el plazo y las condiciones de esta propuesta y los acepto. Esta acción no confirma un pago.</span></label><button type="submit" class="button light">Confirmar respuesta</button><p role="status" data-decision-status></p></form>`:'')).join(''):'';
  for(const form of box.querySelectorAll('form')){
   const q=data.quotes.find(q=>q.id===form.dataset.quote),status=form.querySelector('[data-decision-status]'),guard=guardFor(form,status);guard.renew();
   form.elements.decision.onchange=()=>{const changes=form.elements.decision.value==='changes';form.querySelector('[data-change-note]').hidden=!changes;form.elements.note.required=changes;form.querySelector('[data-consent]').hidden=changes;form.elements.consent.required=!changes;};
   form.onsubmit=async event=>{event.preventDefault();if(!credentials||guard.button.disabled)return;guard.setBusy(true);status.textContent='Registrando respuesta…';try{const response=await portalRequest('/api/tracking',{method:'POST',body:JSON.stringify({...credentials,action:'quote-decision',id:q.id,version:q.version,name:form.elements.name.value,decision:form.elements.decision.value,note:form.elements.note.value,consent:form.elements.consent.checked,antispam:guard.guard.payload()})});paint(response);replyStatus.textContent='Respuesta registrada. El equipo podrá verla en administración.';}catch(error){status.textContent=error.message;await guard.renew();guard.setBusy(false);}};
  }
 }
 async function prepareConversation(data){if(data.contactRequired||data.quoteContactRequired)await verifyGuard.renew();if(data.conversationAvailable)await replyGuard.renew();}
 lookup.addEventListener('submit',async event=>{
  event.preventDefault();if(lookupGuard.button.disabled)return;lookupGuard.setBusy(true);lookupStatus.textContent='Consultando…';
  try{
   const values={reference:lookup.elements.reference.value.trim(),...(lookup.elements.contact.value.trim()?{contact:lookup.elements.contact.value.trim()}:{})},data=await portalRequest('/api/tracking',{method:'POST',body:JSON.stringify({...values,action:'lookup',antispam:lookupGuard.guard.payload()})});
   credentials=values;verify.elements.contact.value='';reply.elements.message.value='';lastMessage='';paint(data);lookup.hidden=true;result.hidden=false;lookupStatus.textContent='';replyStatus.textContent='';verifyStatus.textContent='';await prepareConversation(data);result.focus({preventScroll:true});result.scrollIntoView({block:'start',behavior:'instant'});
  }catch(error){lookupStatus.textContent=error.message;}finally{await lookupGuard.renew();lookupGuard.setBusy(false);}
 });
 verify.addEventListener('submit',async event=>{
  event.preventDefault();if(!credentials||verifyGuard.button.disabled)return;verifyGuard.setBusy(true);verifyStatus.textContent='Confirmando contacto…';
  try{
   const values={...credentials,contact:verify.elements.contact.value.trim()},data=await portalRequest('/api/tracking',{method:'POST',body:JSON.stringify({...values,action:'lookup',antispam:verifyGuard.guard.payload()})});
   credentials=values;paint(data);verifyStatus.textContent='';await prepareConversation(data);if(data.conversationAvailable)reply.elements.message.focus();
  }catch(error){verifyStatus.textContent=error.message;}finally{await verifyGuard.renew();verifyGuard.setBusy(false);}
 });
 reply.addEventListener('submit',async event=>{
  event.preventDefault();if(!credentials||replyGuard.button.disabled)return;replyGuard.setBusy(true);replyStatus.textContent='Enviando…';
  try{
   if(lastMessage!==reply.elements.message.value){lastMessage=reply.elements.message.value;messageId=crypto.randomUUID();}
   const data=await portalRequest('/api/tracking',{method:'POST',body:JSON.stringify({...credentials,action:'message',message:reply.elements.message.value,messageId,antispam:replyGuard.guard.payload()})});
   paint(data);reply.elements.message.value='';lastMessage='';messageId=crypto.randomUUID();replyStatus.textContent='Mensaje guardado. El equipo lo verá en administración.';
  }catch(error){replyStatus.textContent=error.message;}finally{await replyGuard.renew();replyGuard.setBusy(false);}
 });
 document.querySelector('#tracking-change').addEventListener('click',()=>{credentials=null;verify.elements.contact.value='';reply.elements.message.value='';result.hidden=true;lookup.hidden=false;lookup.elements.reference.focus();});
}
