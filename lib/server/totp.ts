import "server-only";
import {createHmac,randomBytes,createHash,timingSafeEqual} from "node:crypto";

const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(buffer:Buffer){let bits="";for(const byte of buffer)bits+=byte.toString(2).padStart(8,"0");let out="";for(let i=0;i<bits.length;i+=5)out+=alphabet[parseInt(bits.slice(i,i+5).padEnd(5,"0"),2)];return out}
function base32Decode(input:string){const clean=input.toUpperCase().replace(/[^A-Z2-7]/g,"");let bits="";for(const c of clean)bits+=alphabet.indexOf(c).toString(2).padStart(5,"0");const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));return Buffer.from(bytes)}
export function generateTotpSecret(){return base32Encode(randomBytes(20))}
export function totp(secret:string,time=Date.now(),step=30,digits=6){const counter=Math.floor(time/1000/step);const buf=Buffer.alloc(8);buf.writeBigUInt64BE(BigInt(counter));const h=createHmac("sha1",base32Decode(secret)).update(buf).digest();const offset=h[h.length-1]&15;const code=((h.readUInt32BE(offset)&0x7fffffff)%10**digits).toString().padStart(digits,"0");return code}
export function verifyTotp(secret:string,code:string){const normalized=code.replace(/\s/g,"");for(const drift of [-1,0,1]){const expected=totp(secret,Date.now()+drift*30_000);const a=Buffer.from(expected);const b=Buffer.from(normalized);if(a.length===b.length&&timingSafeEqual(a,b))return true}return false}
export function generateRecoveryCodes(){return Array.from({length:8},()=>`${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`)}
export function hashRecoveryCode(code:string){return createHash("sha256").update(code.toUpperCase()).digest("hex")}
