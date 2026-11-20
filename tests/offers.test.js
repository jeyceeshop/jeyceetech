import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPromotion,advisoryBalance} from '../src/offers.js';
import {offerFor,money,pricing} from '../src/pricing.js';
test('launch pricing discounts every regular catalog price once and leaves Business open for a quote',()=>{
 for(const [slug,plans] of Object.entries(pricing)){
  for(const [tier,base] of Object.entries(plans)){
   const price=base===null?null:Math.round(base*90)/100;
   assert.deepEqual(offerFor(slug,tier),{
    base,price,percent:10,savings:base===null?null:Math.round((base-price)*100)/100
   });
  }
 }
 assert.deepEqual(applyPromotion(65),{base:65,price:58.5,percent:10,savings:6.5});
 assert.deepEqual(applyPromotion(0.35),{base:0.35,price:0.32,percent:10,savings:0.03});
 assert.equal(offerFor('redes-sociales','pro').price,179.1);
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
