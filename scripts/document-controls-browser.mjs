import assert from 'node:assert/strict';

export async function assertPdfScrollBoundary(page){
 const geometry=await page.locator('.document-page-stage').evaluate(stage=>({overflow:getComputedStyle(stage).overflow,root:document.documentElement.scrollWidth,viewport:innerWidth,width:stage.clientWidth,height:stage.clientHeight,scrollWidth:stage.scrollWidth,scrollHeight:stage.scrollHeight}));
 assert.equal(geometry.overflow,'auto','PDF panning remains inside the document scroll owner');
 assert.ok(geometry.root<=geometry.viewport+1,'PDF zoom never widens the application');
 assert.ok(geometry.scrollWidth>geometry.width||geometry.scrollHeight>geometry.height,'The rendered zoom creates an internal scroll range');
}

export async function verifyPdfZoom(page){
 const stage=page.locator('.document-page-stage'),canvas=stage.locator('canvas');
 await stage.locator('canvas[data-rendered-page="1"][data-rendered-zoom="1"]').waitFor();
 const fit=await canvas.boundingBox();await stage.dblclick();
 await stage.locator('canvas[data-rendered-page="1"][data-rendered-zoom="2.5"]').waitFor();
 const zoom=await canvas.boundingBox();assert.ok(Math.abs(zoom.width/fit.width-2.5)<.02&&Math.abs(zoom.height/fit.height-2.5)<.02,'Wait for actual 2.5x canvas completion, not a stale page-number marker');
 await assertPdfScrollBoundary(page);
 const broken=await page.addStyleTag({content:'.document-page-stage{overflow:visible!important}'});
 try{await assert.rejects(()=>assertPdfScrollBoundary(page),/document scroll owner/)}finally{await broken.evaluate(element=>element.remove())}
 await assertPdfScrollBoundary(page);await stage.dblclick();await stage.locator('canvas[data-rendered-page="1"][data-rendered-zoom="1"]').waitFor();
}

async function assertPreviewTargets(page){
 const controls=page.locator('.document-modal-header-actions button,.document-page-navigation button');
 assert.equal(await controls.count(),5,'Preview retains zoom, download, close and both page controls');
 for(const control of await controls.all()){
  const box=await control.boundingBox();
  assert.ok(box&&box.width>=44&&box.height>=44,'PDF preview controls have at least 44px touch targets');
  assert.ok(box.y>=0&&box.y+box.height<=page.viewportSize().height+1,'PDF preview controls stay entirely inside the viewport');
 }
}

export async function verifyPreviewControls(page,{capture=async()=>{}}={}){
 const viewport=page.viewportSize();await assertPreviewTargets(page);
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 try{
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});await settle();await assertPreviewTargets(page);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Preview controls never widen the page');await capture(width);
  }
  const reduced=await page.addStyleTag({content:'.document-modal-header-actions button,.document-page-navigation button{width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important}'});
  try{await assert.rejects(()=>assertPreviewTargets(page),/44px touch targets/)}finally{await reduced.evaluate(el=>el.remove())}
  await assertPreviewTargets(page);
  const offset=await page.addStyleTag({content:'.document-modal{margin-top:20px!important}'});
  try{await assert.rejects(()=>assertPreviewTargets(page),/entirely inside the viewport/)}finally{await offset.evaluate(el=>el.remove())}
  await assertPreviewTargets(page);
 }finally{await page.setViewportSize(viewport);await settle()}
}
