import {ApiError} from './http';
/** Validate the actual bytes, not just the browser-provided MIME label. */
export function validateFileContent(bytes:Uint8Array,type:string){
 const starts=(signature:number[])=>signature.every((value,index)=>bytes[index]===value);
 const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
 const valid=type==='application/pdf'?ascii(0,5)==='%PDF-':type==='image/png'?starts([137,80,78,71,13,10,26,10]):type==='image/jpeg'?starts([255,216,255]):type==='image/webp'?ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP':['text/plain','text/csv'].includes(type)&&!bytes.includes(0);
 if(!valid)throw new ApiError(400,'file_content_invalid','Der Dateiinhalt stimmt nicht mit dem erlaubten Dateityp überein.');
}
