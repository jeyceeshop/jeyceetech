import {portalArrow} from './portal-ui.js';
import {trackingKeyPattern} from './portal-data.js';
export function trackingReceipt(reference,tracking){
 const box=document.createElement('aside');box.className='portal-secret';box.setAttribute('aria-label','Acceso privado de seguimiento');
 const heading=document.createElement('h3');heading.textContent='Seguimiento de tu solicitud';box.append(heading);
 const key=tracking?.key;
 if(trackingKeyPattern.test(key||'')){
  const note=document.createElement('p');note.textContent='Guarda tu clave o copia el enlace privado. Quien tenga este acceso podrá ver el seguimiento y conversar con el equipo.';
  const code=document.createElement('code');code.textContent=key;code.tabIndex=0;code.setAttribute('aria-label','Clave privada de seguimiento');
  const copy=document.createElement('button');copy.type='button';copy.className='portal-small-button';copy.textContent='Copiar enlace privado';
  const link=document.createElement('a');link.href='/seguimiento#'+new URLSearchParams({pedido:reference,clave:key});link.innerHTML='Consultar seguimiento '+portalArrow;link.className='text-link';
  const status=document.createElement('p');status.className='form-note';status.setAttribute('role','status');status.textContent='La clave no se guarda en este navegador. Si indicaste correo, intentaremos enviar también allí el acceso.';
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(link.href);status.textContent='Enlace copiado. Guárdalo en un lugar privado.';}catch{const range=document.createRange();range.selectNodeContents(code);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);code.focus();status.textContent='Copia la clave seleccionada y conserva también el número de tu solicitud.';}});
  box.append(note,code,copy,link,status);
 }else{
  const note=document.createElement('p');note.textContent='Consulta el estado con tu número y la clave que guardaste al crear la solicitud. Si no la tienes, contacta al equipo.';
  const link=document.createElement('a');link.href='/seguimiento?pedido='+encodeURIComponent(reference);link.className='text-link';link.innerHTML='Consultar seguimiento '+portalArrow;box.append(note,link);
 }
 return box;
}
