import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {renderHome} from '../src/home.js';
import {renderPage} from '../src/pages.js';
import {promotionBanner} from '../src/commercial.js';
import {navigationHtml,footerDirectoryHtml} from '../src/site-layout.js';
import {staticPaths,indexablePaths,seoHead,breadcrumbHtml,site} from '../src/seo.js';
const destination='dist',template=await readFile(join(destination,'index.html'),'utf8');
await mkdir('server/generated',{recursive:true});await writeFile('server/generated/site-template.html',template);
for(const marker of ['SEO_HEAD','APP_NAV','APP_MAIN','APP_FOOTER','APP_BANNER'])if(!template.includes('<!--'+marker+'-->'))throw Error('Missing HTML marker: '+marker);
for(const path of [...staticPaths,'/404']){
 const content=path==='/'?renderHome():breadcrumbHtml(path)+renderPage(path).html;
 const banner=promotionBanner();
 let html=template.replace('<!--SEO_HEAD-->',seoHead(path)).replace('<!--APP_NAV-->',navigationHtml()).replace('<!--APP_MAIN-->',content).replace('<!--APP_FOOTER-->',footerDirectoryHtml()).replace('<!--APP_BANNER-->',banner);
 html=html.replace('<main id="main-content">',`<main id="main-content"${path==='/'?'':' class="inner-page section"'}>`);
 if(banner)html=html.replace('<body id="top">','<body id="top" class="has-promotion">');
 const file=join(destination,path==='/'?'index.html':path.slice(1)+'.html');await mkdir(dirname(file),{recursive:true});await writeFile(file,html);
}
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+indexablePaths.map(path=>'  <url><loc>'+site.origin+(path==='/'?'/':path)+'</loc></url>').join('\n')+'\n</urlset>\n';
await writeFile(join(destination,'sitemap.xml'),sitemap);
await writeFile(join(destination,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: '+site.origin+'/sitemap.xml\n');
console.log(`Generated ${staticPaths.length+1} complete HTML documents and a sitemap with ${indexablePaths.length} public URLs.`);
