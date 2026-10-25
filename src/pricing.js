import {applyPromotion} from './offers.js';
import {agencyServices} from './agency-services.js';
// Tarifas JeyCee Tech en USD; por proyecto salvo cadence: month en el servicio.
// null = cotización personalizada. Edita aquí para actualizar toda la web.
export const pricing = {
 'diseno-grafico':        {basico:65,  pro:145, vip:285, business:null},
 'manual-de-marca':       {basico:95,  pro:195, vip:395, business:null},
 'packaging':             {basico:125, pro:295, vip:575, business:null},
 'identidad-de-marca':    {basico:150, pro:325, vip:595, business:null},
 'analisis-de-datos':     {basico:110, pro:245, vip:475, business:null},
 'diseno-de-interaccion': {basico:225, pro:495, vip:895, business:null},
 'productos-digitales':   {basico:250, pro:550, vip:990, business:null},
 'branding-estrategico':  {basico:135, pro:275, vip:525, business:null}
};
for(const s of agencyServices)pricing[s.slug]={basico:s.prices[0],pro:s.prices[1],vip:s.prices[2],business:null};
export const money=value=>new Intl.NumberFormat('es-PA',{style:'currency',currency:'USD',currencyDisplay:'narrowSymbol',minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).format(value);
export function priceFor(slug,tier){return pricing[slug]?.[tier]??null;}
export function startingPrice(tier){const values=Object.keys(pricing).map(slug=>offerFor(slug,tier).price).filter(Number.isFinite);return values.length?Math.min(...values):null;}
export function priceLabel(price,cadence){return price===null?'A cotización':money(price)+' USD'+(cadence==='month'?' / mes':'');}
export function billingLabel(cadence){return cadence==='month'?'por mes':'por proyecto';}

export function offerFor(slug,tier,now=new Date()){return applyPromotion(priceFor(slug,tier),slug,now);}
export function offerText(slug,tier,now=new Date()){const offer=offerFor(slug,tier,now);return priceLabel(offer.price)+(offer.percent?' ('+offer.percent+'% de descuento)':'');}
