import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeTestOutput} from './test-output.mjs';

function sourceSha(sha){if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('Immutable source SHA required');return sha;}
async function fileHandle(file,read){
 if((await fs.lstat(file)).isSymbolicLink())throw Error('Artifact symlinks are forbidden');
 const handle=await fs.open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{const stat=await handle.stat();if(!stat.isFile()||stat.size<1)throw Error('Expected a nonempty regular artifact file');return await read(handle,stat);}finally{await handle.close();}
}
async function digest(file){return fileHandle(file,async(handle,stat)=>{
 const hash=createHash('sha256');for await(const chunk of handle.createReadStream({autoClose:false}))hash.update(chunk);
 if((await handle.stat()).size!==stat.size)throw Error('Artifact changed during verification');
 return {size:stat.size,sha256:hash.digest('hex')};
});}
export async function createArtifactManifest(directory,sha){
 sourceSha(sha);
 const bytes=await digest(path.join(directory,'binso-one.zip'));
 const manifest={schemaVersion:1,artifact:'binso-one.zip',sourceSha:sha,...bytes};
 await writeTestOutput(path.join(directory,'release-artifact.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
export async function verifyArtifact(directory,sha){
 sourceSha(sha);
 const manifest=await fileHandle(path.join(directory,'release-artifact.json'),async(handle,stat)=>{
  if(stat.size>1024*1024)throw Error('Artifact manifest is too large');
  return JSON.parse(await handle.readFile('utf8'));
 });
 if(manifest.schemaVersion!==1||manifest.artifact!=='binso-one.zip'||manifest.sourceSha!==sha||!Number.isSafeInteger(manifest.size)||manifest.size<1||!/^[a-f0-9]{64}$/.test(manifest.sha256??''))throw Error('Invalid artifact manifest or source binding');
 const actual=await digest(path.join(directory,'binso-one.zip'));
 if(actual.size!==manifest.size||actual.sha256!==manifest.sha256)throw Error('Tested artifact bytes do not match the release manifest');
 return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [command,directory,sha]=process.argv.slice(2);
 if(!['create','verify'].includes(command)||!directory)throw Error('Usage: release-artifact.mjs create|verify DIRECTORY SHA');
 await (command==='create'?createArtifactManifest:verifyArtifact)(directory,sha);
 console.log('Release artifact '+command+' passed for '+sha);
}
