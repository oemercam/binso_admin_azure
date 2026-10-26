import "server-only";
import {scanBytes,type ScanEvidence} from "./clamav-protocol.mjs";
import {limitsConfig} from "@/config/limits";
import {env} from "./env";
import {ApiError} from "./http";
type ScanOptions={socketPath?:string;timeoutMs?:number};
export type ScanStatus="pending"|"clean"|"rejected";
export async function scanFileWithEvidence(body:Buffer,options:ScanOptions={}):Promise<{status:ScanStatus;evidence:ScanEvidence|null}>{
 if(body.length>limitsConfig.maxFileUploadBytes)throw new ApiError(413,"file_too_large","Die Datei ist zu gross.");
 const socketPath=options.socketPath??env.fileScanSocket;
 if(!socketPath){
  if(env.fileAccessMode==='clean-only')throw new ApiError(503,"file_scan_unavailable","Die Sicherheitsprüfung ist vorübergehend nicht verfügbar. Bitte erneut versuchen.");
  return {status:"pending",evidence:null};
 }
 try{return await scanBytes(body,{socketPath,maxBytes:limitsConfig.maxFileUploadBytes,timeoutMs:options.timeoutMs});}
 catch{throw new ApiError(503,"file_scan_unavailable","Die Sicherheitsprüfung ist vorübergehend nicht verfügbar. Bitte erneut versuchen.");}
}
export async function scanFile(body:Buffer,options:ScanOptions={}):Promise<ScanStatus>{return (await scanFileWithEvidence(body,options)).status;}
