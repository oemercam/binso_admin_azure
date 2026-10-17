import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createArtifactManifest,verifyArtifact} from './release-artifact.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'binso-release-artifact-'));
const sha='a'.repeat(40),zip=path.join(root,'binso-one.zip'),manifest=path.join(root,'release-artifact.json');
try{
 await fs.writeFile(zip,'PK\x03\x04test fixture');
 await assert.rejects(verifyArtifact(root,sha));
 const recorded=await createArtifactManifest(root,sha);
 assert.deepEqual(await verifyArtifact(root,sha),recorded);
 // Replace the path after opening: verification must reject the identity change,
 // even when the replacement contains the same bytes as the trusted archive.
 const originalOpen=fs.open;let replaced=false;
 fs.open=async(file,...args)=>{
  const handle=await originalOpen(file,...args);
  if(file===zip&&!replaced){
   replaced=true;
   await fs.rename(zip,zip+'.opened');
   await fs.writeFile(zip,'PK\x03\x04test fixture');
  }
  return handle;
 };
 try{await assert.rejects(verifyArtifact(root,sha),/Artifact path changed/);assert(replaced);}
 finally{fs.open=originalOpen;}
 await fs.unlink(zip);await fs.rename(zip+'.opened',zip);
 await assert.rejects(verifyArtifact(root,'b'.repeat(40)),/source binding/);
 await assert.rejects(createArtifactManifest(root,'main'),/Immutable/);
 await fs.writeFile(zip,'PK\x03\x04evil fixture');
 await assert.rejects(verifyArtifact(root,sha),/bytes/);
 await fs.writeFile(zip,'');await assert.rejects(createArtifactManifest(root,sha),/nonempty/);
 await fs.writeFile(zip,'PK\x03\x04test fixture');
 await fs.writeFile(manifest,JSON.stringify({...recorded,artifact:'../outside.zip'}));
 await assert.rejects(verifyArtifact(root,sha),/Invalid/);
 await fs.writeFile(manifest,JSON.stringify({...recorded,schemaVersion:2}));
 await assert.rejects(verifyArtifact(root,sha),/Invalid/);
 console.log('Artifact integrity: opened-file identity, exact tested bytes/source, corruption, missing evidence and invalid manifests enforced.');
}finally{
 const resolved=await fs.realpath(root),temporary=await fs.realpath(os.tmpdir());
 assert(resolved.startsWith(temporary+path.sep)&&path.basename(resolved).startsWith('binso-release-artifact-'));
 await fs.rm(resolved,{recursive:true,force:true});
}
