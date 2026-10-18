import assert from 'node:assert/strict';

/** Project only the documented desktop boundary when comparing historical
 * non-material invariants. The explicitly replaced mobile material has its own
 * current contract; geometry, motion and access must still match history. */
export function historicalNavigationRead(read){
 return file=>{
  const source=read(file);
  if(file!=='app/design-system/navigation.css')return source;
  assert.equal((source.match(/@media \(max-width:760px\)\{/g)||[]).length,1,'One mobile dock owner at 760px');
  assert.ok(!source.includes('@media (max-width:1100px){'),'Tablet must not select the mobile dock');
  return source.replace('@media (max-width:760px){','@media (max-width:1100px){');
 };
}
