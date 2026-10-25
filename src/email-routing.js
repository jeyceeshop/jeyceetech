// Alias proporcionados por el propietario. No son buzones independientes verificados.
export const mailboxes={
 business:'business@jeycee.shop',
 marketing:'mercadeo@jeycee.shop',
 orders:'orders@jeycee.shop',
 support:'support@jeycee.shop',
 vip:'vip@jeycee.shop',
 collabs:'collabs@jeycee.shop',
 careers:'rrhh@jeycee.shop',
 management:'gerencia@jeycee.shop',
 general:'hello@jeycee.shop'
};
export const topicRouting={cotizacion:'business',asesoramiento:'business',soporte:'support',facturacion:'orders',general:'general',marketing:'marketing',vip:'vip',colaboraciones:'collabs',empleo:'careers',gerencia:'management'};
export function topicRecipient(topic){return mailboxes[topicRouting[topic]]||null;}
export function salesRecipient(tier=''){return tier.toLowerCase()==='vip'?mailboxes.vip:mailboxes.business;}
