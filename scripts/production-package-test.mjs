import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {verifyRuntimePackage} from './verify-runtime-package.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'binso-runtime-package-')),sha='a'.repeat(40);
try{
 const files=['server.js','.next/BUILD_ID','.next/required-server-files.json','public/sw.js','public/manifest-app.webmanifest','public/deployment.json','scripts/start-scanner-production.mjs','scripts/scanner-bridge.mjs','lib/server/clamav-protocol.mjs'];
 for(const file of files){await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),'fixture');}
 for(const folder of ['.next/static','.next/server','node_modules/next'])await fs.mkdir(path.join(root,folder),{recursive:true});
 await fs.writeFile(path.join(root,'.next/required-server-files.json'),JSON.stringify({config:{output:'standalone',env:{BINSO_BUILD_SHA:sha}}}));
 await fs.writeFile(path.join(root,'public/deployment.json'),JSON.stringify({sha}));
 assert.equal(verifyRuntimePackage(root,sha).sourceSha,sha);
 for(const file of ['.env','.env.production','.env.local','.npmrc','.git']){
  await fs.writeFile(path.join(root,file),'synthetic private fixture');assert.throws(()=>verifyRuntimePackage(root,sha),/Private or build-only file/);await fs.unlink(path.join(root,file));
 }
 for(const dependency of ['eslint','eslint-config-next','@electric-sql/pglite']){
  const folder=path.join(root,'node_modules',dependency);await fs.mkdir(folder,{recursive:true});assert.throws(()=>verifyRuntimePackage(root,sha),/Development dependency/);await fs.rmdir(folder);
 }
 await fs.mkdir(path.join(root,'node_modules/typescript'));assert.equal(verifyRuntimePackage(root,sha).sourceSha,sha,'TypeScript can be a locked production peer of swissqrbill');
 assert.throws(()=>verifyRuntimePackage(root,'main'),/Immutable/);
 assert.throws(()=>verifyRuntimePackage(root,'b'.repeat(40)),/built source SHA/);
 await fs.unlink(path.join(root,'public/sw.js'));assert.throws(()=>verifyRuntimePackage(root,sha),/ENOENT/);
 console.log('Production package guard: required runtime files, exact built/source identity, private-file exclusion and dev-dependency rejection passed.');
}finally{await fs.rm(root,{recursive:true,force:true})}
