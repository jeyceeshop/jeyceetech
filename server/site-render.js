import {publicContentSnapshot} from '../src/content-schema.js';
import {renderHome} from '../src/home.js';
import {renderPage} from '../src/pages.js';
import {promotionBanner} from '../src/commercial.js';
import {navigationHtml,footerDirectoryHtml} from '../src/site-layout.js';
import {seoHead,breadcrumbHtml} from '../src/seo.js';
import {applyContent} from '../src/content.js';
export function renderSite(template,path,snapshot){
 applyContent(snapshot);const banner=promotionBanner();
 let html=template.replace('<!--SEO_HEAD-->',()=>seoHead(path)).replace('<!--APP_NAV-->',()=>navigationHtml()).replace('<!--APP_MAIN-->',()=>path==='/'?renderHome():breadcrumbHtml(path)+renderPage(path).html).replace('<!--APP_FOOTER-->',()=>footerDirectoryHtml()).replace('<!--APP_BANNER-->',()=>banner);
 html=html.replace('<main id="main-content">',`<main id="main-content"${path==='/'?'':' class="inner-page section"'}>`);
 if(banner)html=html.replace('<body id="top">','<body id="top" class="has-promotion">');
 const data=JSON.stringify(publicContentSnapshot(snapshot)).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');return html.replace('</head>',()=>`<script id="published-content" type="application/json">${data}</script></head>`);
}
