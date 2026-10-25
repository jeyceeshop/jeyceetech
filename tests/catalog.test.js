import test from 'node:test';
import assert from 'node:assert/strict';
import {premiumServices,products,tiersFor} from '../src/premium.js';
import {contactUrl,services,serviceGroups} from '../src/catalog.js';
import {renderPage,orderSummary} from '../src/pages.js';
import {pricing,startingPrice,money,priceLabel,offerFor} from '../src/pricing.js';
test('all service tiers have contextual contact links and correct published prices',()=>{
 assert.equal(premiumServices.length,21);
 assert.equal(products.length,84);
 assert.equal(new Set(products.map(p=>p.key)).size,84);
 assert.equal(products.filter(p=>Number.isFinite(p.price)).length,63);
 assert.equal(products.filter(p=>p.price===null).length,21);
 for(const s of premiumServices){
  const tiers=tiersFor(s);assert.deepEqual(tiers.map(t=>t.tierName),['Básico','Pro','VIP','Business']);
  assert.ok(s.definition.length>120);assert.ok(s.approach.length>100);assert.ok(s.inputs.length>80);
  for(const p of tiers){
   assert.equal(p.basePrice,pricing[s.slug][p.id]);assert.equal(p.price,offerFor(s.slug,p.id).price);assert.ok(serviceGroups.some(g=>g.id===s.group));assert.equal(p.cadence,s.cadence);assert.ok(p.items.length>=4);
   const url=new URL(contactUrl(s.name,p.tierName));assert.equal(url.pathname,p.id==='vip'?'vip@jeycee.shop':'business@jeycee.shop');assert.ok(url.searchParams.get('subject').includes(s.name));assert.ok(url.searchParams.get('subject').includes(p.tierName));
   const summary=orderSummary(p);assert.ok(summary.includes(priceLabel(p.price,p.cadence)));
   if(p.id!=='business'){assert.ok(Number.isFinite(p.price)&&p.price>0);assert.ok(renderPage('/servicios/'+s.slug).html.includes(money(p.price)));}
   else assert.ok(summary.includes('A cotización'));
  }
  assert.ok(tiers[0].price<tiers[1].price&&tiers[1].price<tiers[2].price);
  const page=renderPage('/servicios/'+s.slug);assert.equal(page.title,s.name);assert.ok(page.html.includes('business@jeycee.shop'));
 }
 for(const id of ['basico','pro','vip'])assert.equal(startingPrice(id),Math.min(...Object.keys(pricing).map(slug=>offerFor(slug,id).price)));
 assert.equal(startingPrice('business'),null);
});
