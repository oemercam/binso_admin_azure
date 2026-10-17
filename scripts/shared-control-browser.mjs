import assert from 'node:assert/strict';

export async function assertMobileHeaderTargets(page){
 const targets=page.locator('.mobile-header .icon-button,.mobile-header .mobile-notification-button,.mobile-header .avatar-button').filter({visible:true});
 for(const target of await targets.all()){
  const box=await target.boundingBox();
  assert.ok(box.width>=44&&box.height>=44,'Mobile header actions retain at least 44px touch targets');
 }
 return targets;
}

export async function verifyHeaderTargetRegression(page){
 const targets=await assertMobileHeaderTargets(page);
 assert.ok(await targets.count(),'A real mobile header target is required for the negative control');
 const target=targets.first(),style=await target.getAttribute('style');
 await target.evaluate(el=>{el.style.setProperty('width','18px','important');el.style.setProperty('min-width','18px','important');});
 try{await assert.rejects(()=>assertMobileHeaderTargets(page),/44px touch targets/);}
 finally{await target.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),style);}
 await assertMobileHeaderTargets(page);
}
