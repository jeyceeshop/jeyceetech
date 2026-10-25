import {issueChallenge} from '../server/antispam.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/reviews.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};}
const request=(body)=>({method:'POST',headers:{'content-type':'application/json'},body});
test('reviews API: availability, validation, moderated writes and approved reads',async()=>{
 const oldURL=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY,oldFetch=globalThis.fetch;
 try{
 delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 let res=response();await handler({method:'GET'},res);assert.equal(res.code,503);assert.equal(res.data.configured,false);
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only-placeholder';
 let called=0;globalThis.fetch=async()=>{called++;throw Error('must not fetch invalid submissions');};
 for(const body of [{author:'A',text:'An actual review',rating:6,consent:true},{author:'A',text:'Too short',rating:5,consent:true},{author:'A',text:'An actual review',rating:5,consent:false},{author:'A',text:'An actual review',rating:5,consent:true,website:'spam'}]){res=response();await handler(request(body),res);assert.equal(res.code,400);}
 const validFields={author:'Cliente',text:'Una opinión válida sin trampa.',rating:5,consent:true};
 res=response();await handler(request(validFields),res);assert.equal(res.code,400);
 const wrong=issueChallenge(process.env.SUPABASE_SERVICE_ROLE_KEY);
 res=response();await handler(request({...validFields,antispam:{token:wrong.token,answer:'99'}}),res);assert.equal(res.code,400);
 assert.equal(called,0);
 globalThis.fetch=async(url,options)=>{called++;assert.equal(options.method,'POST');const body=JSON.parse(options.body);assert.equal(body.status,'pending');assert.equal(body.rating,1);assert.equal(body.author,'Cliente');return {ok:true};};
 const c=issueChallenge(process.env.SUPABASE_SERVICE_ROLE_KEY);const antispam={token:c.token,answer:String(c.operation==='subtract'?c.a-c.b:c.a+c.b)};
 res=response();await handler(request({antispam,author:' Cliente ',text:'Una opinión crítica y válida.',rating:1,consent:true}),res);assert.equal(res.code,201);assert.equal(res.data.status,'pending');
 globalThis.fetch=async(url)=>{assert.ok(url.includes('status=eq.approved'));assert.ok(!url.includes('service_role'));return {ok:true,json:async()=>[{id:'1',author:'Cliente',text:'Experiencia real',rating:4}]};};
 res=response();await handler({method:'GET'},res);assert.equal(res.code,200);assert.equal(res.data.reviews.length,1);assert.ok(res.data.challenge.token);assert.ok(!JSON.stringify(res.data).includes('test-only-placeholder'));
 globalThis.fetch=async()=>{throw Error('private upstream credentials and error');};res=response();await handler({method:'GET'},res);assert.equal(res.code,502);assert.ok(!JSON.stringify(res.data).includes('credentials'));
 res=response();await handler({method:'DELETE'},res);assert.equal(res.code,405);
 }finally{globalThis.fetch=oldFetch;if(oldURL===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldURL;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
});
