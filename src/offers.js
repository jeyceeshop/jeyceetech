export const promotion={percent:10};
export const advisoryFee=20;
export function applyPromotion(base){
 const {percent}=promotion;
 if(base===null)return {base:null,price:null,percent,savings:null};
 const baseCents=Math.round(base*100);
 const priceCents=Math.round(baseCents*(100-percent)/100);
 return {base,price:priceCents/100,percent,savings:(baseCents-priceCents)/100};
}
export function advisoryBalance(price,paid=false){const credit=paid&&price!==null?Math.min(advisoryFee,price):0;return {credit,balance:price===null?null:Math.round((price-credit)*100)/100};}
