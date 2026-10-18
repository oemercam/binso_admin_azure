import assert from 'node:assert/strict';

export async function assertOpaqueChrome(page){
 const surfaces=await page.locator('.app-header,.app-header-actions,.desktop-appbar,.bottom-nav,.operator-mobile-nav').evaluateAll(nodes=>nodes.filter(el=>el.checkVisibility()).map(el=>{const c=getComputedStyle(el);return {name:el.className,blur:c.backdropFilter,webkitBlur:c.webkitBackdropFilter,shadow:c.boxShadow}}));
 for(const surface of surfaces){
  assert.equal(surface.blur,'none',surface.name+': no backdrop blur');
  assert.ok(!surface.webkitBlur||surface.webkitBlur==='none',surface.name+': no WebKit blur');
  assert.equal(surface.shadow,'none',surface.name+': no glass shadow');
 }
 if(await page.evaluate(()=>matchMedia('(max-width:760px)').matches)){
  const clearance=await page.evaluate(()=>{
   const nav=[...document.querySelectorAll('.bottom-nav,.operator-mobile-nav')].find(el=>el.checkVisibility());
   if(!nav)return null;
   const root=nav.closest('.operator-root,.app-root'),content=root?.querySelector('.operator-main,.page-container');
   if(!content)return null;
   const style=getComputedStyle(content),dock=nav.closest('.mobile-dock'),dockStyle=getComputedStyle(dock);
   const dockHeight=dock.getBoundingClientRect().height;
   return {padding:parseFloat(style.paddingBottom),expected:dockHeight+parseFloat(dockStyle.bottom)+20,outer:root.matches('.app-root')?parseFloat(getComputedStyle(root.querySelector('.app-main')).paddingBottom):0};
  });
  if(clearance){assert.ok(Math.abs(clearance.padding-clearance.expected)<1,'One shared mobile content inset clears navigation and safe area');assert.equal(clearance.outer,0,'No second bottom inset on the outer customer workspace');}
 }
}

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
 await waitForFiniteAnimations(page);
 const targets=page.locator('.mobile-header .icon-button,.mobile-header .mobile-notification-button,.mobile-header .avatar-button,.mobile-header .mobile-back').filter({visible:true});
 for(const target of await targets.all()){
  const box=await target.boundingBox();
  assert.ok(box.width>=44&&box.height>=44,'Mobile header actions retain at least 44px touch targets: '+JSON.stringify({label:await target.getAttribute('aria-label'),width:box.width,height:box.height}));
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

/** Cross-route rendered checks; no fixture text or tenant data is exported. */
export async function assertPresentationControls(page){
 const measured=await page.locator('.status,.toggle').evaluateAll(nodes=>nodes.filter(el=>el.checkVisibility()).map(el=>{
  const css=getComputedStyle(el),box=el.getBoundingClientRect();
  return {toggle:el.matches('.toggle'),font:parseFloat(css.fontSize),gap:parseFloat(css.columnGap),width:box.width,height:box.height,overflow:el.scrollWidth>el.clientWidth+1};
 }));
 for(const control of measured){
  if(control.toggle)assert.ok(control.width>=44&&control.height>=44,'Shared switches retain a 44px target');
  else {assert.ok(control.font>=12,'Status labels remain at least 12px');assert.ok(control.gap>=6,'Status marker and label remain separated');assert.equal(control.overflow,false,'Status labels must wrap instead of overflowing');}
 }
}

export async function verifyPresentationControlRegression(page){
 for(const [selector,properties,expected] of [
  ['.status',[['font-size','9px']],/Status labels remain/],
  ['.status',[['gap','0px']],/Status marker and label/],
  ['.toggle',[['height','24px'],['min-height','24px']],/44px target/],
 ]){
  const target=page.locator(selector).filter({visible:true}).first();if(!await target.count())continue;
  const original=await target.getAttribute('style');
  try{await target.evaluate((el,properties)=>{for(const [p,v] of properties)el.style.setProperty(p,v,'important');},properties);await assert.rejects(()=>assertPresentationControls(page),expected);}
  finally{await target.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),original);}
 }
 await assertPresentationControls(page);
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
