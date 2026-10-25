import {brandCoupon,couponSessionKey,couponTerms} from './coupons.js';

const pieces=[
 {id:'strategy',name:'Estrategia',tag:'Encuentra tu dirección',symbol:'◎',message:'La estrategia conecta tu idea con las personas correctas.'},
 {id:'design',name:'Diseño',tag:'Dale una identidad',symbol:'✦',message:'El diseño transforma tu esencia en una marca que se reconoce.'},
 {id:'technology',name:'Tecnología',tag:'Haz que cobre vida',symbol:'↗',message:'La tecnología convierte tu visión en una experiencia que funciona.'}
];

export function renderBrandPlay(){return `
<section class="brand-play" id="activa-tu-marca" aria-labelledby="brand-play-title">
 <div class="brand-play-copy">
  <span class="eyebrow"><span class="play-live-dot" aria-hidden="true"></span> UNA IDEA. TRES PIEZAS. TU SIGUIENTE PASO.</span>
  <h2 id="brand-play-title">Conecta tu marca.<br><em>Activa tu 10%.</em></h2>
  <p>Las grandes marcas se construyen conectando lo que importa. Toca las tres piezas, en el orden que quieras, y descubre lo que podemos crear juntos.</p>
  <div class="play-prompt" id="play-prompt"><span class="play-prompt-arrow" aria-hidden="true">↗</span><span>Arma la conexión.<br><b>Tu cupón te espera al completar las 3 piezas.</b></span></div>
  <div class="play-reward" id="play-reward" hidden>
   <span class="eyebrow">CONEXIÓN COMPLETA / CUPÓN DESBLOQUEADO</span>
   <div class="play-ticket"><div><span>TU PRÓXIMO PROYECTO</span><strong>−${brandCoupon.value}<small>%</small></strong></div><div class="play-ticket-code"><span>USA ESTE CÓDIGO</span><code id="play-coupon-code" tabindex="0">${brandCoupon.code}</code><button type="button" id="play-copy">Copiar código <span aria-hidden="true">⧉</span></button></div></div>
   <a class="button play-claim" href="/checkout?cupon=${brandCoupon.code}">Usar mi 10% <span aria-hidden="true">↗</span></a>
   <p id="play-copy-status" role="status"></p>
  </div>
  <details class="play-terms"><summary>Condiciones del cupón</summary><p>${couponTerms}</p></details>
  <noscript><p>Tu cupón de bienvenida es <strong>${brandCoupon.code}</strong>. Escríbelo en el brief para aplicar el 10% según estas condiciones.</p></noscript>
 </div>
 <div class="play-workbench">
  <div class="play-stage">
   <div class="play-stage-top"><span>JEY CEE / BRAND LAB</span><span id="play-stage-state">POR CONECTAR</span></div>
   <div class="play-orbit" aria-hidden="true"><span class="play-orbit-node"></span></div>
   <div class="play-mark" aria-hidden="true"><img class="play-mark-ghost" src="/mark.svg" alt="" width="240" height="269">${pieces.map((p,i)=>`<div class="play-mark-piece play-mark-piece-${i}" data-mark="${p.id}"><img src="/mark.svg" alt="" width="240" height="269"></div>`).join('')}</div>
   <div class="play-stage-bottom"><span>ESTRATEGIA × DISEÑO × TECNOLOGÍA</span><span id="play-count">0 / 3</span></div>
  </div>
  <div class="play-piece-buttons" role="group" aria-label="Conecta las tres piezas de tu marca">${pieces.map((p,i)=>`<button type="button" class="play-piece" data-piece="${p.id}" aria-pressed="false" aria-describedby="play-instructions"><span class="play-piece-top"><span aria-hidden="true">0${i+1}</span><span class="play-piece-symbol" aria-hidden="true">${p.symbol}</span></span><strong>${p.name}</strong><span>${p.tag}</span><span class="play-piece-action">Conectar <span aria-hidden="true">+</span></span></button>`).join('')}</div>
  <p id="play-instructions">Toca cada pieza para conectarla. También puedes usar Tab y Enter.</p>
  <p class="play-feedback" id="play-feedback" role="status" aria-live="polite" aria-atomic="true">Todo empieza con una buena conexión.</p>
  <div class="play-progress" role="progressbar" aria-label="Piezas conectadas" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0"><span></span></div>
 </div>
</section>`;}

export function initBrandPlay(){
 const root=document.querySelector('#activa-tu-marca');if(!root)return;
 const connected=new Set(),reward=root.querySelector('#play-reward'),feedback=root.querySelector('#play-feedback');
 function connect(id,{announce=true}={}){
  if(connected.has(id))return;
  const piece=pieces.find(p=>p.id===id);if(!piece)return;connected.add(id);
  const button=root.querySelector(`[data-piece="${id}"]`);button.setAttribute('aria-pressed','true');button.setAttribute('aria-disabled','true');button.querySelector('.play-piece-action').textContent='Conectada ✓';
  root.querySelector(`[data-mark="${id}"]`).classList.add('is-connected');
  root.querySelector('#play-count').textContent=connected.size+' / 3';
  root.querySelector('.play-progress').setAttribute('aria-valuenow',String(connected.size));root.style.setProperty('--play-progress',connected.size/3);
  if(announce)feedback.textContent=piece.message;
  if(connected.size===3){
   root.classList.add('is-complete');reward.hidden=false;root.querySelector('#play-prompt').hidden=true;
   root.querySelector('#play-stage-state').textContent='CONEXIÓN COMPLETA';
   feedback.textContent=`¡Tu marca está conectada! Desbloqueaste el cupón ${brandCoupon.code}: ${brandCoupon.value}% de descuento. Ya puedes copiarlo o usarlo en tu brief.`;
   try{sessionStorage.setItem(couponSessionKey,brandCoupon.code);}catch{}
   if(announce){
    root.querySelector('#play-coupon-code').focus({preventScroll:true});
    if(window.matchMedia('(max-width:760px)').matches)reward.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
   }
  }
 }
 root.querySelectorAll('[data-piece]').forEach(button=>button.addEventListener('click',()=>connect(button.dataset.piece)));
 try{if(sessionStorage.getItem(couponSessionKey)===brandCoupon.code)pieces.forEach(p=>connect(p.id,{announce:false}));}catch{}
 root.querySelector('#play-copy').addEventListener('click',async()=>{
  const status=root.querySelector('#play-copy-status');
  try{await navigator.clipboard.writeText(brandCoupon.code);status.textContent='Código copiado. Úsalo en el brief de tu servicio.';}
  catch{const code=root.querySelector('#play-coupon-code'),range=document.createRange();range.selectNodeContents(code);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);code.focus();status.textContent='Selecciona y copia el código '+brandCoupon.code+'. También puedes pulsar «Usar mi 10%».';}
 });
}
