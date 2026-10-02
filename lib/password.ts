import {randomBytes,scrypt as nodeScrypt,timingSafeEqual} from "node:crypto";
import {promisify} from "node:util";

const scrypt=promisify(nodeScrypt);
export const passwordPolicy={minLength:12,maxLength:128};

export function validatePassword(value:string){
  if(value.length<passwordPolicy.minLength||value.length>passwordPolicy.maxLength)return false;
  return /[A-Za-z]/.test(value)&&/\d/.test(value);
}

export async function hashPassword(value:string){
  if(!validatePassword(value))throw new Error("PASSWORD_POLICY");
  const salt=randomBytes(16);
  const derived=await scrypt(value,salt,64) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export async function verifyPassword(value:string,encoded:string){
  const [algorithm,saltText,hashText]=encoded.split(":");
  if(algorithm!=="scrypt"||!saltText||!hashText)return false;
  try{
    const salt=Buffer.from(saltText,"base64url");
    const expected=Buffer.from(hashText,"base64url");
    const actual=await scrypt(value,salt,expected.length) as Buffer;
    return expected.length===actual.length&&timingSafeEqual(expected,actual);
  }catch{
    return false;
  }
}
