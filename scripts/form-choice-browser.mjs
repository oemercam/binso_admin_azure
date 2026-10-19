import assert from 'node:assert/strict';

export async function assertChoiceGeometry(label){
 await label.waitFor({state:'visible'});
 const geometry=await label.evaluate(el=>{const box=el.getBoundingClientRect(),input=el.querySelector('input').getBoundingClientRect(),text=el.querySelector('span[id$="-label"]').getBoundingClientRect();return {height:box.height,inputRight:input.right,inputTop:input.top,inputBottom:input.bottom,textLeft:text.left,textTop:text.top,textBottom:text.bottom,textRight:text.right,right:box.right}});
 assert.ok(geometry.height>=44,'Choice label is a minimum 44px touch target; measured '+geometry.height+'px');
 assert.ok(geometry.textLeft>=geometry.inputRight,'Wrapped choice text stays beside its control');
 assert.ok(geometry.inputTop<geometry.textBottom&&geometry.inputBottom>geometry.textTop,'Checkbox and multiline text share one row');
 assert.ok(geometry.textRight<=geometry.right+1,'Choice text remains inside its field');
}

/** Actual Field/native checkbox, isolated long-copy and reduced-height adversaries. */
export async function verifyChoiceField(page,label,{capture=async()=>{}}={}){
 const viewport=page.viewportSize(),text=label.locator('span[id$="-label"]'),original=await text.textContent();
 const input=label.locator('input[type="checkbox"]'),checked=await input.isChecked();
 try{
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});await assertChoiceGeometry(label);
   await text.evaluate(el=>{el.textContent='Synthetic multiline choice description for narrow screens and translated registration forms, with all terms readable beside the existing native checkbox.'});
   await assertChoiceGeometry(label);await capture(width);
   if(width===320){
    const legacy=await page.addStyleTag({content:'.form-check>span[id$="-label"]{flex:0 1 auto!important;min-width:auto!important}'});
    try{await assert.rejects(()=>assertChoiceGeometry(label),/stays beside|share one row/)}finally{await legacy.evaluate(el=>el.remove())}
    await assertChoiceGeometry(label);
   }
   await text.evaluate((el,value)=>{el.textContent=value},original);
  }
  await page.setViewportSize(viewport);await label.click();assert.equal(await input.isChecked(),!checked,'Clicking the label toggles its native checkbox');
  await input.focus();await input.press('Space');assert.equal(await input.isChecked(),checked,'Space restores the original checkbox value');
  const reduced=await page.addStyleTag({content:'.form-field.form-check{min-height:18px!important}'});
  try{await assert.rejects(()=>assertChoiceGeometry(label),/minimum 44px/)}finally{await reduced.evaluate(el=>el.remove())}
  await assertChoiceGeometry(label);
 }finally{await text.evaluate((el,value)=>{el.textContent=value},original);await page.setViewportSize(viewport)}
}
