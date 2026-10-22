/** Normalized position in the auto-oriented image; shared by preview and decoder. */
export type AvatarCrop={x:number;y:number;zoom:number};
export const defaultAvatarCrop:AvatarCrop={x:0.5,y:0.5,zoom:1};
export function avatarCrop(value:unknown):AvatarCrop{
 if(value===undefined)return {...defaultAvatarCrop};
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='x,y,zoom')throw new Error('image_crop');
 const {x,y,zoom}=value as AvatarCrop;
 if(![x,y,zoom].every(Number.isFinite)||x<0||x>1||y<0||y>1||zoom<1||zoom>3)throw new Error('image_crop');
 return {x,y,zoom};
}
export function avatarCropRectangle(width:number,height:number,crop:AvatarCrop){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>24_000_000)throw new Error('image_dimensions');
 const {x,y,zoom}=avatarCrop(crop),size=Math.max(1,Math.floor(Math.min(width,height)/zoom));
 return {left:Math.round((width-size)*x),top:Math.round((height-size)*y),width:size,height:size};
}
