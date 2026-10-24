import assert from 'node:assert/strict';

/** Explicit Phase 1 row variants; a variant never exempts overlap or amount-clipping checks. */
export function assertRowPresentation(g,context='row'){
 assert.ok(g.title&&g.meta&&g.amount,context+': title, metadata and amount remain present');
 assert.equal(g.amountFits,true,context+': complete amount remains visible');
 assert.ok(g.title.right<=g.amount.x-3,context+': title and value do not overlap');
 const center=box=>box.y+box.height/2;
 if(g.control)assert.ok(g.control.width>=44&&g.control.height>=44,context+': inline controls retain 44px targets');
 if(g.information){
  assert.ok(g.height>=44&&g.height<=48,context+': information row retains compact height');
  assert.equal(g.metaHidden,true,context+': information description remains accessible without another visual line');
  assert.ok(Math.abs(center(g.control??g.amount)-center(g.title))<=3,context+': information label/value align');
  return;
 }
 assert.ok(g.meta.y>=g.title.bottom-1,context+': metadata appears below the title');
 if(g.metadataAmount){
  assert.ok(g.status,context+': document status stays on the first line');
  assert.ok(Math.abs(center(g.status)-center(g.title))<=3,context+': document title/status align');
  assert.ok(g.title.right<=g.status.x-3,context+': document title/status do not overlap');
  assert.ok(g.amount.y>=g.title.bottom-1,context+': document amount belongs to the second line');
  assert.ok(Math.abs(center(g.amount)-center(g.meta))<=3,context+': document metadata and amount share the second line');
  assert.ok(g.meta.right<=g.amount.x-3,context+': document metadata never overlaps the amount');
 }else{
  assert.ok(g.control?Math.abs(center(g.control)-center(g.title))<=3:Math.abs(g.amount.y-g.title.y)<=3,context+': separate value aligns with its title');
  assert.ok(g.meta.y>=g.amount.bottom-1,context+': separate metadata stays below title/value');
 }
}
