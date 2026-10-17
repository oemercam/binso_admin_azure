import assert from 'node:assert/strict';

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
