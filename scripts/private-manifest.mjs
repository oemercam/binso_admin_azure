import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import assert from 'node:assert/strict';

/** Check and read one no-follow descriptor, never reopen the checked pathname. */
export async function readPrivateManifest(filename){
 const file=await fs.open(filename,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const info=await file.stat();
  assert.ok(info.isFile()&&info.uid===process.getuid()&&(info.mode&0o077)===0,'Manifest must be an owned private regular file');
  const limit=1024*1024;assert.ok(info.size<=limit,'Manifest is too large');
  const bytes=Buffer.alloc(limit+1);let offset=0;
  while(offset<bytes.length){const read=await file.read(bytes,offset,bytes.length-offset,null);if(!read.bytesRead)break;offset+=read.bytesRead;}
  assert.ok(offset<=limit,'Manifest grew beyond the size limit');
  return JSON.parse(bytes.subarray(0,offset).toString('utf8'));
 }finally{await file.close();}
}
