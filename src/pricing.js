// Tarifas comerciales de JeyCee Tech en USD, por proyecto y alcance descrito.
// null = cotización personalizada. Edita aquí para actualizar toda la web.
export const pricing = {
 'diseno-grafico':       {basico:150, pro:390, vip:790, business:null},
 'manual-de-marca':      {basico:250, pro:490, vip:890, business:null},
 'packaging':            {basico:350, pro:790, vip:1490,business:null},
 'identidad-de-marca':   {basico:390, pro:790, vip:1490,business:null},
 'analisis-de-datos':    {basico:350, pro:750, vip:1490,business:null},
 'diseno-de-interaccion':{basico:650, pro:1290,vip:2490,business:null},
 'productos-digitales':  {basico:590, pro:1190,vip:2490,business:null},
 'branding-estrategico': {basico:350, pro:690, vip:1290,business:null}
};
export const money=value=>new Intl.NumberFormat('es-PA',{style:'currency',currency:'USD',currencyDisplay:'narrowSymbol',maximumFractionDigits:0}).format(value);
export function priceFor(slug,tier){return pricing[slug]?.[tier]??null;}
export function startingPrice(tier){const values=Object.values(pricing).map(p=>p[tier]).filter(Number.isFinite);return values.length?Math.min(...values):null;}
export function priceLabel(price){return price===null?'A cotización':money(price)+' USD';}
