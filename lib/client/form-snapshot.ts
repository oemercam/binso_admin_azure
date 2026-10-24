/** Stable editable values: object key order and platform line endings are not edits.
 * File identity is retained; choosing another file is an edit even with the same name. */
const files=new WeakMap<File,number>();
let nextFile=0;
export function formSnapshot(value:unknown):string{
 const normalize=(item:unknown):unknown=>{
  if(typeof item==='string')return item.replace(/\r\n?/g,'\n');
  if(typeof File!=='undefined'&&item instanceof File){if(!files.has(item))files.set(item,++nextFile);return {file:files.get(item),name:item.name,size:item.size,type:item.type,lastModified:item.lastModified};}
  if(item instanceof Date)return item.toISOString();
  if(Array.isArray(item))return item.map(normalize);
  if(item&&typeof item==='object')return Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>[key,normalize(value)]));
  return item;
 };
 return JSON.stringify(normalize(value));
}

/** Nested dialogs own their controls; their opening alone cannot dirty the parent. */
export function formControlSnapshot(root:HTMLElement|null,selector='input:not([type="hidden"]),select,textarea'){
 const dialog=root?.closest('[role="dialog"]');
 return formSnapshot(Array.from(root?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>(selector)??[])
  .filter(element=>element.closest('[role="dialog"]')===dialog)
  .map(element=>[element.name||element.id,element.type,element instanceof HTMLInputElement
   ?element.type==='file'?Array.from(element.files??[]):['checkbox','radio'].includes(element.type)?element.checked:element.value
   :element instanceof HTMLSelectElement&&element.multiple?Array.from(element.selectedOptions,option=>option.value):element.value]));
}
