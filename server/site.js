import {readFile} from 'node:fs/promises';
import {indexablePaths} from '../src/seo.js';
import {publishedContent} from './content.js';
import {renderSite} from './site-render.js';
let templatePromise;
export function makeSiteHandler({env=process.env,store,template}={}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
 const path=String(req.query?.route||'/');if(!['GET','HEAD'].includes(req.method)||!indexablePaths.includes(path)){res.setHeader('X-Robots-Tag','noindex');return res.status(404).send('Página no encontrada.');}
 try{const snapshot=await publishedContent({env,store}),source=template||await(templatePromise??=readFile(new URL('./generated/site-template.html',import.meta.url),'utf8'));const html=renderSite(source,path,snapshot);return res.status(200).send(req.method==='HEAD'?'':html);}
 catch{res.setHeader('Retry-After','30');return res.status(503).send('<!doctype html><html lang="es"><title>Jey Cee · Volvemos enseguida</title><h1>Estamos actualizando la información.</h1><p>Inténtalo de nuevo en un momento o contáctanos al WhatsApp <a href="https://wa.me/50760913544">+507 6091-3544</a>.</p></html>');}
};}
