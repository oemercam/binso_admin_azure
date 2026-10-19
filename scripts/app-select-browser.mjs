/** Exercise the visible app popup, never the operating-system select picker. */
export async function selectAppOption(locator,choice){
 const native=await locator.evaluate(el=>el.tagName)==='SELECT'?locator:locator.locator('..').locator('select');
 if(await native.getAttribute('data-app-select')!=='true')return native.selectOption(choice);
 const requested=typeof choice==='object'?choice:{value:String(choice)};
 const index=await native.evaluate((el,requested)=>Array.from(el.options).findIndex((option,index)=>requested.index!=null?index===requested.index:requested.label!=null?option.label===requested.label:option.value===String(requested.value)),requested);
 if(index<0)throw new Error('Requested app option does not exist: '+JSON.stringify(choice));
 const trigger=native.locator('..').getByRole('combobox');
 await trigger.click();
 const id=await trigger.getAttribute('aria-controls');
 await locator.page().locator('[role="listbox"][id='+JSON.stringify(id)+']').locator('[role="option"]').nth(index).click();
 return [await native.inputValue()];
}
export async function appControlValue(locator){
 return await locator.evaluate(el=>el.tagName)==='BUTTON'?locator.locator('..').locator('select').inputValue():locator.inputValue();
}
