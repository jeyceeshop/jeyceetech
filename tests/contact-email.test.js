import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import {buildContactEmail} from '../server/contact-email.js';
const fields={topic:{title:'Cotización gratis',email:'business@jeycee.shop'},name:'Cliente & Empresa',email:'cliente+proyecto@example.com',company:'Marca <premium>',service:'Desarrollo web',projectRef:'WEB-01',message:'Primera línea\nSegunda línea: <script>alert("no")</script> & detalles.'};
test('email has escaped content, consistent reply links, reference and embedded logo without remote tracking',()=>{
 const content=buildContactEmail(fields,'JC-TEST1234',{now:new Date('2026-11-01T02:00:00Z')});
 for(const text of ['JC-TEST1234','Desarrollo web','Cliente &amp; Empresa','Marca &lt;premium&gt;','&lt;script&gt;','Primera línea<br>Segunda línea'])assert.ok(content.html.includes(text));
 assert.ok(!content.html.includes('<script>'));assert.ok(content.html.includes('31 de octubre de 2026'));assert.ok(content.html.includes('Hora de Panamá'));
 assert.ok(content.text.includes(fields.message));assert.ok(content.text.includes('JC-TEST1234'));
 const hrefs=[...content.html.matchAll(/href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
 for(const href of hrefs){assert.ok(href.startsWith('mailto:'));assert.equal(decodeURIComponent(new URL(href).pathname),fields.email);}
 assert.equal(content.attachments[0].cid,'jeycee-contact-mark');assert.equal(content.attachments[0].contentType,'image/png');assert.equal(content.attachments[0].content.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.ok(content.html.includes('src="cid:jeycee-contact-mark"'));assert.ok(!/src="https?:/i.test(content.html));
});
test('SMTP message contains HTML and plain-text alternatives with an inline PNG MIME part',async()=>{
 const transport=nodemailer.createTransport({streamTransport:true,buffer:true,newline:'unix'});
 const info=await transport.sendMail({from:'hello@jeycee.shop',to:fields.topic.email,replyTo:fields.email,subject:'Prueba local del diseño',...buildContactEmail(fields,'JC-MIME1234'),disableFileAccess:true,disableUrlAccess:true});
 const source=info.message.toString();assert.match(source,/multipart\/related/);assert.match(source,/multipart\/alternative/);assert.match(source,/Content-Type: text\/plain/);assert.match(source,/Content-Type: text\/html/);assert.match(source,/Content-ID: <jeycee-contact-mark>/);assert.match(source,/Content-Type: image\/png/);assert.ok(source.includes('Reply-To: cliente+proyecto@example.com'));
});
