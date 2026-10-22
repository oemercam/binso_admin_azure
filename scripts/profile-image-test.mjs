import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {moduleUrl} from './data-test-modules.mjs';
const require=createRequire(import.meta.url);
const cropModule=moduleUrl(await fs.readFile('lib/avatar-crop.ts','utf8'));
const source=(await fs.readFile('lib/server/profile-image.ts','utf8')).replace("'sharp'",JSON.stringify(pathToFileURL(require.resolve('sharp')).href));
const {prepareProfileImage}=await import(moduleUrl(source.replace("'@/lib/avatar-crop'",JSON.stringify(cropModule))));
for(const [mime,format] of [['image/png','png'],['image/jpeg','jpeg'],['image/webp','webp']]){
 const original=await sharp({create:{width:1200,height:600,channels:4,background:{r:20,g:50,b:80,alpha:.5}}}).withExif({IFD0:{Artist:'Synthetic metadata must not survive'}}).toFormat(format).toBuffer();
 const avatar=await prepareProfileImage(original,mime,true),metadata=await sharp(avatar).metadata();
 assert.equal(metadata.width,512);assert.equal(metadata.height,512);assert.equal(metadata.format,format);assert.equal(metadata.exif,undefined);assert.equal(metadata.icc,undefined);
 const logo=await prepareProfileImage(original,mime,false),branding=await sharp(logo).metadata();assert.equal(branding.width/branding.height,2,'Company wordmarks retain their proportions');assert.equal(branding.exif,undefined);
 assert.notDeepEqual(avatar,original,'Bytes are really decoded/re-encoded, not a MIME-only check');
}
await assert.rejects(prepareProfileImage(Buffer.from('not an image'),'image/png',true));
await assert.rejects(prepareProfileImage(Buffer.from('ftypheic'),'image/heic',true),/image_format/);
await assert.rejects(prepareProfileImage(Buffer.from('ftypheif'),'image/heif',true),/image_format/);
const halves=await sharp({create:{width:1200,height:600,channels:3,background:'#ff0000'}}).composite([{input:await sharp({create:{width:600,height:600,channels:3,background:'#0000ff'}}).png().toBuffer(),left:600,top:0}]).png().toBuffer();
for(const [x,channel] of [[0,0],[1,2]]){
 const cropped=await prepareProfileImage(halves,'image/png',true,{x,y:.5,zoom:1});
 const stats=await sharp(cropped).stats();assert.equal(Math.round(stats.channels[channel].mean),255);assert.equal(Math.round(stats.channels[1].mean),0,'Requested crop retains actual source pixels');
}
const oriented=await sharp(halves).withMetadata({orientation:6}).png().toBuffer();
const upright=await sharp(oriented).autoOrient().png().toBuffer();
const expected=await sharp(upright).extract({left:200,top:800,width:400,height:400}).resize(512,512).png().toBuffer();
assert.deepEqual(await prepareProfileImage(oriented,'image/png',true,{x:1,y:1,zoom:1.5}),expected,'Crop is applied AFTER EXIF orientation, matching the upright browser preview');
for(const crop of [null,{},[],{x:-1,y:.5,zoom:1},{x:.5,y:2,zoom:1},{x:.5,y:.5,zoom:4},{x:NaN,y:.5,zoom:1},{x:'0',y:.5,zoom:1},{x:.5,y:.5,zoom:1,extra:true}])await assert.rejects(prepareProfileImage(halves,'image/png',true,crop),/image_crop/);
await assert.rejects(prepareProfileImage(halves,'image/jpeg',true),/image_format/);
const oversized=await sharp({create:{width:5000,height:5000,channels:3,background:'#fff'}}).png().toBuffer();await assert.rejects(prepareProfileImage(oversized,'image/png',true),/pixel limit/i);
console.log('Profile images: PNG/JPEG/WebP real decoding, exact selected crop after EXIF orientation, logo proportions, metadata removal, corrupt/HEIC/HEIF/pixel-bomb/crop/mismatched-content rejection passed.');
