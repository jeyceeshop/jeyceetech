import test from 'node:test';
import assert from 'node:assert/strict';
import {whatsappUrl,quoteWhatsApp,briefMessage,paymentNotice} from '../src/whatsapp.js';
import {products,premiumServices,tierCards} from '../src/premium.js';
import {renderPage} from '../src/pages.js';
test('all plan cards offer a contextual brief first and quote via the official WhatsApp second',()=>{
 for(const s of premiumServices){const html=tierCards(s),links=[...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g)];assert.equal(links.length,8);for(let i=0;i<4;i++){assert.ok(links[i*2][1].startsWith('/checkout?plan='+s.slug+'--'));assert.ok(links[i*2][2].includes('Preparar un brief'));const url=new URL(links[i*2+1][1]);assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/50760913544');assert.ok(url.searchParams.get('text').includes(s.name));assert.ok(links[i*2+1][2].includes('Cotizar'));}assert.ok(!html.includes('mailto:'));}
 const generic=tierCards();assert.ok(generic.includes('/checkout?nivel=basico'));assert.ok(generic.includes('/checkout?nivel=business'));
});
test('WhatsApp messages preserve context and do not collect billing or payment credentials',()=>{
 const product=products.find(p=>p.key==='redes-sociales--pro');const text=briefMessage(product,{name:'Cliente',brief:'Quiero publicar contenido para mi marca.',advisoryPaid:true},'JC-TEST');const url=new URL(whatsappUrl(text));assert.equal(url.pathname,'/50760913544');assert.equal(url.searchParams.get('text'),text);assert.ok(text.includes('Redes sociales'));assert.ok(text.includes('Pro'));assert.ok(text.includes('$199 USD / mes'));assert.ok(!text.includes('$179 USD'));assert.ok(!text.includes('*Asesoría:*'));assert.ok(text.includes('Número de pedido: JC-TEST'));assert.ok(text.includes('únicamente por Yappy'));assert.ok(!text.includes('RUC'));
 assert.throws(()=>briefMessage(product,{name:'Cliente',brief:'corto'},'JC-TEST'));
 const html=renderPage('/checkout').html;assert.ok(html.includes('Solicitar por WhatsApp'));assert.ok(!html.includes('name="ruc"'));assert.ok(!html.includes('name="address"'));assert.ok(!html.includes('name="legalName"'));assert.ok(paymentNotice().includes('6827-4965'));assert.ok(paymentNotice().includes('+507 6091-3544'));
 assert.equal(new URL(quoteWhatsApp('Diseño gráfico','VIP')).hostname,'wa.me');
});
