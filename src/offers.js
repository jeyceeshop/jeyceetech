// Fecha inclusiva en Panamá (UTC-5). La oferta expira al comenzar el 1 de diciembre.
export const promotion={percent:10,slugs:['desarrollo-web','diseno-grafico'],endsAt:'2026-12-01T05:00:00.000Z',label:'30 de noviembre de 2026',timezone:'America/Panama'};
export const advisoryFee=20;
export function promotionActive(now=new Date()){return new Date(now).getTime()<Date.parse(promotion.endsAt);}
export function discountFor(slug,now=new Date()){return promotionActive(now)&&promotion.slugs.includes(slug)?promotion.percent:0;}
export function applyPromotion(base,slug,now=new Date()){
 const percent=discountFor(slug,now);
 if(base===null)return {base:null,price:null,percent,savings:null};
 const price=Math.round(base*(100-percent))/100;
 return {base,price,percent,savings:Math.round((base-price)*100)/100};
}
export function advisoryBalance(price,paid=false){const credit=paid&&price!==null?Math.min(advisoryFee,price):0;return {credit,balance:price===null?null:Math.round((price-credit)*100)/100};}
