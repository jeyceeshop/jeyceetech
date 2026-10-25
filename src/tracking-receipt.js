import {portalArrow} from './portal-ui.js';
export function trackingReceipt(reference){
 const box=document.createElement('aside');box.className='portal-secret';box.setAttribute('aria-label','Seguimiento de tu solicitud');
 const heading=document.createElement('h3');heading.textContent='Seguimiento de tu solicitud';
 const note=document.createElement('p');note.textContent='Consulta el estado usando tu número de pedido o ticket.';
 const link=document.createElement('a');link.href='/seguimiento#'+new URLSearchParams({pedido:reference});link.innerHTML='Consultar seguimiento '+portalArrow;link.className='text-link';
 const copy=document.createElement('button');copy.type='button';copy.className='portal-small-button';copy.textContent='Copiar enlace de seguimiento';
 const status=document.createElement('p');status.className='form-note';status.setAttribute('role','status');
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(link.href);status.textContent='Enlace de seguimiento copiado.';}catch{status.textContent='Conserva tu número de solicitud: '+reference+'. Puedes introducirlo en Seguimiento.';}});
 box.append(heading,note,copy,link,status);return box;
}
