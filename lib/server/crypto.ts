import "server-only";
import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
import {env} from "@/lib/server/env";

function key(){
 const value=env.appEncryptionKey;
 if(!value)throw new Error("APP_ENCRYPTION_KEY is required for encrypted secrets.");
 return createHash("sha256").update(value).digest();
}
export function encryptSecret(value:string){
 const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key(),iv);
 const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);const tag=cipher.getAuthTag();
 return [iv,tag,encrypted].map(x=>x.toString("base64url")).join(".");
}
export function decryptSecret(value:string){
 const [ivRaw,tagRaw,dataRaw]=value.split(".");if(!ivRaw||!tagRaw||!dataRaw)throw new Error("Invalid encrypted secret.");
 const decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(ivRaw,"base64url"));
 decipher.setAuthTag(Buffer.from(tagRaw,"base64url"));
 return Buffer.concat([decipher.update(Buffer.from(dataRaw,"base64url")),decipher.final()]).toString("utf8");
}
