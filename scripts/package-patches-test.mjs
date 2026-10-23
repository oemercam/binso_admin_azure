import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {copyPackagePatches} from './package-patches.mjs';
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'binso-patch-package-'));
assert.ok(fixture.startsWith(path.resolve(os.tmpdir())+path.sep));
try{
 const source=path.join(fixture,'source'),target=path.join(fixture,'target');fs.mkdirSync(path.join(source,'patches'),{recursive:true});
 const manifest=value=>fs.writeFileSync(path.join(source,'package.json'),JSON.stringify(value));
 manifest({});assert.deepEqual(copyPackagePatches(source,target),[]);
 const bytes=Buffer.from('diff --git a/test.js b/test.js\r\n+fixture\r\n');
 fs.writeFileSync(path.join(source,'patches','fixture.patch'),bytes);fs.writeFileSync(path.join(source,'patches','unlisted.txt'),'Never package an unlisted file');
 manifest({pnpm:{patchedDependencies:{'fixture@1':'patches/fixture.patch'}}});
 assert.deepEqual(copyPackagePatches(source,target),['patches/fixture.patch']);assert.deepEqual(fs.readFileSync(path.join(target,'patches','fixture.patch')),bytes,'No line-ending/hash normalization');
 assert.equal(fs.existsSync(path.join(target,'patches','unlisted.txt')),false);
 for(const file of ['../private.patch','patches/../private.patch','C:/private.patch','patches\\fixture.patch','patches//fixture.patch','patches/missing.patch']){manifest({pnpm:{patchedDependencies:{fixture:file}}});assert.throws(()=>copyPackagePatches(source,target),'Invalid/missing inputs fail instead of weakening frozen install');}
 manifest({pnpm:{patchedDependencies:{valid:'patches/fixture.patch',missing:'patches/missing.patch'}}});const atomicTarget=path.join(fixture,'atomic-target');assert.throws(()=>copyPackagePatches(source,atomicTarget));assert.equal(fs.existsSync(atomicTarget),false,'Validate the complete list before writing any file');
 const outside=path.join(fixture,'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'fixture.patch'),bytes);fs.symlinkSync(outside,path.join(source,'patches','linked'),'junction');manifest({pnpm:{patchedDependencies:{fixture:'patches/linked/fixture.patch'}}});assert.throws(()=>copyPackagePatches(source,target),/symlink/);
 for(const value of [[],true,'patches/fixture.patch']){manifest({pnpm:{patchedDependencies:value}});assert.throws(()=>copyPackagePatches(source,target));}
 manifest({pnpm:{patchedDependencies:{fixture:'patches/empty.patch'}}});fs.writeFileSync(path.join(source,'patches','empty.patch'),'');assert.throws(()=>copyPackagePatches(source,target));
 // The actual application manifest must reproduce the current source patch bytes.
 const actual=path.join(fixture,'actual');const copied=copyPackagePatches(process.cwd(),actual);assert.ok(copied.length);for(const file of copied)assert.deepEqual(fs.readFileSync(path.join(actual,file)),fs.readFileSync(file));
 console.log('Production patch packaging: exact declared bytes only; empty, malformed, traversal, absolute, Windows and missing paths rejected.');
}finally{fs.rmSync(fixture,{recursive:true,force:true});}
