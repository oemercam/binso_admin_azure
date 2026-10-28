import assert from 'node:assert/strict';

// Owner-approved customer-detail material applies to these existing content owners.
// Menus, forms, navigation chrome and public output keep their own geometry.
export const contentGroupSelector=':is(.surface,.bo-workspace-section,.detail-card,.settings-readonly,.security-card,.monitoring-panel,.operator-payment-insight,.bo-statistics,.time-section,.desktop-record-table,.mobile-record-list,.customer-tab-panel,.employee-tab-panel,.project-tab-panel,.navigation-group,.bo-settings-group-body,.settings-form,.invoice-form,.bo-cash-trend,.document-detail-view,.form-page,.announcement-card,.context-block,.detail-list,.action-list,.plan-hero)';

export async function assertContentGroups(page){
 const groups=await page.evaluate(selector=>[...document.querySelectorAll(':is(.app-root,.operator-root) '+selector)].filter(el=>el.checkVisibility()).map(el=>{
  const css=getComputedStyle(el),nested=!!el.parentElement?.closest(selector);
  return {name:el.className,nested,borders:[css.borderTopWidth,css.borderRightWidth,css.borderBottomWidth,css.borderLeftWidth],radius:css.borderRadius,padding:[css.paddingTop,css.paddingRight,css.paddingBottom,css.paddingLeft],navigation:el.matches('.navigation-group,.bo-settings-group-body,.action-list'),shadow:css.boxShadow};
 }),contentGroupSelector);
 for(const group of groups){
  assert.ok(group.borders.every(value=>value===(group.nested?'0px':'1px')),'One card perimeter, no nested or doubled borders: '+JSON.stringify(group));
  assert.equal(group.radius,group.nested?'0px':'16px','Shared customer-detail card radius: '+JSON.stringify(group));
  assert.deepEqual(group.padding,group.nested?['0px','0px','0px','0px']:group.navigation?['0px','16px','0px','16px']:['16px','16px','16px','16px'],'Shared customer-detail card inset: '+JSON.stringify(group));
  assert.equal(group.shadow,'none','Quiet shared card material');
 }
 const information=await page.locator('.document-summary-row.is-information[href]').evaluateAll(nodes=>nodes.filter(el=>el.checkVisibility()).map(el=>({label:el.textContent,icon:el.querySelector(':scope>svg')?.getBoundingClientRect().width,height:el.getBoundingClientRect().height,gap:getComputedStyle(el).columnGap,line:getComputedStyle(el,'::after').content==='none'?null:parseFloat(getComputedStyle(el,'::after').left),labelOffset:el.querySelector(':scope>b').getBoundingClientRect().left-el.getBoundingClientRect().left})));
 for(const row of information){
  assert.equal(row.icon,18,'Shared information navigation retains its existing 18px area icon: '+row.label);
  assert.equal(row.height,48,'Shared information navigation retains a compact 48px row');
  assert.equal(row.gap,'12px','Shared information navigation retains its column alignment');
  if(row.line!==null)assert.equal(row.line,row.labelOffset,'Information separators start at the label column, like the customer hub');
 }
 const files=await page.locator('.document-detail-view + .surface').evaluateAll(nodes=>nodes.filter(el=>el.checkVisibility()).map(el=>el.getBoundingClientRect().top-el.previousElementSibling.getBoundingClientRect().bottom));
 for(const gap of files)assert.equal(gap,16,'File sections retain the shared workspace gap after document details');
}

export async function verifyContentGroupRegression(page){
 const card=page.locator(':is(.app-root,.operator-root) '+contentGroupSelector).filter({visible:true}).first();
 if(!await card.count())return;
 const original=await card.getAttribute('style');
 for(const [property,value,message] of [['border-width','2px',/One card perimeter/],['border-radius','7px',/Shared customer-detail card radius/],['padding-left','11px',/Shared customer-detail card inset/]]){
  try{await card.evaluate((el,{property,value})=>el.style.setProperty(property,value,'important'),{property,value});await assert.rejects(()=>assertContentGroups(page),message);}
  finally{await card.evaluate((el,value)=>value===null?el.removeAttribute('style'):el.setAttribute('style',value),original);}
 }
 await card.evaluate(el=>{const nested=document.createElement('section');nested.className='surface';nested.id='content-group-regression-probe';nested.textContent='Layout probe';el.append(nested);});
 try{
  await assertContentGroups(page);
  await page.locator('#content-group-regression-probe').evaluate(el=>el.style.setProperty('border','1px solid','important'));
  await assert.rejects(()=>assertContentGroups(page),/One card perimeter/,'A nested second card perimeter is rejected');
 }finally{await page.locator('#content-group-regression-probe').evaluate(el=>el.remove());}
 const informationIcon=page.locator('.document-summary-row.is-information[href]>svg').filter({visible:true}).first();
 if(await informationIcon.count()){
  const iconStyle=await informationIcon.getAttribute('style');
  try{await informationIcon.evaluate(el=>el.style.setProperty('width','17px','important'));await assert.rejects(()=>assertContentGroups(page),/18px area icon/,'An inconsistent area-icon column is rejected');}
  finally{await informationIcon.evaluate((el,value)=>value===null?el.removeAttribute('style'):el.setAttribute('style',value),iconStyle);}
 }
 const fileSection=page.locator('.document-detail-view + .surface').filter({visible:true}).first();
 if(await fileSection.count()){
  const fileStyle=await fileSection.getAttribute('style');
  try{await fileSection.evaluate(el=>el.style.setProperty('margin-top','0px','important'));await assert.rejects(()=>assertContentGroups(page),/shared workspace gap/,'Touching document and file cards are rejected');}
  finally{await fileSection.evaluate((el,value)=>value===null?el.removeAttribute('style'):el.setAttribute('style',value),fileStyle);}
 }
 await assertContentGroups(page);
}

/** Resolve visibility and styles in one DOM turn: a rerender can detach locator handles. */
export async function measureListFrameBorders(page){
 return page.evaluate(selector=>[...document.querySelectorAll('.records,.desktop-record-table')].flatMap(el=>{
  const css=getComputedStyle(el),rect=el.getBoundingClientRect();
  return el.isConnected&&rect.width>0&&rect.height>0&&css.visibility!=='hidden'&&css.visibility!=='collapse'
   ?[{top:css.borderTopWidth,bottom:css.borderBottomWidth,expected:el.closest('.app-root,.operator-root')&&el.matches(selector)&&!el.parentElement?.closest(selector)?'1px':'0px'}]:[];
 }),contentGroupSelector);
}

/** Query and read KPI borders atomically, without carrying handles across a rerender. */
export async function measureMetricDividers(page){
 return page.evaluate(()=>[...document.querySelectorAll('.metric,.finance-flow-primary,.finance-flow-result,.finance-flow-costs,.finance-flow-costs>div')].map(el=>({left:getComputedStyle(el).borderLeftWidth,compact:!!el.closest(':is(.app-root[data-ux="master-v3"] .bo-cash-overview,.bo-finance-analysis)[data-compact]')})));
}

export async function measureOpenSectionShapes(page){
 return page.evaluate(selector=>[...document.querySelectorAll('.page-container :is(.surface,.detail-card,.timer-card,.invoice-form)')].flatMap(el=>{const css=getComputedStyle(el),box=el.getBoundingClientRect();return box.width>0&&box.height>0&&!['hidden','collapse'].includes(css.visibility)?[{radius:css.borderRadius,expectedRadius:el.closest('.app-root,.operator-root')&&el.matches(selector)&&!el.parentElement?.closest(selector)?'16px':'0px'}]:[];}),contentGroupSelector);
}

/** Real-browser countercases: detached snapshots, live borders and hidden tables. */
export async function verifyListFrameMeasurement(page){
 await page.setContent('<main class="page-container"><div class="records metric surface" style="width:200px;height:40px">Old list</div><div class="desktop-record-table" style="display:none;border:1px solid">Hidden table</div></main>');
 const detached=await page.locator('.records').elementHandle();
 try{
  await page.evaluate(()=>{const next=document.querySelector('.records').cloneNode(true);document.querySelector('.records').replaceWith(next);});
  const stale=await detached.evaluate(el=>({top:getComputedStyle(el).borderTopWidth,bottom:getComputedStyle(el).borderBottomWidth}));
  if(page.context().browser().browserType().name()==='chromium')assert.deepEqual(stale,{top:'',bottom:''},'Chromium detached locator snapshots have no computed border styles');
  assert.deepEqual(await measureListFrameBorders(page),[{top:'0px',bottom:'0px',expected:'0px'}],'Measure the connected replacement, excluding the hidden table');
  await page.locator('.records').evaluate(el=>{el.style.borderTop='1px solid';});
  assert.equal((await measureListFrameBorders(page))[0].top,'1px','A real leading separator remains a failing measurement');
  await page.locator('.records').evaluate(el=>{el.style.borderTop='0';el.style.borderBottom='1px solid';});
  assert.equal((await measureListFrameBorders(page))[0].bottom,'1px','A real terminal separator remains a failing measurement');
  assert.deepEqual(await measureMetricDividers(page),[{left:'0px',compact:false}],'KPI measurement queries the connected replacement in the same DOM turn');
  await page.locator('.metric').evaluate(el=>{el.style.borderLeft='1px solid';});
  assert.deepEqual(await measureMetricDividers(page),[{left:'1px',compact:false}],'A real noncompact KPI divider remains visible to the strict zero-border assertion');
  assert.deepEqual(await measureOpenSectionShapes(page),[{radius:'0px',expectedRadius:'0px'}],'Section measurement reads the connected replacement');
  await page.locator('.surface').evaluate(el=>{el.style.borderRadius='7px';});
  assert.deepEqual(await measureOpenSectionShapes(page),[{radius:'7px',expectedRadius:'0px'}],'A real incorrect section radius remains visible to the strict shape assertion');
 }finally{await detached.dispose();}
}

/** Current global UX audit: 48px fields, 14px desktop text and 16px mobile text (iOS focus zoom).
 * Textareas and checkbox/radio controls have their own semantic geometry. */
export async function assertCanonicalClosedFields(page,route=''){
 const fields=await page.evaluate(()=>[...document.querySelectorAll('.form-field>.form-control:not(textarea):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]),.form-field .app-select-trigger')].flatMap(el=>{const css=getComputedStyle(el),box=el.getBoundingClientRect();return box.width>0&&box.height>0&&!['hidden','collapse'].includes(css.visibility)?[{height:box.height,padding:css.paddingLeft,radius:css.borderRadius,font:css.fontSize,mobile:matchMedia('(max-width:760px)').matches}]:[]}));
 for(const geometry of fields){
  assert.equal(geometry.height,48,route+': canonical closed field height');
  assert.equal(geometry.padding,'16px',route+': canonical field inset');
  assert.equal(geometry.radius,'12px',route+': canonical field radius');
  assert.equal(geometry.font,geometry.mobile?'16px':'14px',route+': canonical field text');
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
 const selector='.mobile-header .icon-button,.mobile-header .mobile-notification-button,.mobile-header .avatar-button,.mobile-header .mobile-back';
 const targets=page.locator(selector).filter({visible:true});
 if(await page.locator('.app-root.app-preview').count()){
  assert.equal(await page.locator('.mobile-header').filter({visible:true}).count(),0,'Embedded previews intentionally suppress the duplicate app header');return targets;
 }
 await page.locator('.mobile-header').waitFor({state:'visible'});
 if(await page.locator('.app-root.app-editing').count()&&!await targets.count()){
  const form=page.locator('.form-page,.bottom-sheet[data-sheet-kind="form"]').filter({visible:true});
  await form.first().waitFor({state:'visible'});
  await form.locator('button,a[href]').filter({visible:true}).first().waitFor({state:'visible'});
  return targets; // Active forms own their controls; a title-only shell is valid.
 }
 await targets.first().waitFor({state:'visible'});
 await waitForFiniteAnimations(page);
 // Playwright resolves evaluateAll's array before its separate evaluation task.
 // Query, visibility and dimensions must share one task: hydration can replace
 // an otherwise valid header and leave a previously resolved element detached.
 const measured=await page.evaluate(selector=>[...document.querySelectorAll(selector)].filter(el=>el.checkVisibility()).map(el=>{const r=el.getBoundingClientRect();return {label:el.getAttribute('aria-label'),width:r.width,height:r.height}}),selector);
 for(const box of measured){
  assert.ok(box.width>=44&&box.height>=44,'Mobile header actions retain at least 44px touch targets: '+JSON.stringify(box));
 }
 return targets;
}

/** Resolve and measure live detail elements in one task, including after hydration. */
export async function assertMobileDetailHeaderGeometry(page,width,route,{timeout=5000}={}){
 const title=page.locator('.mobile-header-detail .mobile-header-title');
 if(await title.count()){
  await title.waitFor({state:'visible'});
  const snapshot=await page.waitForFunction(()=>{const el=document.querySelector('.mobile-header-detail .mobile-header-title');if(!el?.checkVisibility())return null;const r=el.getBoundingClientRect();return {visible:true,x:r.x,width:r.width,height:r.height}},null,{timeout});
  const box=await snapshot.jsonValue();await snapshot.dispose();
  assert.ok(box?.visible&&box.width>0&&box.height>0&&Math.abs(box.x+box.width/2-width/2)<=1.5,`${route} ${width}px: visible detail title is geometrically centered ${JSON.stringify(box)}`);
 }
 const back=page.locator('.mobile-back');
 if(await back.count()){
  await back.waitFor({state:'visible'});
  // A layout registration may briefly remove the live node after waitFor.
  // Retry absence only; return real dimensions immediately so invalid geometry fails.
  const snapshot=await page.waitForFunction(()=>{const el=document.querySelector('.mobile-back');if(!el?.checkVisibility())return null;const r=el.getBoundingClientRect(),icon=el.querySelector('svg')?.getBoundingClientRect();return {visible:true,width:r.width,height:r.height,icon:icon?{x:icon.x,width:icon.width,height:icon.height}:null}},null,{timeout});
  const box=await snapshot.jsonValue();await snapshot.dispose();
  assert.ok(box?.visible&&box.width>=44&&box.height>=44,`${route} ${width}px: detail back control is visible and touchable ${JSON.stringify(box)}`);
  assert.ok(box.icon&&box.icon.width>=18&&box.icon.height>=18&&box.icon.x>=0,`${route}: back icon is not clipped`);
 }
}

export async function assertChatTargets(page){
 await page.locator('.thread-composer').waitFor({state:'visible'});
 const targets=page.locator('.thread-composer>label,.thread-composer>button').filter({visible:true});
 const measured=await targets.evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {label:el.getAttribute('aria-label'),width:r.width,height:r.height}}));
 assert.ok(measured.length>=2,'Chat exposes attachment and send controls');
 for(const box of measured){
  assert.ok(box.width>=44&&box.height>=44,`Chat actions retain at least 44px touch targets (${box.label}: ${box.width}×${box.height})`);
 }
}

/** Cross-route rendered checks; no fixture text or tenant data is exported. */
export async function assertPresentationControls(page){
 const measured=await page.locator('.status,.toggle').evaluateAll(nodes=>nodes.filter(el=>el.checkVisibility()).map(el=>{
  const css=getComputedStyle(el),box=el.getBoundingClientRect();
  return {path:location.pathname,classes:el.className,toggle:el.matches('.toggle'),font:parseFloat(css.fontSize),gap:parseFloat(css.columnGap),width:box.width,height:box.height,overflow:el.scrollWidth>el.clientWidth+1};
 }));
 for(const control of measured){
  if(control.toggle)assert.ok(control.width>=44&&control.height>=44,'Shared switches retain a 44px target');
  else {assert.ok(Math.abs(control.font-11)<.1,'Status labels remain at the approved Phase 1 11px: '+JSON.stringify(control));assert.ok(control.gap>=6,'Status marker and label remain separated');assert.equal(control.overflow,false,'Status labels must wrap instead of overflowing');}
 }
}

export async function verifyPresentationControlRegression(page){
 const status=page.locator('.status').filter({visible:true}).first();
 if(await status.count()){
  await status.evaluate(el=>{const context=document.createElement('div');context.id='binso-context-status-probe';context.className='context-block compact-list';context.append(el.cloneNode(true));document.body.append(context)});
  try{await assertPresentationControls(page);}finally{await page.locator('#binso-context-status-probe').evaluate(el=>el.remove());}
 }
 for(const [selector,properties,expected] of [
  ['.status',[['font-size','9px']],/Status labels remain/],
  ['.status',[['font-size','16px']],/Status labels remain/],
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

/** Isolated adversary: replace the header between locator resolution and use. */
export async function verifyHeaderMeasurementHydrationRegression(page){
 await page.setContent('<header class="mobile-header"><a class="mobile-back" aria-label="Aufträge" href="#">Zurück</a></header><style>.mobile-back{display:inline-flex;min-width:44px;width:44px;height:44px}</style>');
 const wrap=target=>new Proxy(target,{get(object,key){
  if(key==='filter')return options=>wrap(object.filter(options));
  if(key==='evaluateAll')return async measure=>{
   const elements=await object.elementHandles();
   try{
    await page.evaluate(()=>{const header=document.querySelector('.mobile-header');header.replaceWith(header.cloneNode(true));});
    return await page.evaluate(measure,elements);
   }finally{await Promise.all(elements.map(element=>element.dispose()));}
  };
  const value=Reflect.get(object,key);return typeof value==='function'?value.bind(object):value;
 }});
 const racingPage=new Proxy(page,{get(object,key){
  if(key==='locator')return (...args)=>wrap(object.locator(...args));
  const value=Reflect.get(object,key);return typeof value==='function'?value.bind(object):value;
 }});
 assert.deepEqual(await racingPage.locator('.mobile-back').filter({visible:true}).evaluateAll(elements=>elements.map(el=>({connected:el.isConnected,width:el.getBoundingClientRect().width}))),[{connected:false,width:0}],'Hydration invalidates an element resolved before the measurement task');
 await assertMobileHeaderTargets(racingPage);
 await verifyHeaderTargetRegression(page);
 await page.setContent('<header class="mobile-header-detail"><a class="mobile-back" href="#"><svg width="18" height="18"></svg></a><span class="mobile-header-title">Projekt</span></header><style>body{margin:0}.mobile-header-detail{display:flex;justify-content:center}.mobile-header-title{display:block}.mobile-back{position:absolute;left:0;display:flex;min-width:44px;width:44px;height:44px}</style>');
 const width=await page.evaluate(()=>innerWidth);
 const replace=()=>page.evaluate(()=>{const header=document.querySelector('header');header.replaceWith(header.cloneNode(true));});
 for(const selector of ['.mobile-header-title','.mobile-back']){
  const previous=await page.locator(selector).elementHandle();
  try{await replace();assert.deepEqual(await previous.evaluate(el=>({connected:el.isConnected,width:el.getBoundingClientRect().width})),{connected:false,width:0},'Title/back element resolution can become stale before measurement');}
  finally{await previous.dispose();}
 }
 const detailRace=new Proxy(page,{get(object,key){
  if(key==='locator')return selector=>{const locator=object.locator(selector);return new Proxy(locator,{get(target,method){
   if(method==='waitFor')return async options=>{await target.waitFor(options);await replace();};
   const value=Reflect.get(target,method);return typeof value==='function'?value.bind(target):value;
  }});};
  const value=Reflect.get(object,key);return typeof value==='function'?value.bind(object):value;
 }});
 await assertMobileDetailHeaderGeometry(detailRace,width,'synthetic hydration');
 // Reproduce the CI race where the visible back node disappears before measurement.
 const delayedBack=restore=>new Proxy(page,{get(object,key){
  if(key==='locator')return selector=>{const locator=object.locator(selector);if(selector!=='.mobile-back')return locator;return new Proxy(locator,{get(target,method){
   if(method==='waitFor')return async options=>{await target.waitFor(options);await page.evaluate(restore=>{const node=document.querySelector('.mobile-back');window.__binsoPendingBack=node;node.remove();if(restore)setTimeout(()=>{document.querySelector('header').prepend(node);delete window.__binsoPendingBack;},50);},restore);};
   const value=Reflect.get(target,method);return typeof value==='function'?value.bind(target):value;
  }});};
  const value=Reflect.get(object,key);return typeof value==='function'?value.bind(object):value;
 }});
 await assertMobileDetailHeaderGeometry(delayedBack(true),width,'delayed live-node replacement');
 try{await assert.rejects(()=>assertMobileDetailHeaderGeometry(delayedBack(false),width,'missing back countercase',{timeout:100}),/Timeout/,'A permanently missing back control must still fail');}
 finally{await page.evaluate(()=>{const node=window.__binsoPendingBack;if(node)document.querySelector('header').prepend(node);delete window.__binsoPendingBack;});}

 await page.locator('.mobile-header-title').evaluate(el=>el.style.transform='translateX(10px)');
 await assert.rejects(()=>assertMobileDetailHeaderGeometry(page,width,'offset countercase'),/geometrically centered/);
 await page.locator('.mobile-header-title').evaluate(el=>el.style.removeProperty('transform'));
 await page.locator('.mobile-back').evaluate(el=>{el.style.width='18px';el.style.minWidth='18px'});
 await assert.rejects(()=>assertMobileDetailHeaderGeometry(page,width,'touch countercase'),/visible and touchable/);
 await page.locator('.mobile-back').evaluate(el=>el.removeAttribute('style'));
 await page.locator('.mobile-back svg').evaluate(el=>el.setAttribute('width','10'));
 await assert.rejects(()=>assertMobileDetailHeaderGeometry(page,width,'icon countercase'),/back icon is not clipped/);
 await page.locator('.mobile-back svg').evaluate(el=>el.setAttribute('width','18'));
 await page.locator('.mobile-back svg').evaluate(el=>el.style.transform='translateX(-100px)');
 await assert.rejects(()=>assertMobileDetailHeaderGeometry(page,width,'clipped icon countercase'),/back icon is not clipped/);
 await page.locator('.mobile-back svg').evaluate(el=>el.style.removeProperty('transform'));
 await assertMobileDetailHeaderGeometry(page,width,'restored countercase');
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
