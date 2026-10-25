import {initBrief} from './brief.js';
import {quoteWhatsApp,officialWhatsApp} from './whatsapp.js';
import {installAntiSpam} from './antispam.js';
import {mailboxes} from './email-routing.js';
import {initContact} from './contact.js';
import {services,contactUrl,serviceGroups} from './catalog.js';
import {products} from './premium.js';
import {advisoryBalance} from './offers.js';
import {promotionBanner} from './commercial.js';
import {priceLabel} from './pricing.js';
import {renderHome} from './home.js';
import {renderPage,planCards,serviceCards,note,orderSummary,escape} from './pages.js';
const banner=promotionBanner();if(banner){document.body.classList.add('has-promotion');document.querySelector('header').insertAdjacentHTML('beforebegin',banner);}
let path=location.pathname.replace(/\/+$/,'')||'/';
if(path==='/soporte'){const old=new URLSearchParams(location.search);const tipo=old.get('tema')==='Facturación'?'facturacion':'soporte';history.replaceState(null,'','/contacto?tipo='+tipo);path='/contacto';}
const arrow='<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const nav=document.querySelector('nav');nav.id='primary-navigation';nav.innerHTML=`<a href="/quienes-somos">Quiénes somos</a><div class="nav-services"><button id="services-toggle" aria-expanded="false" aria-controls="services-dropdown">Servicios <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div id="services-dropdown" class="mega-complete" hidden><div class="mega-catalog-heading"><div class="mega-priority-links"><a href="/servicios/desarrollo-web">Desarrollo web ↗</a><a href="/servicios/diseno-grafico">Diseño gráfico ↗</a></div><span class="eyebrow">${services.length} ESPECIALIDADES / UNA VISIÓN INTEGRAL</span><a class="all-services" href="/servicios">Todos los servicios ${arrow}</a></div>${serviceGroups.map(g=>`<section class="mega-group"><h3>${g.name}</h3><div class="mega-links">${services.filter(s=>s.group===g.id).map(s=>`<a href="/servicios/${s.slug}"><span><b>${s.name}</b><small>${s.short}</small></span>${arrow}</a>`).join('')}</div></section>`).join('')}</div></div><a href="/planes">Planes premium</a><a href="/resenas">Reseñas</a>`;
document.querySelectorAll('a[href="#inicio"]').forEach(a=>a.href='/');document.querySelector('.nav-contact').href='/contacto';document.querySelector('.nav-contact').firstChild.textContent='Contáctanos ';
const main=document.querySelector('main');
if(path!=='/'){const page=renderPage(path);main.className='inner-page section';main.innerHTML=page.html;document.title=page.title+' | JeyCee Tech';document.querySelector('meta[name=description]').content=page.title+' — JeyCee Tech. Diseño, estrategia y experiencias digitales en Panamá.';}else{
 main.innerHTML=renderHome();
}
document.querySelector('footer').insertAdjacentHTML('afterbegin',`<div class="footer-directory"><div><span class="eyebrow">HAZ QUE TU MARCA EVOLUCIONE</span><h2>Hablemos de<br/><em>lo que viene.</em></h2><a href="mailto:business@jeycee.shop">business@jeycee.shop ↗</a><a href="${quoteWhatsApp()}" target="_blank" rel="noopener noreferrer">WhatsApp oficial: ${officialWhatsApp.display} ↗</a><p>Panamá · USD · Pagos únicamente por Yappy</p></div><div><h3>Explora</h3><a href="/servicios">Servicios</a><a href="/planes">Planes premium</a><a href="/#asesoramiento">Asesoramiento · $20 acreditables</a><a href="/resenas">Reseñas</a><a href="/quienes-somos">Quiénes somos</a><a href="/trabaja-con-nosotros">Trabaja con nosotros</a></div><div><h3>Te acompañamos</h3><a href="/contacto">Contáctanos</a><a href="/facturacion">Facturación</a><a href="/preguntas-frecuentes">Preguntas frecuentes</a><a href="/privacidad">Privacidad</a><a href="/terminos">Condiciones</a></div></div>`);
document.querySelectorAll('form:not(#request-form)').forEach(form=>installAntiSpam(form));
initContact();
document.querySelector('#year').textContent=new Date().getFullYear();
const menu=document.querySelector('.menu-toggle');menu.setAttribute('aria-controls','primary-navigation');
function closeDropdown(){toggle.setAttribute('aria-expanded','false');dropdown.hidden=true;}
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú');document.querySelector('header').classList.remove('menu-open');menu.textContent='☰';closeDropdown();}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');document.querySelector('header').classList.toggle('menu-open',open);menu.textContent=open?'×':'☰';if(!open)closeDropdown();});
const toggle=document.querySelector('#services-toggle'),dropdown=document.querySelector('#services-dropdown');
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',open);dropdown.hidden=!open;});
document.addEventListener('click',e=>{if(!e.target.closest('.nav-services'))closeDropdown();if(!e.target.closest('header'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(toggle.getAttribute('aria-expanded')==='true'){closeDropdown();toggle.focus();}else if(menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}}});
nav.addEventListener('focusout',()=>{setTimeout(()=>{if(!nav.contains(document.activeElement))closeDropdown();},0);});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
window.matchMedia('(max-width: 1024px)').addEventListener('change',()=>closeMenu());
nav.querySelectorAll('a').forEach(a=>{if(a.pathname===path)a.setAttribute('aria-current','page');});
export function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function mailLink(subject,text,email){return 'mailto:'+email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);}
const dialog=document.querySelector('dialog');let summary='';function showSummary(text){summary=text;document.querySelector('#project-summary').textContent=text;dialog.showModal();}
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.querySelector('#download-brief').addEventListener('click',()=>download(summary,'solicitud-jeycee-tech.txt'));
document.querySelector('#download-brief').insertAdjacentHTML('afterend','<a class="button outline" id="send-summary">Abrir solicitud en mi correo ↗</a>');
const originalShow=showSummary;function present(text,email=mailboxes.business){originalShow(text);document.querySelector('#send-summary').href=mailLink((email===mailboxes.orders?'[PEDIDOS]':'[COTIZACIÓN]')+' Solicitud — Jey Cee',text,email);document.querySelector('dialog > p').textContent='Descarga el resumen o abre un correo a '+email+'. Nada se envía automáticamente.';}
const contact=document.querySelector('#contact-form');contact?.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(contact);present(`SOLICITUD PARA JEYCEE TECH\nCotización gratis, sin obligación de compra.\nNo es factura ni comprobante de pago.\n\nNombre: ${d.get('name')}\nCorreo: ${d.get('email')}\nServicio: ${d.get('service')}\n\nProyecto:\n${d.get('message')}`);});
initBrief();
const reviewForm=document.querySelector('#review-form');if(reviewForm){const key='jeycee-local-reviews-v1';let reviews=[];try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))reviews=saved.filter(r=>typeof r.id==='string'&&typeof r.author==='string'&&typeof r.text==='string'&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5).slice(0,50);}catch{}
function paint(){const list=document.querySelector('#review-list');list.innerHTML=reviews.length?reviews.map(r=>`<article class="review-card"><span class="five-stars" aria-label="${r.rating} de 5 estrellas">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span><p>${escape(r.text)}</p><b>${escape(r.author)}</b><small>Prueba local · no verificada</small><button class="delete-review" data-id="${escape(r.id)}">Eliminar de este dispositivo</button></article>`).join(''):'<div class="info-box"><h3>Tu experiencia puede abrir la conversación.</h3><p>Aún no hay reseñas guardadas en este navegador. No mostramos testimonios inventados.</p></div>';}
function persist(){try{localStorage.setItem(key,JSON.stringify(reviews));return true;}catch{document.querySelector('#review-status').textContent='El navegador no permite guardar datos. No se ha guardado el cambio.';return false;}}
reviewForm.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(reviewForm),before=[...reviews];reviews.unshift({id:crypto.randomUUID(),author:d.get('author').trim().slice(0,70),text:d.get('text').trim().slice(0,1500),rating:Number(d.get('rating'))});reviews=reviews.slice(0,50);if(!persist()){reviews=before;return;}paint();reviewForm.reset();document.querySelector('#review-status').textContent='Reseña guardada solo en este dispositivo. No se ha publicado ni enviado.';});document.querySelector('#review-list').addEventListener('click',e=>{const b=e.target.closest('.delete-review');if(!b)return;const before=[...reviews];reviews=reviews.filter(r=>r.id!==b.dataset.id);if(!persist()){reviews=before;return;}paint();});paint();}
if(path==='/resenas')import('./public-reviews.js').then(m=>m.enablePublicReviews());
// Inline SVG arrows avoid missing glyphs on devices without symbol fonts.
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.includes('↗')&&!['SCRIPT','STYLE','TEXTAREA','PRE'].includes(n.parentElement?.tagName)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const parts=node.textContent.split('↗');const fragment=document.createDocumentFragment();parts.forEach((part,i)=>{fragment.append(document.createTextNode(part));if(i<parts.length-1){const wrapper=document.createElement('span');wrapper.innerHTML=arrow;fragment.append(wrapper.firstChild);}});node.replaceWith(fragment);}
