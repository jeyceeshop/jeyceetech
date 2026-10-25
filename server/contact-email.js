import {emailLogoBase64} from './email-logo.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildContactEmail(fields,reference,{now=new Date(),kind='contact'}={}){
 const isOrder=kind==='order',isUpdate=kind==='update';
 const date=new Intl.DateTimeFormat('es-PA',{timeZone:'America/Panama',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
 const emailLink='mailto:'+encodeURIComponent(fields.email);
 const replyLink=emailLink+'?subject='+encodeURIComponent(`Re: [${reference}] ${fields.topic.title} — Jey Cee`);
 const rows=[['Nombre',fields.name],['Correo',fields.email||'No indicado'],...(fields.phone?[['Teléfono de contacto',fields.phone]]:[]),['Empresa',fields.company||'No indicada'],['Servicio de interés',fields.service],['Referencia del proyecto',fields.projectRef||'No indicada']];
 let trackingUrl='';try{const url=new URL(fields.trackingUrl);if(url.protocol==='https:'&&url.pathname==='/seguimiento'&&!url.username&&!url.password)trackingUrl=url.href;}catch{}
 const html=`<!doctype html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${isOrder?'Nuevo pedido':isUpdate?'Seguimiento de tu solicitud':'Nueva consulta'} · Jey Cee</title></head>
<body style="margin:0;padding:0;background-color:#eee7e0;font-family:Arial,Helvetica,sans-serif;color:#33251b;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;color:#eee7e0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escape(fields.name)} · ${escape(fields.topic.title)} · Referencia ${escape(reference)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#eee7e0" style="background-color:#eee7e0;"><tr><td align="center" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:640px;background-color:#fffdf9;border-collapse:separate;border-spacing:0;border-radius:12px;overflow:hidden;">
<tr><td bgcolor="#171412" style="padding:28px 28px;background-color:#171412;border-top:5px solid #f6bd9c;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="52" valign="middle"><img src="cid:jeycee-contact-mark" width="38" height="43" alt="" style="display:block;border:0;background-color:#f6bd9c;padding:7px;border-radius:4px;"></td><td valign="middle" style="padding-left:15px;"><span style="font-size:20px;font-weight:bold;letter-spacing:4px;color:#fff4ea;">JEY CEE</span><br><span style="font-size:9px;line-height:22px;letter-spacing:2px;color:#caa68b;">CREATIVIDAD CON DIRECCIÓN</span></td></tr></table>
</td></tr>
<tr><td bgcolor="#f6bd9c" style="padding:30px 28px;background-color:#f6bd9c;">
<p style="font-size:10px;line-height:16px;font-weight:bold;letter-spacing:1.6px;margin:0 0 15px;color:#5b3923;">${isOrder?'NUEVO PEDIDO':isUpdate?'SEGUIMIENTO':'NUEVO MENSAJE'} / ${escape(fields.topic.title.toUpperCase())}</p>
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:40px;font-weight:normal;letter-spacing:-1px;margin:0 0 14px;color:#2c1b10;">${isOrder?'Un nuevo<br>pedido.':isUpdate?'Tu proyecto.<br>Cada paso, más cerca.':'Una nueva<br>conversación.'}</h1>
<p style="font-size:14px;line-height:23px;margin:0;color:#65442d;">${isUpdate?'El equipo de Jey Cee comparte una actualización de tu solicitud.':escape(fields.name)+(isOrder?' ha solicitado un servicio de Jey Cee.':' se ha puesto en contacto con el equipo de Jey Cee.')}</p>
</td></tr>
<tr><td style="padding:25px 28px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f5eee7" style="background-color:#f5eee7;border:1px solid #e0cdbd;border-radius:6px;"><tr><td style="padding:16px 18px;"><p style="font-size:9px;font-weight:bold;letter-spacing:1.5px;margin:0 0 7px;color:#88654b;">${isOrder?'NÚMERO DE PEDIDO':'REFERENCIA DE LA CONSULTA'}</p><p style="font-size:19px;line-height:26px;font-weight:bold;letter-spacing:1px;margin:0 0 6px;color:#352316;">${escape(reference)}</p><p style="font-size:11px;line-height:18px;margin:0;color:#87684f;">${escape(date)} · Hora de Panamá</p></td></tr></table>
</td></tr>
<tr><td style="padding:28px 28px 0;"><h2 style="font-size:17px;line-height:24px;font-weight:bold;margin:0 0 15px;color:#342217;">${isUpdate?'Tu equipo de atención':'Datos del contacto'}</h2>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;table-layout:fixed;">${rows.map(([label,value])=>`<tr><td width="36%" valign="top" style="padding:12px 10px 12px 0;font-size:11px;line-height:20px;color:#96745a;border-bottom:1px solid #ecdfd3;">${label}</td><td width="64%" valign="top" style="padding:12px 0;font-size:13px;line-height:20px;color:#38271b;border-bottom:1px solid #ecdfd3;word-wrap:break-word;overflow-wrap:anywhere;">${label==='Correo'&&fields.email?`<a href="${escape(emailLink)}" style="color:#8e4d25;text-decoration:underline;word-break:break-all;">${escape(value)}</a>`:escape(value)}</td></tr>`).join('')}</table>
</td></tr>
<tr><td style="padding:28px 28px 0;"><h2 style="font-size:17px;line-height:24px;margin:0 0 15px;color:#342217;">${isUpdate?'Tu actualización':'Lo que nos cuenta'}</h2>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f7f1ea" style="table-layout:fixed;background-color:#f7f1ea;border-left:3px solid #db9465;"><tr><td style="padding:20px;font-size:14px;line-height:25px;color:#59412f;word-wrap:break-word;overflow-wrap:anywhere;">${escape(fields.message).replace(/\r\n?|\n/g,'<br>')}</td></tr></table>
</td></tr>
<tr><td style="padding:28px;">
${trackingUrl?`<p style="margin:0 0 20px;"><a href="${escape(trackingUrl)}" style="display:inline-block;padding:16px 25px;background-color:#302116;border-radius:5px;color:#fbd0b4;font-size:13px;font-weight:bold;text-decoration:none;">Ver seguimiento &rarr;</a></p>`:''}
${fields.email?`<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#302116" style="border-radius:5px;background-color:#302116;text-align:center;"><a href="${escape(replyLink)}" style="display:inline-block;padding:16px 25px;font-size:13px;font-weight:bold;line-height:20px;color:#fbd0b4;text-decoration:none;">${isUpdate?'Responder al equipo':'Responder al cliente'} &rarr;</a></td></tr></table>
<p style="font-size:11px;line-height:19px;color:#8a6a51;margin:16px 0 0;">También puedes utilizar <strong>Responder</strong> en tu correo: la respuesta se dirigirá a ${escape(fields.email)}.</p>
`:'<p style="font-size:12px;line-height:21px;color:#8a6a51;margin:0;">El cliente no indicó correo. Podrás continuar con el número de pedido cuando escriba por WhatsApp.</p>'}
</td></tr>
<tr><td bgcolor="#f0e5da" style="padding:20px 28px;background-color:#f0e5da;border-top:1px solid #dfcdbb;">
<p style="font-size:10px;font-weight:bold;letter-spacing:1.2px;line-height:18px;color:#77543a;margin:0 0 7px;">JEY CEE / ${isOrder?'PEDIDOS':isUpdate?'SEGUIMIENTO':'CONTACTO'} DESDE LA WEB</p>
<p style="font-size:10px;line-height:18px;color:#92745c;margin:0;">Área destinataria: ${escape(fields.topic.email)}<br>Mensaje del formulario con consentimiento y verificación antispam. Esta referencia no es factura ni comprobante de pago.</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="font-size:10px;line-height:18px;color:#9d826e;margin:20px 0 0;">Información para la atención de esta consulta por el equipo de Jey Cee.</p>
</td></tr></table></body></html>`;
 const text=`${isOrder?'PEDIDO':isUpdate?'SEGUIMIENTO':'CONTACTO'} — JEY CEE\nReferencia: ${reference}\nFecha: ${date} (hora de Panamá)\nÁrea: ${fields.topic.title}\nDestinatario: ${fields.topic.email}\n\n${rows.map(([label,value])=>label+': '+value).join('\n')}\n\nMENSAJE\n${fields.message}\n\nCorreo de respuesta: ${fields.email||'No indicado; continuar por WhatsApp'}\nEnviado desde el formulario de contacto con consentimiento y verificación antispam. No es factura ni comprobante de pago.`;
 return {html,text,attachments:[{filename:'jey-cee.png',content:Buffer.from(emailLogoBase64,'base64'),contentType:'image/png',cid:'jeycee-contact-mark',contentDisposition:'inline'}]};
}
