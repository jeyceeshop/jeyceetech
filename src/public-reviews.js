import {installAntiSpam} from './antispam.js';
import {escape} from './pages.js';
export async function enablePublicReviews(){
 const form=document.querySelector('#review-form');if(!form)return;
 let response;try{response=await fetch('/api/reviews',{cache:'no-store'});}catch{return;}
 if(!response.ok)return;
 let data;try{data=await response.json();}catch{return;}if(!data.configured||!Array.isArray(data.reviews)||!data.challenge?.token)return;
 // Replace local form to remove local-only listeners before connecting the real endpoint.
 const next=form.cloneNode(true);form.replaceWith(next);
 const section=document.querySelector('#review-list').parentElement;
 section.querySelector('h2').textContent='Experiencias compartidas';
 section.querySelector('.form-note').textContent='Opiniones enviadas por visitantes y aprobadas tras moderación. No equivalen a una compra verificada.';
 document.querySelector('.review-banner p').textContent='Lee las opiniones publicadas. Las cinco estrellas de este encabezado expresan nuestra aspiración de servicio, no un promedio de valoraciones.';
 next.querySelector('.checkbox').innerHTML='<input type="checkbox" required> Acepto enviar mi nombre visible, valoración y comentario para su publicación tras moderación. He leído la <a href="/privacidad">política de privacidad</a>.';
 next.querySelector('button[type=submit]').textContent='Enviar reseña para revisión';
 const guard=installAntiSpam(next,{challenge:data.challenge,requireServer:true,refresh:async()=>{const r=await fetch('/api/reviews',{cache:'no-store'});const body=await r.json();if(!r.ok||!body.challenge?.token)throw Error('challenge');return body.challenge;}});
 const list=document.querySelector('#review-list');list.innerHTML=data.reviews.length?data.reviews.map(r=>`<article class="review-card"><span class="five-stars" aria-label="${Number(r.rating)} de 5 estrellas">${'★'.repeat(Math.min(5,Math.max(1,Number(r.rating))))}</span><p>${escape(r.text)}</p><b>${escape(r.author)}</b><small>Opinión publicada · no se verifica la compra automáticamente</small></article>`).join(''):'<div class="info-box"><h3>La primera opinión puede ser la tuya.</h3><p>Todavía no hay reseñas públicas aprobadas.</p></div>';
 next.addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(next),button=next.querySelector('[type=submit]'),status=next.querySelector('[role=status]');button.disabled=true;status.textContent='Enviando…';try{const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({author:d.get('author'),text:d.get('text'),rating:Number(d.get('rating')),consent:true,website:d.get('website')||'',antispam:guard.payload()})});const result=await r.json();if(!r.ok)throw Error(result.error||'No se pudo enviar.');status.textContent=result.message;next.reset();}catch(error){status.textContent=error.message;}finally{await guard.renew();button.disabled=false;}});
}
