import "server-only";
import {createConnection} from "node:net";
import {isAbsolute} from "node:path";
import {limitsConfig} from "@/config/limits";
import {env} from "./env";
import {ApiError} from "./http";

type ScanOptions={socketPath?:string;timeoutMs?:number};
export type ScanStatus="pending"|"clean"|"rejected";

// Only a local, access-controlled clamd socket is supported: its TCP protocol has no authentication.
// No configuration means quarantine, never an implicit clean verdict.
export async function scanFile(body:Buffer,options:ScanOptions={}):Promise<ScanStatus>{
 if(body.length>limitsConfig.maxFileUploadBytes)throw new ApiError(413,"file_too_large","Die Datei ist zu gross.");
 const socketPath=options.socketPath??env.fileScanSocket;
 if(!socketPath)return "pending";
 if(!isAbsolute(socketPath))throw unavailable();
 const timeoutMs=options.timeoutMs??15000;
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>15000)throw unavailable();
 return new Promise<ScanStatus>((resolve,reject)=>{
  const socket=createConnection({path:socketPath});
  let settled=false,sent=false,reply=Buffer.alloc(0);
  const finish=(status?:ScanStatus)=>{
   if(settled)return;settled=true;clearTimeout(deadline);socket.destroy();
   if(status)resolve(status);else reject(unavailable());
  };
  // Total deadline, not an idle timeout that an unresponsive peer can repeatedly extend.
  const deadline=setTimeout(()=>finish(),timeoutMs);
  socket.on("error",()=>finish());
  socket.on("data",chunk=>{
   if(!sent||reply.length+chunk.length>1024){finish();return;}
   reply=Buffer.concat([reply,chunk]);
  });
  socket.on("end",()=>{
   const result=reply.toString("utf8");
   if(result==="stream: OK\0")finish("clean");
   else if(/^stream: [^\x00\r\n]+ FOUND\0$/.test(result))finish("rejected");
   else finish();
  });
  socket.on("close",()=>finish());
  const write=(bytes:Buffer)=>new Promise<void>((done,fail)=>socket.write(bytes,error=>error?fail(error):done()));
  socket.once("connect",()=>{void (async()=>{
   await write(Buffer.from("zINSTREAM\0"));
   for(let offset=0;offset<body.length;offset+=64*1024){
    const chunk=body.subarray(offset,offset+64*1024),length=Buffer.alloc(4);length.writeUInt32BE(chunk.length);
    await write(Buffer.concat([length,chunk]));
   }
   sent=true;await write(Buffer.alloc(4));
  })().catch(()=>finish());});
 });
}

function unavailable(){return new ApiError(503,"file_scan_unavailable","Die Sicherheitsprüfung ist vorübergehend nicht verfügbar. Bitte erneut versuchen.");}
