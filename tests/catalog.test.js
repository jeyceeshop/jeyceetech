import test from 'node:test';
import assert from 'node:assert/strict';
import {premiumServices,products,tiersFor} from '../src/premium.js';
import {contactUrl} from '../src/catalog.js';
import {renderPage,orderSummary} from '../src/pages.js';
import {pricing,startingPrice,money,priceLabel} from '../src/pricing.js';
test('all service tiers have contextual contact links and correct published prices',()=>{
 assert.equal(premiumServices.length,8);
 assert.equal(products.length,32);
 assert.equal(new Set(products.map(p=>p.key)).size,32);
 assert.equal(products.filter(p=>Number.isFinite(p.price)).length,24);
 assert.equal(products.filter(p=>p.price===null).length,8);
 for(const s of premiumServices){
  const tiers=tiersFor(s);assert.deepEqual(tiers.map(t=>t.tierName),['Básico','Pro','VIP','Business']);
  assert.ok(s.definition.length>120);assert.ok(s.approach.length>100);assert.ok(s.inputs.length>80);
  for(const p of tiers){
   assert.equal(p.price,pricing[s.slug][p.id]);assert.ok(p.items.length>=4);
   const url=new URL(contactUrl(s.name,p.tierName));assert.equal(url.pathname,'ventas@jeycee.shop');assert.ok(url.searchParams.get('subject').includes(s.name));assert.ok(url.searchParams.get('subject').includes(p.tierName));
   const summary=orderSummary(p);assert.ok(summary.includes(priceLabel(p.price)));
   if(p.id!=='business'){assert.ok(Number.isInteger(p.price)&&p.price>0);assert.ok(renderPage('/servicios/'+s.slug).html.includes(money(p.price)));}
   else assert.ok(summary.includes('A cotización'));
  }
  assert.ok(tiers[0].price<tiers[1].price&&tiers[1].price<tiers[2].price);
  const page=renderPage('/servicios/'+s.slug);assert.equal(page.title,s.name);assert.ok(page.html.includes('ventas@jeycee.shop'));
 }
 for(const id of ['basico','pro','vip'])assert.equal(startingPrice(id),Math.min(...Object.values(pricing).map(s=>s[id])));
 assert.equal(startingPrice('business'),null);
});
