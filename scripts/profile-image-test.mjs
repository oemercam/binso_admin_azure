import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {moduleUrl} from './data-test-modules.mjs';
const require=createRequire(import.meta.url);
const source=(await fs.readFile('lib/server/profile-image.ts','utf8')).replace("'sharp'",JSON.stringify(pathToFileURL(require.resolve('sharp')).href));
const {prepareProfileImage}=await import(moduleUrl(source));
for(const [mime,format] of [['image/png','png'],['image/jpeg','jpeg'],['image/webp','webp']]){
 const original=await sharp({create:{width:1200,height:600,channels:4,background:{r:20,g:50,b:80,alpha:.5}}}).withExif({IFD0:{Artist:'Synthetic metadata must not survive'}}).toFormat(format).toBuffer();
 const avatar=await prepareProfileImage(original,mime,true),metadata=await sharp(avatar).metadata();
 assert.equal(metadata.width,512);assert.equal(metadata.height,512);assert.equal(metadata.format,format);assert.equal(metadata.exif,undefined);assert.equal(metadata.icc,undefined);
 const logo=await prepareProfileImage(original,mime,false),branding=await sharp(logo).metadata();assert.equal(branding.width/branding.height,2,'Company wordmarks retain their proportions');assert.equal(branding.exif,undefined);
 assert.notDeepEqual(avatar,original,'Bytes are really decoded/re-encoded, not a MIME-only check');
}
await assert.rejects(prepareProfileImage(Buffer.from('not an image'),'image/png',true));
await assert.rejects(prepareProfileImage(Buffer.from('ftypheic'),'image/heic',true),/image_format/);
const oversized=await sharp({create:{width:5000,height:5000,channels:3,background:'#fff'}}).png().toBuffer();await assert.rejects(prepareProfileImage(oversized,'image/png',true),/pixel limit/i);
console.log('Profile images: PNG/JPEG/WebP real decoding, avatar crop, logo proportions, metadata removal, corrupt/HEIC/pixel-bomb rejection passed.');
