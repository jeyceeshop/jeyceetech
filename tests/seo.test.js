import test from 'node:test';
import assert from 'node:assert/strict';
import {services} from '../src/catalog.js';
import {guides} from '../src/resources.js';
import {renderPage} from '../src/pages.js';
import {renderHome} from '../src/home.js';
import {seoFor,seoHead,structuredData,indexablePaths,staticPaths,breadcrumbsFor,site} from '../src/seo.js';
test('every public page has unique local SEO with canonical query and fragment removal',()=>{
 assert.equal(indexablePaths.length,33);assert.equal(new Set(indexablePaths).size,33);const titles=new Set(),descriptions=new Set();
 for(const path of indexablePaths){const meta=seoFor(path+'?utm_source=test#private');assert.equal(meta.found,true);assert.equal(meta.noindex,undefined);assert.equal(meta.url,site.origin+(path==='/'?'/':path));titles.add(meta.title);descriptions.add(meta.description);assert.ok(seoHead(path).includes('og:locale'));}
 assert.equal(titles.size,33);assert.equal(descriptions.size,33);assert.ok(renderHome().includes('Agencia digital<br/>en Panamá.'));
});
test('all 21 services have visible matching local questions, Service schema and linked breadcrumbs',()=>{
 for(const service of services){const path='/servicios/'+service.slug,meta=seoFor(path),html=renderPage(path).html,graph=structuredData(path)['@graph'];assert.ok(meta.description.includes('Panamá'),path);assert.ok(html.includes(service.name+' en Panamá'));const faq=graph.find(n=>n['@type']==='FAQPage');assert.equal(faq.mainEntity.length,3);for(const item of faq.mainEntity){assert.ok(html.includes(item.name));assert.ok(html.includes(item.acceptedAnswer.text));}assert.ok(graph.some(n=>n['@type']==='Service'));assert.deepEqual(breadcrumbsFor(path).map(c=>c.path),['/','/servicios',path]);}
});
test('private flows and unknown pages remain noindex and never enter the sitemap list',()=>{
 for(const path of ['/admin','/admin/demo','/checkout','/seguimiento','/soporte','/facturacion','/resenas','/privacidad','/terminos','/unknown']){const meta=seoFor(path);assert.equal(meta.noindex,true);assert.ok(meta.robots.startsWith('noindex'));assert.equal(structuredData(path),null);assert.ok(!indexablePaths.includes(path));}
 assert.equal(seoFor('/unknown').found,false);assert.ok(staticPaths.includes('/admin/demo'));
});
test('organization data is consistent without invented address, partners, ratings or search capabilities',()=>{
 const json=structuredData('/'),organization=json['@graph'].find(n=>n['@type']==='Organization'),raw=JSON.stringify(json);assert.equal(organization.url,'https://www.jeycee.shop/');assert.equal(organization.areaServed.identifier,'PA');assert.equal(organization.founder.name,'Julian Cueto');assert.equal(organization.telephone,'+507 6091-3544');for(const unsupported of ['aggregateRating','streetAddress','SearchAction','McDonald','Gucci','LocalBusiness'])assert.ok(!raw.includes(unsupported));
});
test('guides contain useful visible content and first-party pricing, with matching Article metadata',()=>{
 assert.equal(guides.length,4);for(const guide of guides){const path='/recursos/'+guide.slug,html=renderPage(path).html,graph=structuredData(path)['@graph'];assert.ok(html.includes(guide.title));assert.ok(graph.some(n=>n['@type']==='Article'&&n.headline===guide.title));assert.ok(guide.body().split(/\s+/).length>350);for(const service of guide.services)assert.ok(html.includes('/servicios/'+service));}
 const pricing=guides.find(g=>g.slug.startsWith('cuanto'));assert.ok(pricing.body().includes('no un promedio del mercado panameño'));assert.ok(pricing.body().includes('tarifas regulares'));
});
