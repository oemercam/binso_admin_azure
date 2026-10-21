import sharp from 'sharp';
/** Decode with pixel bounds; auto-orient and re-encode without EXIF/GPS metadata. */
export async function prepareProfileImage(bytes:Buffer,type:string,avatar:boolean):Promise<Buffer>{
 if(!['image/png','image/jpeg','image/webp'].includes(type))throw new Error('image_format');
 const image=sharp(bytes,{limitInputPixels:24_000_000,failOn:'warning',animated:false});
 const metadata=await image.metadata();
 if(!metadata.width||!metadata.height||(metadata.pages??1)>1)throw new Error('image_invalid');
 const normalized=image.rotate().resize(avatar?{width:512,height:512,fit:'cover',position:'centre'}:{width:2048,height:2048,fit:'inside',withoutEnlargement:true});
 return normalized.toFormat(type==='image/jpeg'?'jpeg':type==='image/png'?'png':'webp').toBuffer();
}
