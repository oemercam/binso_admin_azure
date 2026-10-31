import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export function portablePath(name){
 return name.split('/').every(part=>part&&!/[<>:"\\|?*\x00-\x1f]/.test(part)&&!/[. ]$/.test(part)&&!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
}
for(const name of ['a?b.png','foo/NUL.json','x/trailing.','x/trailing ','x/a:b'])assert.equal(portablePath(name),false,name);
for(const name of ['docs/example-tab-contacts.json','app/kunden/[id]/page.tsx','Ömer/file.png'])assert.equal(portablePath(name),true,name);
// The index includes reviewable renames before a local commit exists.
const names=execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
assert.ok(names.length,'Tracked inventory must not be empty');
assert.deepEqual(names.filter(name=>!portablePath(name)),[],'Every tracked filename must support Windows checkout');
const folded=new Set();for(const name of names){const key=name.toLocaleLowerCase('en-US');assert.ok(!folded.has(key),'Case-insensitive filename collision: '+name);folded.add(key);}
console.log('Portable tracked paths: forbidden characters, device names, suffixes and case collisions passed.');
