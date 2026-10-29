import assert from 'node:assert/strict';
import {moneyModuleUrl} from './data-test-modules.mjs';
const {calculateDocument,calculateBillingDocument,consolidateCalculations,allocateAdvance,applyAdvanceApplications,reconcileFinalCalculation,reconcileCumulativeQuantityCalculation}=await import(moneyModuleUrl);
const a=calculateDocument([{quantity:3,unit_price:'100.01',vat_rate:'8.1',discount:{kind:'percent',value:10}}],'CHF',{kind:'percent',value:5});
const b=calculateDocument([{quantity:63,unit_price:'800',price_base_quantity:480,vat_rate:'2.6'}],'CHF',{kind:'fixed',value:'1.23',currency:'CHF'});
const combined=consolidateCalculations([{id:'agreement-a',positions:[2],calculation:a},{id:'agreement-b',positions:[1],calculation:b}],'CHF');
assert.equal(combined.subtotal,'360.30');assert.equal(combined.vat,'23.48');assert.equal(combined.total,'383.78');
assert.deepEqual(combined.lines.map(l=>l.billing_agreement_id),['agreement-b','agreement-a']);
assert.equal(combined.billingScopes[0].calculation,a,'Original canonical agreement calculation is retained');
assert.equal(combined.billingScopes[1].calculation,b);
assert.throws(()=>consolidateCalculations([{id:'a',positions:[1],calculation:a},{id:'b',positions:[1],calculation:b}],'CHF'));
assert.throws(()=>consolidateCalculations([{id:'a',positions:[1],calculation:a}],'EUR'));
console.log('Consolidated canonical calculations: independent price bases, negotiated line/header discounts, mixed VAT, stable positions, currency and duplicate-position denials passed.');

const advance=calculateDocument([{quantity:1,unit_price:100,vat_rate:8.1}],'CHF');
const prior=[];
for(const value of ['0.01','0.02','20.00','88.07'])prior.push(allocateAdvance(advance,value,prior));
assert.equal(prior.flat().reduce((n,g)=>n+Math.round(Number(g.net)*100),0),10000);
assert.equal(prior.flat().reduce((n,g)=>n+Math.round(Number(g.tax)*100),0),810);
assert.throws(()=>allocateAdvance(advance,'0.01',prior));
const application={advanceInvoiceId:'source',agreementId:'agreement-a',amount:'108.10',taxGroups:allocateAdvance(advance,'108.10')};
assert.equal(applyAdvanceApplications(advance,[application]).total,'0.00');
assert.throws(()=>applyAdvanceApplications(advance,[application,application]));
assert.throws(()=>applyAdvanceApplications(calculateDocument([{quantity:1,unit_price:200,vat_rate:2.6}],'CHF'),[application]));
assert.equal(advance.total,'108.10','Historical receivable is never changed');
console.log('Advance allocation: cumulative VAT cents, variable partial amounts, exact exhaustion, duplicate/overapplication and mismatched-tax denial, zero final and immutable history passed.');

const originalThirds=calculateDocument([{quantity:1,unit_price:'100.01',vat_rate:'8.1'}],'CHF');
const third=calculateDocument([{quantity:'0.33',unit_price:'100.01',vat_rate:'8.1'}],'CHF');
const lastThird=calculateDocument([{quantity:'0.34',unit_price:'100.01',vat_rate:'8.1'}],'CHF');
const reconciled=reconcileFinalCalculation(lastThird,originalThirds,[1],[{calculation:third,sourcePositions:[1]},{calculation:third,sourcePositions:[1]}]);
assert.equal(reconciled.total,'36.77');assert.deepEqual(reconciled.settlementAdjustment,{net:'0.01',tax:'0.01'});
assert.equal(Math.round(Number(third.total)*200)+Math.round(Number(reconciled.total)*100),10811);
assert.throws(()=>reconcileFinalCalculation(calculateDocument([{quantity:1,unit_price:1,vat_rate:8.1}],'CHF'),originalThirds,[1],[]));
console.log('Final cumulative rounding: immutable agreed cents minus actual prior net/VAT, explicit bounded residuals, exact final total and non-rounding price mismatch denial passed.');

const splitFinal=reconcileFinalCalculation(calculateDocument([{quantity:'0.17',unit_price:'100.01',vat_rate:8.1},{quantity:'0.17',unit_price:'100.01',vat_rate:8.1}],'CHF'),originalThirds,[1,1],[{calculation:third,sourcePositions:[1]},{calculation:third,sourcePositions:[1]}]);assert.equal(splitFinal.total,'36.77');assert.deepEqual(splitFinal.lines.map(l=>l.net),['17.01','17.00']);
const advancedThird=reconcileCumulativeQuantityCalculation(third,[{quantity:1,unit_price:'100.01',vat_rate:8.1}],originalThirds,[1],['0.33'],[{calculation:third,sourcePositions:[1],quantities:['0.33']}]);assert.equal(advancedThird.total,'35.69');assert.deepEqual(advancedThird.settlementAdjustment,{net:'0.01',tax:'0.01',kind:'cumulative'});
const correctedLast=reconcileFinalCalculation(lastThird,originalThirds,[1],[{calculation:third,sourcePositions:[1]},{calculation:advancedThird,sourcePositions:[1]}]);assert.equal(correctedLast.total,'36.75');
console.log('Cumulative partials and split source positions: deterministic shared-cent allocation, unchanged prices, historical rounding carry and exact original final net/VAT passed.');

const orderedQuote=calculateDocument([{quantity:1,unit_price:100,vat_rate:0},{quantity:1,unit_price:100,vat_rate:0}],'CHF',{kind:'fixed',value:'0.01',currency:'CHF'});
const reorderedInvoice=calculateBillingDocument([{quantity:1,unit_price:100,vat_rate:0,billing_source_position:2},{quantity:1,unit_price:100,vat_rate:0,billing_source_position:1}],'CHF',{kind:'fixed',value:'0.01',currency:'CHF'});
assert.deepEqual(reorderedInvoice.lines.map(l=>l.documentDiscountDisplay),[orderedQuote.lines[1].documentDiscountDisplay,orderedQuote.lines[0].documentDiscountDisplay],'Invoice drag order must not reassign the negotiated discount cent to another source');

// Historical independent rounding must not disappear when a completed source row
// is omitted from the final invoice of another VAT group.
const historicalMixedAgreed=calculateDocument([{quantity:1,unit_price:'100.01',vat_rate:8.1},{quantity:1,unit_price:100,vat_rate:2.6}],'CHF');
const historicalMixedPrior=['0.33','0.33','0.34'].map(quantity=>({calculation:calculateDocument([{quantity,unit_price:'100.01',vat_rate:8.1}],'CHF'),sourcePositions:[1]}));
assert.throws(()=>reconcileFinalCalculation(calculateDocument([{quantity:1,unit_price:100,vat_rate:2.6}],'CHF'),historicalMixedAgreed,[2],historicalMixedPrior),/Angebotsposition/,'A completed historical source with residual net/VAT cents cannot silently disappear');
const explicitHistoricalCarry=reconcileFinalCalculation(calculateDocument([{quantity:0,unit_price:'100.01',vat_rate:8.1},{quantity:1,unit_price:100,vat_rate:2.6}],'CHF'),historicalMixedAgreed,[1,2],historicalMixedPrior);assert.equal(explicitHistoricalCarry.total,'102.62');assert.deepEqual(explicitHistoricalCarry.settlementAdjustment,{net:'0.01',tax:'0.01'});
const taxOnlyAgreed=calculateDocument([{quantity:1,unit_price:100,vat_rate:8.1},{quantity:1,unit_price:100,vat_rate:2.6}],'CHF');
const taxOnlyPrior=Array.from({length:100},()=>({calculation:calculateDocument([{quantity:'0.01',unit_price:100,vat_rate:8.1}],'CHF'),sourcePositions:[1]}));
assert.throws(()=>reconcileFinalCalculation(calculateDocument([{quantity:1,unit_price:100,vat_rate:2.6}],'CHF'),taxOnlyAgreed,[2],taxOnlyPrior),/verbleibenden/,'An omitted group with only residual VAT must not be lost either');
console.log('Historical mixed VAT: omitted net/VAT and tax-only remainders are rejected; explicit original-price zero-quantity carry restores the exact original claim without changing old invoices.');
