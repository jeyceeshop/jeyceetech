import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {projects,projectPath,portfolioIndex,portfolioPreview} from '../src/portfolio.js';
import {services} from '../src/catalog.js';
import {renderPage} from '../src/pages.js';
import {seoFor,structuredData,breadcrumbsFor,indexablePaths,site} from '../src/seo.js';

test('concept cases are discoverable and explicitly fictional in cards, pages and structured data',()=>{
 assert.equal(projects.length,4);assert.equal(new Set(projects.map(projectPath)).size,4);
 assert.equal((portfolioIndex().match(/class="portfolio-card"/g)||[]).length,4);assert.equal((portfolioPreview().match(/class="portfolio-card"/g)||[]).length,2);
 for(const project of projects){const path=projectPath(project),html=renderPage(path).html,meta=seoFor(path);assert.ok(indexablePaths.includes(path));assert.equal(meta.found,true);assert.equal(meta.url,site.origin+path);assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);assert.ok(html.includes('es una marca ficticia'));assert.ok(html.includes('no representan una web publicada'));assert.ok(html.includes('sin resultados comerciales verificados')||html.includes('ni resultados comerciales verificados'));assert.ok(html.includes(project.objective));for(const [title] of project.results)assert.ok(html.includes(title));const work=structuredData(path)['@graph'].find(item=>item['@type']==='CreativeWork');assert.equal(work.creativeWorkStatus,'Conceptual');assert.ok(work.genre.includes('marca ficticia'));assert.ok(!JSON.stringify(work).includes('aggregateRating'));assert.deepEqual(breadcrumbsFor(path).map(c=>c.path),['/','/portafolio',path]);}
 const list=structuredData('/portafolio')['@graph'].find(item=>item['@type']==='ItemList');assert.equal(list.itemListElement.length,4);assert.equal(seoFor('/portafolio/no-existe').found,false);
});

test('project inquiries retain the concept and link only to existing services and official WhatsApp',()=>{
 for(const project of projects){const html=renderPage(projectPath(project)).html;for(const [slug]of project.services){assert.ok(services.some(s=>s.slug===slug));assert.ok(html.includes('/servicios/'+slug));}assert.ok(html.includes('&servicio='+project.primaryService+'&proyecto='+project.slug));const href=html.match(/href="(https:\/\/wa\.me\/[^"]+)"/)[1],url=new URL(href);assert.equal(url.pathname,'/50760913544');assert.ok(url.searchParams.get('text').includes(project.name));assert.ok(url.searchParams.get('text').includes('concepto del portafolio'));}
});

test('every project uses local optimized responsive artwork and a truthful social preview',async()=>{
 for(const project of projects){const html=renderPage(projectPath(project)).html,meta=seoFor(projectPath(project));assert.ok(html.includes('fetchpriority="high"'));assert.ok(html.includes(project.image+'-768.webp 768w'));assert.equal(meta.image,site.origin+'/portfolio/'+project.image+'.jpg');assert.equal(meta.imageWidth,1536);assert.equal(meta.imageHeight,1024);for(const name of [project.image+'.webp',project.image+'-768.webp',project.image+'.jpg']){const file=await stat(new URL('../public/portfolio/'+name,import.meta.url));assert.ok(file.isFile());assert.ok(file.size<450000);}}
});
