import {projects,projectForPath,projectPath} from './portfolio.js';
import {managedContent} from './content-state.js';
import {services} from './catalog.js';
import {officialInstagram} from './social.js';
import {serviceSeo} from './service-seo.js';
import {guides} from './resources.js';
export const site={origin:'https://www.jeycee.shop',name:'Jey Cee',phone:'+507 6091-3544',email:'business@jeycee.shop',image:'/social-preview.jpg'};
const pages={
 '/portafolio':{title:'Portafolio de diseño web y branding en Panamá | Jey Cee',description:'Explora conceptos de diseño web, branding, packaging y experiencias digitales de Jey Cee. Cuatro marcas ficticias con objetivos, propuesta visual y resultados del concepto.',label:'Portafolio',type:'CollectionPage'},
 '/':{title:'Agencia digital en Panamá: diseño y desarrollo web | Jey Cee',description:'Jey Cee: agencia digital en Panamá de diseño gráfico, desarrollo web, branding y marketing. Planes por servicio y cotización gratis para tu negocio.',label:'Inicio'},
 '/servicios':{title:'Servicios de agencia digital en Panamá | Jey Cee',description:'Explora 21 servicios de diseño, desarrollo web y marketing digital en Panamá. Compara alcances, revisa planes y solicita una cotización gratuita.',label:'Servicios',type:'CollectionPage'},
 '/planes':{title:'Planes de diseño, web y marketing en Panamá | Jey Cee',description:'Compara planes Básico, Pro, VIP y Business por servicio. Precios base en USD, alcances claros y cotización gratis para tu negocio en Panamá.',label:'Planes premium'},
 '/quienes-somos':{title:'Jey Cee: agencia digital en Panamá y su fundador',description:'Conoce Jey Cee y a su fundador Julian Cueto. Estrategia, diseño, tecnología y datos para negocios en Panamá. Nuestra historia, misión y visión.',label:'Quiénes somos',type:'AboutPage'},
 '/contacto':{title:'Contacta a Jey Cee en Panamá | Cotización gratis',description:'Cuéntanos tu proyecto de diseño, web o marketing en Panamá. Cotización gratis, asesoramiento opcional y atención por los canales oficiales de Jey Cee.',label:'Contáctanos',type:'ContactPage'},
 '/preguntas-frecuentes':{title:'Preguntas sobre diseño, web y marketing | Jey Cee Panamá',description:'Resuelve dudas sobre servicios, planes, revisiones, asesoramiento y pagos de Jey Cee en Panamá antes de solicitar tu proyecto.',label:'Preguntas frecuentes'},
 '/trabaja-con-nosotros':{title:'Trabaja con Jey Cee | Oportunidades en Panamá',description:'Consulta las vacantes y requisitos de Jey Cee para mercadeo y telemarketing. Conoce cómo aplicar al equipo por nuestro correo de talento.',label:'Trabaja con nosotros'},
 '/recursos':{title:'Guías de diseño, web y marketing para Panamá | Jey Cee',description:'Guías para emprendedores y pymes en Panamá: precios de páginas web, diseño, briefs y marketing digital. Prepara tu próximo proyecto con Jey Cee.',label:'Recursos',type:'CollectionPage'}
};
const privatePages={
 '/checkout':['Prepara el brief de tu servicio | Jey Cee','Describe tu proyecto y solicita una cotización por el WhatsApp oficial de Jey Cee.'],
 '/admin':['Administración privada | Jey Cee','Acceso privado del equipo de Jey Cee.'],
 '/admin/demo':['Demostración de administración | Jey Cee','Vista de ejemplo con datos ficticios; no contiene solicitudes reales.'],
 '/seguimiento':['Seguimiento de pedidos y tickets | Jey Cee','Consulta el estado y la conversación de tu solicitud.'],
 '/soporte':['Centro de ayuda y tickets | Jey Cee','Abre un ticket y conversa con el equipo desde la web.'],
 '/facturacion':['Consultas de pagos y facturación | Jey Cee','Información para gestionar consultas de pagos y facturación.'],
 '/resenas':['Opiniones y reseñas | Jey Cee','Comparte tu experiencia con el equipo.'],
 '/privacidad':['Política de privacidad | Jey Cee','Información sobre el tratamiento de datos y cómo ejercer tus derechos.'],
 '/terminos':['Condiciones de los servicios | Jey Cee','Condiciones de solicitudes, propuestas, pagos y entregas de Jey Cee.']
};
const guideTitles={
 'cuanto-cuesta-una-pagina-web-panama':'Precios de páginas web en Panamá | Guía Jey Cee',
 'diseno-web-o-desarrollo-web-panama':'Diseño o desarrollo web en Panamá: diferencias | Jey Cee',
 'como-preparar-brief-diseno-grafico':'Cómo preparar un brief de diseño gráfico | Jey Cee',
 'marketing-digital-para-pymes-panama':'Marketing digital para pymes en Panamá | Guía Jey Cee'
};
export const indexablePaths=[...Object.keys(pages),...services.map(s=>'/servicios/'+s.slug),...guides.map(g=>'/recursos/'+g.slug),...projects.map(projectPath)];
export const staticPaths=[...indexablePaths,...Object.keys(privatePages)];
const cleanPath=path=>('/'+String(path||'').split(/[?#]/)[0].replace(/^\/+|\/+$/g,'')).replace(/\/{2,}/g,'/');
export function seoFor(rawPath='/'){
 const path=cleanPath(rawPath),service=services.find(s=>path==='/servicios/'+s.slug),guide=guides.find(g=>path==='/recursos/'+g.slug),project=projectForPath(path);let data=pages[path];
 if(service){const local=serviceSeo[service.slug];data={title:managedContent?.services[service.slug].seoTitle||local.title,description:managedContent?.services[service.slug].seoDescription||local.description,questions:local.questions,label:service.name,service};}
 if(project)data={title:project.name+': proyecto conceptual de diseño | Jey Cee',description:project.seoDescription,label:project.name,project};
 if(guide)data={title:guideTitles[guide.slug],description:guide.description,label:guide.title,guide,type:'Article'};
 if(privatePages[path])data={title:privatePages[path][0],description:privatePages[path][1],label:privatePages[path][0].split(' | ')[0],noindex:true};
 const found=!!data;if(!found)data={title:'Página no encontrada | Jey Cee',description:'Este enlace no está disponible. Explora los servicios de Jey Cee en Panamá.',label:'Página no encontrada',noindex:true};
 return {...data,path,found,url:site.origin+(path==='/'?'/':path),robots:data.noindex?'noindex, follow':'index, follow, max-image-preview:large',image:site.origin+(project?'/portfolio/'+project.image+'.jpg':path==='/portafolio'?'/portfolio/marea.jpg':site.image),imageWidth:project||path==='/portafolio'?1536:1200,imageHeight:project||path==='/portafolio'?1024:675,imageAlt:project?.alt||(path==='/portafolio'?projects[0].alt:'Escultura abstracta de la identidad visual de Jey Cee')};
}
export function breadcrumbsFor(path){const meta=seoFor(path);if(meta.path==='/')return [];const list=[{name:'Inicio',path:'/'}];if(meta.service)list.push({name:'Servicios',path:'/servicios'});if(meta.project)list.push({name:'Portafolio',path:'/portafolio'});if(meta.guide)list.push({name:'Recursos',path:'/recursos'});list.push({name:meta.label,path:meta.path});return list;}
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function breadcrumbHtml(path){const crumbs=breadcrumbsFor(path);if(!crumbs.length||seoFor(path).noindex)return '';return `<nav class="seo-breadcrumbs" aria-label="Ruta de navegación"><ol>${crumbs.map((c,i)=>`<li>${i===crumbs.length-1?`<span aria-current="page">${escape(c.name)}</span>`:`<a href="${c.path}">${escape(c.name)}</a>`}</li>`).join('')}</ol></nav>`;}
export function structuredData(path){
 const meta=seoFor(path);if(meta.noindex)return null;
 const organizationId=site.origin+'/#organization',websiteId=site.origin+'/#website',pageId=meta.url+'#webpage';
 const organization={'@type':'Organization','@id':organizationId,name:site.name,url:site.origin+'/',sameAs:[officialInstagram.url],logo:site.origin+'/mark.svg',email:site.email,telephone:site.phone,areaServed:{'@type':'Country',name:'Panamá',identifier:'PA'},founder:{'@type':'Person',name:'Julian Cueto',url:site.origin+'/quienes-somos#fundador'},contactPoint:[{'@type':'ContactPoint',contactType:'sales',telephone:site.phone,email:site.email,availableLanguage:['es']},{'@type':'ContactPoint',contactType:'customer support',email:'support@jeycee.shop',url:site.origin+'/soporte',availableLanguage:['es']}]};
 const page={'@type':meta.type==='Article'?'WebPage':meta.type||'WebPage','@id':pageId,url:meta.url,name:meta.guide?.title||meta.title,description:meta.description,inLanguage:'es-PA',isPartOf:{'@id':websiteId},about:{'@id':organizationId}};
 const graph=[organization,{'@type':'WebSite','@id':websiteId,name:site.name,url:site.origin+'/',inLanguage:'es-PA',publisher:{'@id':organizationId}},page];
 const crumbs=breadcrumbsFor(path);if(crumbs.length)graph.push({'@type':'BreadcrumbList','@id':meta.url+'#breadcrumbs',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:site.origin+c.path}))});
 if(meta.service){graph.push({'@type':'Service','@id':meta.url+'#service',name:meta.service.name+' en Panamá',serviceType:meta.service.name,description:meta.description,url:meta.url,provider:{'@id':organizationId},areaServed:{'@type':'Country',name:'Panamá',identifier:'PA'},availableChannel:{'@type':'ServiceChannel',serviceUrl:site.origin+'/contacto'}});graph.push({'@type':'FAQPage','@id':meta.url+'#faq',isPartOf:{'@id':pageId},mainEntity:meta.questions.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});}
 if(meta.path==='/servicios')graph.push({'@type':'ItemList','@id':meta.url+'#catalog',name:'Servicios de Jey Cee en Panamá',itemListElement:services.map((s,i)=>({'@type':'ListItem',position:i+1,name:s.name,url:site.origin+'/servicios/'+s.slug}))});
 if(meta.path==='/portafolio')graph.push({'@type':'ItemList','@id':meta.url+'#projects',name:'Proyectos conceptuales de Jey Cee',description:'Colección de marcas ficticias y ejemplos de dirección creativa, sin resultados comerciales medidos.',itemListElement:projects.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name+' · Proyecto conceptual',url:site.origin+projectPath(p)}))});
 if(meta.project)graph.push({'@type':'CreativeWork','@id':meta.url+'#concept',name:meta.project.name+' · Proyecto conceptual',description:meta.description,creativeWorkStatus:'Conceptual',genre:'Ejemplo de diseño para una marca ficticia',inLanguage:'es-PA',creator:{'@id':organizationId},mainEntityOfPage:{'@id':pageId},image:meta.image});
 if(meta.guide)graph.push({'@type':'Article','@id':meta.url+'#article',headline:meta.guide.title,description:meta.description,inLanguage:'es-PA',mainEntityOfPage:{'@id':pageId},author:{'@id':organizationId},publisher:{'@id':organizationId},image:meta.image});
 return {'@context':'https://schema.org','@graph':graph};
}
export function seoHead(path){const meta=seoFor(path),graph=structuredData(path);return `<title data-seo>${escape(meta.title)}</title><meta data-seo name="description" content="${escape(meta.description)}"><meta data-seo name="robots" content="${meta.robots}"><link data-seo rel="canonical" href="${escape(meta.url)}"><meta data-seo property="og:locale" content="es_PA"><meta data-seo property="og:site_name" content="Jey Cee"><meta data-seo property="og:type" content="${meta.guide?'article':'website'}"><meta data-seo property="og:title" content="${escape(meta.title)}"><meta data-seo property="og:description" content="${escape(meta.description)}"><meta data-seo property="og:url" content="${escape(meta.url)}"><meta data-seo property="og:image" content="${meta.image}"><meta data-seo property="og:image:width" content="${meta.imageWidth}"><meta data-seo property="og:image:height" content="${meta.imageHeight}"><meta data-seo property="og:image:alt" content="${escape(meta.imageAlt)}"><meta data-seo name="twitter:card" content="summary_large_image"><meta data-seo name="twitter:title" content="${escape(meta.title)}"><meta data-seo name="twitter:description" content="${escape(meta.description)}"><meta data-seo name="twitter:image" content="${meta.image}">${graph?'<script data-seo type="application/ld+json">'+JSON.stringify(graph).replace(/</g,'\\u003c')+'</script>':''}${meta.path==='/'?'<link data-seo rel="preload" as="image" href="/hero-sculpture.webp" fetchpriority="high">':''}`;}
export function applySeo(path){document.head.querySelectorAll('[data-seo]').forEach(node=>node.remove());document.head.insertAdjacentHTML('beforeend',seoHead(path));document.documentElement.lang='es-PA';}
