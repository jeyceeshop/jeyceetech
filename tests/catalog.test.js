import test from 'node:test';
import assert from 'node:assert/strict';
import {premiumServices,products,tiersFor} from '../src/premium.js';
import {contactUrl} from '../src/catalog.js';
import {renderPage} from '../src/pages.js';
test('each service has four distinct scopes and contextual sales contact links without numerical prices',()=>{
 assert.equal(premiumServices.length,8);
 assert.equal(products.length,32);
 assert.equal(new Set(products.map(p=>p.key)).size,32);
 for(const s of premiumServices){
  const tiers=tiersFor(s);assert.deepEqual(tiers.map(t=>t.tierName),['Básico','Pro','VIP','Business']);
  assert.ok(s.definition.length>120);assert.ok(s.approach.length>100);assert.ok(s.inputs.length>80);
  for(const p of tiers){assert.equal('price' in p,false);assert.ok(p.items.length>=4);const url=new URL(contactUrl(s.name,p.tierName));assert.equal(url.pathname,'ventas@jeycee.shop');assert.ok(url.searchParams.get('subject').includes(s.name));assert.ok(url.searchParams.get('subject').includes(p.tierName));}
  const page=renderPage('/servicios/'+s.slug);assert.equal(page.title,s.name);assert.ok(page.html.includes('ventas@jeycee.shop'));assert.ok(!/USD\s*\d|\$\d/.test(page.html));
 }
});
