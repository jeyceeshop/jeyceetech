import test from 'node:test';
import assert from 'node:assert/strict';
import {createMathChallenge,validMathAnswer} from '../src/antispam.js';
import {issueChallenge,verifyChallenge,claimChallenge} from '../server/antispam.js';
test('math validation rejects blank, non-numeric and incorrect answers, including zero edge cases',()=>{
 const zero={a:5,b:5,operation:'subtract'};assert.equal(validMathAnswer(zero,'0'),true);for(const value of ['',null,' ','1','-1','abc'])assert.equal(validMathAnswer(zero,value),false);
 assert.equal(validMathAnswer({a:5,b:2,operation:'subtract'},'3'),true);
 assert.equal(validMathAnswer({a:9,b:9,operation:'add'},'18'),true);
 const c=createMathChallenge();assert.ok(c.a>=3&&c.a<=9&&c.b>=1&&c.b<=c.a);assert.equal(validMathAnswer(c,String(c.operation==='subtract'?c.a-c.b:c.a+c.b)),true);
});
test('server proof rejects missing, tampered, expired and replayed challenges',()=>{
 const secret='test-only-secret',now=Date.now();const c=issueChallenge(secret,now);const answer=String(c.operation==='subtract'?c.a-c.b:c.a+c.b);const value={token:c.token,answer};
 const proof=verifyChallenge(value,secret,now);assert.ok(proof);
 assert.equal(verifyChallenge(undefined,secret,now),null);
 assert.equal(verifyChallenge({...value,answer:'99'},secret,now),null);
 assert.equal(verifyChallenge({...value,token:value.token+'x'},secret,now),null);
 assert.equal(verifyChallenge(value,'different-secret',now),null);
 assert.equal(verifyChallenge(value,secret,now+600000),null);
 assert.ok(verifyChallenge(value,secret,now+599999));
 assert.equal(claimChallenge(proof,now),true);assert.equal(claimChallenge(proof,now),false);
 assert.equal(claimChallenge(proof,now+600000),false);
});
