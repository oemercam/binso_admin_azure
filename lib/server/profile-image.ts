import sharp from 'sharp';
import {avatarCrop,avatarCropRectangle} from '@/lib/avatar-crop';
/** Decode with pixel bounds; auto-orient and re-encode without EXIF/GPS metadata. */
export async function prepareProfileImage(bytes:Buffer,type:string,avatar:boolean,crop?:unknown):Promise<Buffer>{
 if(!['image/png','image/jpeg','image/webp'].includes(type))throw new Error('image_format');
 const image=sharp(bytes,{limitInputPixels:24_000_000,failOn:'warning',animated:false});
 const metadata=await image.metadata();
 if(!metadata.width||!metadata.height||(metadata.pages??1)>1)throw new Error('image_invalid');
 if(metadata.format!==({'image/png':'png','image/jpeg':'jpeg','image/webp':'webp'} as Record<string,string>)[type])throw new Error('image_format');
 if(!avatar&&crop!==undefined)throw new Error('image_crop');
 const normalized=avatar?image.autoOrient().extract(avatarCropRectangle(metadata.autoOrient.width,metadata.autoOrient.height,avatarCrop(crop))).resize(512,512):image.rotate().resize({width:2048,height:2048,fit:'inside',withoutEnlargement:true});
 return normalized.toFormat(type==='image/jpeg'?'jpeg':type==='image/png'?'png':'webp').toBuffer();
}
