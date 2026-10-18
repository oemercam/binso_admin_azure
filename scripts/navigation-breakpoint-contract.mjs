import assert from 'node:assert/strict';

/** Microsoft desktop begins above 760px. Project only this documented context
 * change onto the historical digest; destinations, permissions, declarations,
 * motion and inherited dock tokens are still compared exactly. */
export function historicalNavigationRead(read){
 return file=>{
  const source=read(file);
  if(file!=='app/design-system/navigation.css')return source;
  assert.equal((source.match(/@media \(max-width:760px\)\{/g)||[]).length,1,'One mobile dock owner at 760px');
  assert.ok(!source.includes('@media (max-width:1100px){'),'Tablet must not select the mobile dock');
  return source.replace('@media (max-width:760px){','@media (max-width:1100px){');
 };
}
