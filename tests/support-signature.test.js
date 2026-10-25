import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAdminHandler} from '../server/admin.js';
import {sessionValue} from '../server/admin-auth.js';
const env={PORTAL_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-server-only',ADMIN_PASSWORD:'long-admin-test-password',ADMIN_SESSION_SECRET:'admin-session-test-value-with-32-characters'};
const headers={host:'jeycee.test',origin:'https://jeycee.test','content-type':'application/json'};
const req=(method='GET',body={},action='session',auth=false)=>({method,body,headers:{...headers,...(auth?{cookie:'jeycee_admin='+sessionValue(env)}:{})},query:{action}});
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
test('signed agent names and roles are required for public replies',async()=>{
 const db={},handler=makeAdminHandler({env,store:db});let res;
 const r=req('POST',{version:1,message:'Hola, revisamos tu solicitud.'},'reply',true);r.query.reference='JC-0001';res=response();await handler(r,res);assert.equal(res.code,400);assert.match(res.data.error,/nombre y cargo/);
 let captured;db.action=async(ref,version,action,payload)=>{captured=payload;return {reference:ref,name:'Cliente',status:'in_progress',email:'',version:2};};r.body.staffName='Ana Pérez';r.body.staffRole='Especialista de soporte';res=response();await handler(r,res);assert.equal(res.code,200);assert.equal(captured.staffName,'Ana Pérez');assert.equal(captured.staffRole,'Especialista de soporte');
});
