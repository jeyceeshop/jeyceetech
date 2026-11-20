import {promotion,advisoryFee} from './offers.js';
import {contactUrl} from './catalog.js';
export function promotionDialog(){
 return `<dialog id="launch-promotion" aria-labelledby="launch-promotion-title">
  <div class="launch-poster">
   <div class="launch-poster-art" aria-hidden="true"></div>
   <button type="button" class="launch-poster-close" aria-label="Cerrar anuncio de lanzamiento" autofocus>×</button>
   <div class="launch-poster-copy">
    <p class="launch-poster-label">JEY CEE · LANZAMIENTO</p>
    <h2 id="launch-promotion-title"><strong>${promotion.percent}%</strong> de descuento<br/> en todos los servicios</h2>
    <a class="launch-poster-link" href="/servicios">Ver servicios ↗</a>
   </div>
  </div>
 </dialog>`;
}

export function initPromotion(){
 const sessionKey='jeycee-launch-announcement-seen';
 try {
  if(sessionStorage.getItem(sessionKey))return;
 } catch {}

 if(!document.getElementById('launch-promotion'))document.body.insertAdjacentHTML('beforeend',promotionDialog());
 const dialog=document.getElementById('launch-promotion');
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target===dialog)dialog.close();
 });
 window.addEventListener('pagehide',()=>dialog.close(),{once:true});
 dialog.showModal();

 try {
  sessionStorage.setItem(sessionKey,'1');
 } catch {}
}

export function advisoryCard(){return `<section class="commercial-benefits" id="asesoramiento"><article><span class="eyebrow">CONOCE TU INVERSIÓN</span><h3>Cotización gratis.<br/>En todos los servicios.</h3><p>Cuéntanos qué necesitas y recibe una propuesta de alcance, calendario e inversión sin costo. Cotizar no obliga a contratar.</p><a class="text-link" href="${contactUrl()}">Pedir cotización gratis ↗</a></article><article><span class="eyebrow">ASESORÍA PARA DECIDIR MEJOR</span><h3>Asesoramiento por $${advisoryFee}.<br/><em>Sin costo adicional si contratas.</em></h3><p>Si necesitas orientación para definir tu proyecto, solicita una asesoría por $${advisoryFee}. Al adquirir cualquiera de nuestros servicios, los $${advisoryFee} que pagaste se acreditan íntegramente al precio del servicio.</p><p class="form-note">Se aplica una sola vez por asesoría pagada y verificada. En planes mensuales, se acredita al primer periodo. La cotización sigue siendo gratis y no requiere contratar asesoría.</p><a class="text-link" href="${contactUrl('Asesoramiento de $20 acreditable al contratar')}">Solicitar asesoramiento ↗</a></article></section>`;}
