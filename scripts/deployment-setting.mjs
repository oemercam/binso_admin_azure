import {pathToFileURL} from 'node:url';
/** Return codes match a strict predicate: present 0, absent 1, invalid input 5. */
export function hasSetting(settings,name){
 if(!Array.isArray(settings)||settings.some(s=>!s||typeof s!=='object'||typeof s.name!=='string'))throw Error('Invalid settings collection');
 return settings.some(s=>s.name===name);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(!process.argv[2])throw Error('Setting name is required');
  let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>1024*1024)throw Error('Settings collection too large');}
  process.exitCode=hasSetting(JSON.parse(input),process.argv[2])?0:1;
 }catch{console.error('App Service setting names could not be validated.');process.exitCode=5;}
}
