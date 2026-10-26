import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {staticPaths,indexablePaths,seoFor,site} from '../src/seo.js';
const titles=new Set(),descriptions=new Set();
for(const path of [...staticPaths,'/404']){
 const meta=seoFor(path),file=join('dist',path==='/'?'index.html':path.slice(1)+'.html'),html=await readFile(file,'utf8');
 assert.equal((html.match(/<title\b/g)||[]).length,1,file+' has one title');assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,file+' has one H1');
 assert.ok(html.includes('<html lang="es-PA">'),file+' locale');assert.ok(!/<!--(?:APP_|SEO_HEAD)/.test(html),file+' has no placeholders');
 assert.equal((html.match(/name="description"/g)||[]).length,1,file+' has one description');assert.equal((html.match(/rel="canonical"/g)||[]).length,1,file+' has one canonical');assert.ok(html.includes('href="'+meta.url+'"'),file+' canonical');
 const script=html.match(/<script data-seo type="application\/ld\+json">([\s\S]*?)<\/script>/);
 if(indexablePaths.includes(path)){
  assert.ok(!titles.has(meta.title),'Unique title: '+path);titles.add(meta.title);assert.ok(!descriptions.has(meta.description),'Unique description: '+path);descriptions.add(meta.description);
  assert.ok(meta.title.length>=20&&meta.title.length<=75,path+' title length');assert.ok(meta.description.length>=80&&meta.description.length<=185,path+' description length');
  assert.ok(script,path+' structured data');const graph=JSON.parse(script[1])['@graph'];assert.ok(graph.some(n=>n['@type']==='Organization'));assert.ok(!JSON.stringify(graph).includes('aggregateRating'));
  if(meta.service){assert.ok(graph.some(n=>n['@type']==='Service'));assert.ok(html.includes(meta.service.name+' en Panamá'));for(const [question,answer] of meta.questions){assert.ok(html.includes(question));assert.ok(html.includes(answer));}}
 }else{assert.ok(html.includes('name="robots" content="noindex, follow"'));assert.equal(script,null);}
 for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^"\s]*"/g)){
  const local=match[1];if(local.startsWith('//'))continue;const clean=local.replace(/\/$/,'')||'/';
  if(staticPaths.includes(clean))continue;
  await assert.doesNotReject(async()=>{const details=await stat(join('dist',clean));assert.ok(details.isFile());},file+' local resource '+local);
 }
}
const xml=await readFile('dist/sitemap.xml','utf8'),urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,indexablePaths.length);assert.equal(new Set(urls).size,urls.length);
for(const path of indexablePaths)assert.ok(urls.includes(site.origin+(path==='/'?'/':path)));
for(const path of ['/admin','/admin/demo','/seguimiento','/checkout','/soporte','/resenas'])assert.ok(!urls.includes(site.origin+path));
const robots=await readFile('dist/robots.txt','utf8');assert.ok(robots.includes('Sitemap: '+site.origin+'/sitemap.xml'));assert.ok(robots.includes('Disallow: /api/'));
const config=JSON.parse(await readFile('vercel.json','utf8'));assert.equal(config.cleanUrls,true);assert.equal(config.trailingSlash,false);assert.deepEqual(config.rewrites,indexablePaths.map(path=>({source:path,destination:'/api/site?route='+encodeURIComponent(path)})));
console.log(`SEO audit passed: ${indexablePaths.length} unique indexable pages, ${staticPaths.length+1} HTML documents, valid JSON-LD, canonical URLs, local links/assets, sitemap exclusions and clean static routes.`);
