import assert from 'node:assert/strict';

async function assertFilterTrigger(trigger,expanded){
 assert.equal(await trigger.getAttribute('aria-expanded'),String(expanded),'Time filter exposes actual expanded state');
 assert.equal(await trigger.getAttribute('aria-haspopup'),'dialog','Time filter announces a dialog');
}

/** Exercise actual shared controls without saving entries or changing timer state. */
export async function verifyTimeWorkspace(page,{capture}){
 const search=page.getByRole('searchbox',{name:'Zeiteinträge suchen',exact:true});
 const trigger=page.getByRole('button',{name:'Zeitfilter',exact:true});
 await assertFilterTrigger(trigger,false);
 const original=await search.inputValue(),groups=await page.locator('.time-group').count();
 await search.fill('not-present-time-workspace');
 assert.equal(await page.locator('.time-group').count(),0,'Shared search filters actual time entries');
 await page.getByText('Keine Zeiteinträge für diese Auswahl',{exact:true}).waitFor();
 await search.fill(original);
 assert.equal(await page.locator('.time-group').count(),groups,'Clearing search restores groups');
 const group=page.locator('.time-group').first(),summary=group.locator('summary');
 await summary.focus();
 const open=await group.getAttribute('open');
 await summary.press('Enter');
 assert.equal((await group.getAttribute('open'))!==null,open===null,'Shared group retains native keyboard disclosure');
 await summary.press('Space');
 assert.equal((await group.getAttribute('open'))!==null,open!==null,'Space restores the original disclosure state');
 await trigger.focus();await trigger.press('Enter');
 const dialog=page.getByRole('dialog',{name:'Zeitfilter',exact:true});await dialog.waitFor();
 await assertFilterTrigger(trigger,true);
 assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true,'Filter moves focus into the dialog');
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 await assertFilterTrigger(trigger,false);
 assert.equal(await trigger.evaluate(el=>el===document.activeElement),true,'Filter returns focus to its actual central trigger');
 // A stale disclosure attribute must fail the same assertion, not be silently tolerated.
 await trigger.evaluate(el=>el.setAttribute('aria-expanded','true'));
 try{await assert.rejects(()=>assertFilterTrigger(trigger,false),/actual expanded state/);}
 finally{await trigger.evaluate(el=>el.setAttribute('aria-expanded','false'));}
 const viewport=page.viewportSize();
 try{
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Time workspace stays within the viewport');
   await capture(width);
  }
 }finally{await page.setViewportSize(viewport);}
}
