import assert from 'node:assert/strict';
/** Exercise the visible app popup, never the operating-system select picker. */
export async function selectAppOption(locator,choice){
 const candidate=await locator.evaluate(el=>el.tagName)==='SELECT'?locator:locator.locator('..').locator('select');
 if(await candidate.getAttribute('data-app-select')!=='true')return candidate.selectOption(choice);
 const native=locator.page().locator('select[id='+JSON.stringify(await candidate.getAttribute('id'))+']');
 const requested=typeof choice==='object'?choice:{value:String(choice)};
 const index=await native.evaluate((el,requested)=>Array.from(el.options).findIndex((option,index)=>requested.index!=null?index===requested.index:requested.label!=null?option.label===requested.label:option.value===String(requested.value)),requested);
 if(index<0)throw new Error('Requested app option does not exist: '+JSON.stringify(choice));
 const trigger=native.locator('..').getByRole('combobox');
 await trigger.click();
 const id=await trigger.getAttribute('aria-controls');
 const popup=locator.page().locator('[role="listbox"][id='+JSON.stringify(id)+']');
 const geometry=await popup.evaluate(el=>{const r=el.getBoundingClientRect(),v=visualViewport;return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,viewportLeft:v?.offsetLeft??0,viewportTop:v?.offsetTop??0,viewportRight:(v?.offsetLeft??0)+(v?.width??innerWidth),viewportBottom:(v?.offsetTop??0)+(v?.height??innerHeight)}});
 assert.ok(geometry.height>0&&geometry.height<=321,'Visible selection menu has a bounded content height');
 assert.ok(geometry.left>=geometry.viewportLeft&&geometry.right<=geometry.viewportRight+1&&geometry.top>=geometry.viewportTop&&geometry.bottom<=geometry.viewportBottom+1,'Selection popup stays inside the actual visible viewport');
 await locator.page().locator('[role="listbox"][id='+JSON.stringify(id)+']').locator('[role="option"]').nth(index).click();
 return [await native.inputValue()];
}
export async function appControlValue(locator){
 return await locator.evaluate(el=>el.tagName)==='BUTTON'?locator.locator('..').locator('select').inputValue():locator.inputValue();
}
