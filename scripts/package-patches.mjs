import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** pnpm validates all manifest patch hashes even during --prod installation. */
export function copyPackagePatches(source,target){
 const manifest=JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8'));
 const patches=manifest.pnpm?.patchedDependencies??{};
 if(!patches||typeof patches!=='object'||Array.isArray(patches))throw Error('Invalid package patch manifest');
 const files=[...new Set(Object.values(patches))];
 // Validate every input before any copy; never copy a whole unlisted directory.
 const validated=files.map(file=>{
  if(typeof file!=='string'||!/^patches\/[\w@+./-]+\.patch$/.test(file)||file.split('/').some(segment=>!segment||segment==='.'||segment==='..'))throw Error('Invalid package patch path');
  for(let parent=path.resolve(source),index=0,segments=file.split('/');index<segments.length;index++){
   parent=path.join(parent,segments[index]);if(fs.lstatSync(parent).isSymbolicLink())throw Error('Package patch symlink is forbidden');
  }
  const bytes=fs.readFileSync(path.join(source,file));
  if(!bytes.length)throw Error('Empty package patch');
  return {file,bytes};
 });
 for(const {file,bytes} of validated){const destination=path.join(target,file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);}
 return validated.map(item=>item.file);
}
if(process.argv[1]===fileURLToPath(import.meta.url))copyPackagePatches(process.cwd(),process.argv[2]??'deploy/runtime');
