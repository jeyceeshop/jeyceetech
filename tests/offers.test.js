import test from 'node:test';
import assert from 'node:assert/strict';
import {promotionActive,applyPromotion,advisoryBalance} from '../src/offers.js';
import {offerFor,money} from '../src/pricing.js';
test('promotion is valid through November 30 Panama time and expires exactly at midnight',()=>{
 const last='2026-11-30T23:59:59.999-05:00',expired='2026-12-01T00:00:00-05:00';
 assert.equal(promotionActive(last),true);assert.equal(promotionActive(expired),false);
 assert.deepEqual(applyPromotion(65,'diseno-grafico',last),{base:65,price:58.5,percent:10,savings:6.5});
 assert.deepEqual(applyPromotion(65,'diseno-grafico',expired),{base:65,price:65,percent:0,savings:0});
 assert.equal(offerFor('desarrollo-web','basico',last).price,261);
 assert.equal(offerFor('desarrollo-web','pro',last).price,531);
 assert.equal(offerFor('desarrollo-web','vip',last).price,981);
 assert.equal(offerFor('diseno-grafico','pro',last).price,130.5);
 assert.equal(offerFor('diseno-grafico','vip',last).price,256.5);
 assert.equal(offerFor('redes-sociales','pro',last).price,199);
 assert.equal(offerFor('diseno-web','basico',last).price,120);
 assert.equal(offerFor('desarrollo-web','business',last).price,null);
 assert.equal(offerFor('desarrollo-web','business',last).percent,10);
 assert.equal(offerFor('desarrollo-web','business',expired).percent,0);
 assert.ok(money(58.5).includes('58.50'));
});
test('advisory credit is derived once, after promotion, never marks payment as verified',()=>{
 assert.deepEqual(advisoryBalance(58.5),{credit:0,balance:58.5});
 assert.deepEqual(advisoryBalance(58.5,true),{credit:20,balance:38.5});
 assert.deepEqual(advisoryBalance(261,true),{credit:20,balance:241});
 assert.deepEqual(advisoryBalance(199,true),{credit:20,balance:179});
 assert.deepEqual(advisoryBalance(null,true),{credit:0,balance:null});
 assert.deepEqual(advisoryBalance(10,true),{credit:10,balance:0});
});
