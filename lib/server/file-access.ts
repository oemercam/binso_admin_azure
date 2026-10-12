import "server-only";
import {env} from "./env";

/** Explicit prelaunch exception; never changes a stored scanner verdict. */
export function accessibleFileStatuses():string[]{
 return env.releaseProfile==="development-20261012"&&env.fileAccessMode==="authenticated-unscanned"&&!env.fileScanSocket?["clean","pending"]:["clean"];
}
export function canAccessFile(status:string){return accessibleFileStatuses().includes(status);}
