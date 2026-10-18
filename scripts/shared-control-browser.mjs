import assert from 'node:assert/strict';

// Measure settled layout without disabling motion or relaxing geometry assertions.
// Infinite progress indicators do not define a final layout state.
export async function waitForFiniteAnimations(page,{timeout=5000}={}){
 await page.waitForFunction(()=>document.getAnimations().every(animation=>animation.effect?.getTiming().iterations===Infinity||['finished','idle'].includes(animation.playState)),null,{timeout});
}

async function verifyAnimationStabilityRegression(page){
 await page.evaluate(()=>{
  const node=document.createElement('div');node.setAttribute('aria-hidden','true');node.style.cssText='position:fixed;top:-10000px;width:44px;height:44px;pointer-events:none';document.body.append(node);
  const animation=node.animate([{transform:'translateY(3px)'},{transform:'none'}],{duration:150,fill:'both'});animation.pause();window.__binsoGeometryProbe={node,animation};
 });
 try{
  await assert.rejects(()=>waitForFiniteAnimations(page,{timeout:100}),/Timeout/,'A paused finite animation cannot qualify as settled geometry');
  assert.equal(await page.evaluate(()=>window.__binsoGeometryProbe.animation.playState),'paused');
  await page.evaluate(()=>window.__binsoGeometryProbe.animation.play());
  await waitForFiniteAnimations(page);
  assert.equal(await page.evaluate(()=>window.__binsoGeometryProbe.animation.playState),'finished','Finite motion must finish before geometry is accepted');
  assert.equal(await page.evaluate(()=>window.__binsoGeometryProbe.node.getBoundingClientRect().height),44,'The exact canonical height remains mandatory after motion');
  await page.evaluate(()=>{const probe=window.__binsoGeometryProbe;probe.animation.cancel();probe.animation=probe.node.animate([{opacity:.8},{opacity:1}],{duration:150,iterations:Infinity});});
  await waitForFiniteAnimations(page);
  assert.equal(await page.evaluate(()=>window.__binsoGeometryProbe.animation.playState),'running','Infinite progress animation is not disabled');
 }finally{await page.evaluate(()=>{const probe=window.__binsoGeometryProbe;probe.animation.cancel();probe.node.remove();delete window.__binsoGeometryProbe;});}
}

export async function assertMobileHeaderTargets(page){
 const targets=page.locator('.mobile-header .icon-button,.mobile-header .mobile-notification-button,.mobile-header .avatar-button').filter({visible:true});
 for(const target of await targets.all()){
  const box=await target.boundingBox();
  assert.ok(box.width>=44&&box.height>=44,'Mobile header actions retain at least 44px touch targets');
 }
 return targets;
}

export async function assertChatTargets(page){
 const targets=page.locator('.thread-composer>label,.thread-composer>button').filter({visible:true});
 assert.ok(await targets.count()>=2,'Chat exposes attachment and send controls');
 for(const target of await targets.all()){
  const box=await target.boundingBox();
  assert.ok(box.width>=44&&box.height>=44,`Chat actions retain at least 44px touch targets (${await target.getAttribute('aria-label')}: ${box.width}×${box.height})`);
 }
}

export async function verifyHeaderTargetRegression(page){
 await verifyAnimationStabilityRegression(page);
 const targets=await assertMobileHeaderTargets(page);
 assert.ok(await targets.count(),'A real mobile header target is required for the negative control');
 const target=targets.first(),style=await target.getAttribute('style');
 await target.evaluate(el=>{el.style.setProperty('width','18px','important');el.style.setProperty('min-width','18px','important');});
 try{await assert.rejects(()=>assertMobileHeaderTargets(page),/44px touch targets/);}
 finally{await target.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),style);}
 await assertMobileHeaderTargets(page);
}
