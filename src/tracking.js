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
  reply.hidden=!data.conversationAvailable;verify.hidden=!data.contactRequired;document.querySelector('#tracking-legacy-help').hidden=data.conversationAvailable===true||data.contactRequired===true;
  document.querySelector('#tracking-summary').innerHTML=`<article class="panel tracking-summary"><span class="eyebrow">${data.entry.kind==='order'?'PEDIDO':'TICKET'} / ${esc(data.entry.reference)}</span>${badge(data.entry.status)}<h2>${esc(data.entry.service)}</h2>${data.entry.plan?'<p>'+esc(data.entry.plan)+'</p>':''}<p>${statusFor(data.entry.status).hint}</p><dl><div><dt>Recibido</dt><dd>${dateLabel(data.entry.createdAt)}</dd></div><div><dt>Última actualización</dt><dd>${dateLabel(data.entry.updatedAt)}</dd></div>${data.entry.dueDate?'<div><dt>Fecha objetivo acordada</dt><dd>'+dateLabel(data.entry.dueDate)+'</dd></div>':''}</dl></article>`;
  const thread=document.querySelector('#tracking-messages');thread.innerHTML=messageCards(data.messages);thread.scrollTop=thread.scrollHeight;
 }
 async function prepareConversation(data){if(data.contactRequired)await verifyGuard.renew();else if(data.conversationAvailable)await replyGuard.renew();}
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
