import assert from 'node:assert/strict';

/** Resolve visibility and styles in one DOM turn: a rerender can detach locator handles. */
export async function measureListFrameBorders(page){
 return page.evaluate(()=>[...document.querySelectorAll('.records,.desktop-record-table')].flatMap(el=>{
  const css=getComputedStyle(el),rect=el.getBoundingClientRect();
  return el.isConnected&&rect.width>0&&rect.height>0&&css.visibility!=='hidden'&&css.visibility!=='collapse'
   ?[{top:css.borderTopWidth,bottom:css.borderBottomWidth}]:[];
 }));
}

/** Query and read KPI borders atomically, without carrying handles across a rerender. */
export async function measureMetricDividers(page){
 return page.evaluate(()=>[...document.querySelectorAll('.metric,.finance-flow-primary,.finance-flow-result,.finance-flow-costs,.finance-flow-costs>div')].map(el=>({left:getComputedStyle(el).borderLeftWidth,compact:!!el.closest(':is(.app-root[data-ux="master-v3"] .bo-cash-overview,.bo-finance-analysis)[data-compact]')})));
}

export async function measureOpenSectionShapes(page){
 return page.evaluate(()=>[...document.querySelectorAll('.page-container :is(.surface,.detail-card,.timer-card,.invoice-form)')].flatMap(el=>{const css=getComputedStyle(el),box=el.getBoundingClientRect();return box.width>0&&box.height>0&&!['hidden','collapse'].includes(css.visibility)?[{radius:css.borderRadius,compactTimeCard:el.matches('.app-root[data-ux="master-v3"] .page-container[data-section="zeit"] .time-section')&&matchMedia('(max-width:760px)').matches}]:[]}));
}

/** Real-browser countercases: detached snapshots, live borders and hidden tables. */
export async function verifyListFrameMeasurement(page){
 await page.setContent('<main class="page-container"><div class="records metric surface" style="width:200px;height:40px">Old list</div><div class="desktop-record-table" style="display:none;border:1px solid">Hidden table</div></main>');
 const detached=await page.locator('.records').elementHandle();
 try{
  await page.evaluate(()=>{const next=document.querySelector('.records').cloneNode(true);document.querySelector('.records').replaceWith(next);});
  const stale=await detached.evaluate(el=>({top:getComputedStyle(el).borderTopWidth,bottom:getComputedStyle(el).borderBottomWidth}));
  if(page.context().browser().browserType().name()==='chromium')assert.deepEqual(stale,{top:'',bottom:''},'Chromium detached locator snapshots have no computed border styles');
  assert.deepEqual(await measureListFrameBorders(page),[{top:'0px',bottom:'0px'}],'Measure the connected replacement, excluding the hidden table');
  await page.locator('.records').evaluate(el=>{el.style.borderTop='1px solid';});
  assert.equal((await measureListFrameBorders(page))[0].top,'1px','A real leading separator remains a failing measurement');
  await page.locator('.records').evaluate(el=>{el.style.borderTop='0';el.style.borderBottom='1px solid';});
  assert.equal((await measureListFrameBorders(page))[0].bottom,'1px','A real terminal separator remains a failing measurement');
  assert.deepEqual(await measureMetricDividers(page),[{left:'0px',compact:false}],'KPI measurement queries the connected replacement in the same DOM turn');
  await page.locator('.metric').evaluate(el=>{el.style.borderLeft='1px solid';});
  assert.deepEqual(await measureMetricDividers(page),[{left:'1px',compact:false}],'A real noncompact KPI divider remains visible to the strict zero-border assertion');
  assert.deepEqual(await measureOpenSectionShapes(page),[{radius:'0px',compactTimeCard:false}],'Section measurement reads the connected replacement');
  await page.locator('.surface').evaluate(el=>{el.style.borderRadius='7px';});
  assert.deepEqual(await measureOpenSectionShapes(page),[{radius:'7px',compactTimeCard:false}],'A real incorrect section radius remains visible to the strict shape assertion');
 }finally{await detached.dispose();}
}

/** Current global UX audit: 48px fields, 15px desktop text and 16px mobile text (iOS focus zoom).
 * Textareas and checkbox/radio controls have their own semantic geometry. */
export async function assertCanonicalClosedFields(page,route=''){
 const fields=await page.evaluate(()=>[...document.querySelectorAll('.form-field>.form-control:not(textarea):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]),.form-field .app-select-trigger')].flatMap(el=>{const css=getComputedStyle(el),box=el.getBoundingClientRect();return box.width>0&&box.height>0&&!['hidden','collapse'].includes(css.visibility)?[{height:box.height,padding:css.paddingLeft,radius:css.borderRadius,font:css.fontSize,mobile:matchMedia('(max-width:760px)').matches}]:[]}));
 for(const geometry of fields){
  assert.equal(geometry.height,48,route+': canonical closed field height');
  assert.equal(geometry.padding,'16px',route+': canonical field inset');
  assert.equal(geometry.radius,'12px',route+': canonical field radius');
  assert.equal(geometry.font,geometry.mobile?'16px':'15px',route+': canonical field text');
 }
}

export async function verifyCanonicalFieldRegression(page){
 const field=page.locator('.form-field>.form-control:not(textarea):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"])').filter({visible:true}).first();assert.ok(await field.count(),'A real closed field is required for the negative controls');
 const original=await field.getAttribute('style');
 for(const [properties,message] of [[{'height':'40px','min-height':'40px'},/canonical closed field height/],[{'padding-left':'11px'},/canonical field inset/],[{'border-radius':'7px'},/canonical field radius/],[{'font-size':'13px'},/canonical field text/]]){
  try{await field.evaluate((el,properties)=>{for(const [key,value] of Object.entries(properties))el.style.setProperty(key,value,'important');},properties);await assert.rejects(()=>assertCanonicalClosedFields(page),message);}
  finally{await field.evaluate((el,value)=>value===null?el.removeAttribute('style'):el.setAttribute('style',value),original);}
 }
 await assertCanonicalClosedFields(page);
}

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
   const create=[...root.querySelectorAll('.bo-create-action')].find(el=>el.checkVisibility());
   const actionClearance=create?create.getBoundingClientRect().height+16:0;
   return {padding:parseFloat(style.paddingBottom),expected:dockHeight+parseFloat(dockStyle.bottom)+20+actionClearance,outer:root.matches('.app-root')?parseFloat(getComputedStyle(root.querySelector('.app-main')).paddingBottom):0};
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

/** Development Lab has a persistent HMR connection; await actual hydration and fonts. */
export async function waitForLabReady(page){
 await page.locator('main.ux-lab[data-hydrated="true"]').waitFor({state:'visible'});
 await page.evaluate(()=>document.fonts.ready);
}

/** V4.1 settings edit action belongs to the visible detail header on every viewport. */
export async function openSettingsEditor(page){
 const header=page.locator('.mobile-header,.bo-detail-commandbar').filter({visible:true});
 await header.getByRole('button',{name:'Weitere Aktionen',exact:true}).click();
 const actions=page.getByRole('dialog',{name:'Weitere Aktionen',exact:true});
 await actions.waitFor({state:'visible'});
 await actions.getByRole('button',{name:'Bearbeiten',exact:true}).click();
}
