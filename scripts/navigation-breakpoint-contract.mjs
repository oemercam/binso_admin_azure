import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));

/** Validate the current Microsoft desktop/mobile boundary without projecting
 * a retired tablet breakpoint into the active contract. */
export function currentNavigationRead(read){
 return file=>{
  const source=read(file);
  if(file!=='app/design-system/navigation.css')return source;
  assert.equal((source.match(/@media \(max-width:760px\)\{/g)||[]).length,1,'One mobile dock owner at 760px');
  assert.ok(!source.includes('@media (max-width:1100px){'),'Tablet must not select the mobile dock');
  return source;
 };
}

/** Explicit migration of unused attached-create CSS, for the generator only.
 * Actual navigation geometry and behavior are not normalized or regenerated. */
export function withoutRetiredDockActions(source){
 const root=postcss.parse(source);
 const retired=new Set(['.dock-create-action','.dock-create-action:active','.dock-create-action:focus-visible','.mobile-dock-action','.mobile-dock.is-compact .dock-create-action','.mobile-dock.is-compact .mobile-dock-action']);
 root.walkRules(rule=>{
  if(/\.dock-create-action\b|\.mobile-dock-action\b/.test(rule.selector)){
   if(rule.selector==='.mobile-dock> :is(nav,.mobile-dock-action)')rule.selector='.mobile-dock>nav';
   else {assert.ok(retired.has(rule.selector),'Never discard a live or unknown selector in the migration');rule.remove();}
  }
  if(rule.selector==='.mobile-dock')rule.walkDecls('gap',decl=>{assert.equal(decl.value,'var(--dock-gap)');decl.remove()});
 });
 return root.toString();
}
