import fs from 'node:fs/promises';
import path from 'node:path';

/** Atomic private output: never follow a pre-existing target symlink. */
export async function writeTestOutput(filename,data){
 const directory=await fs.mkdtemp(path.join(path.dirname(filename),'.binso-evidence-'));
 try{
  const temporary=path.join(directory,'content');
  await fs.writeFile(temporary,data,{mode:0o600,flag:'wx'});
  await fs.rename(temporary,filename);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
}
