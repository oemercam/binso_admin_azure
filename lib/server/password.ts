import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt=promisify(scryptCallback);
const KEY_LENGTH=64;

export async function hashPassword(password:string){
  if(password.length<12)throw new Error("Password must be at least 12 characters.");
  const salt=randomBytes(16).toString("hex");
  const derived=await scrypt(password,salt,KEY_LENGTH) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}
export async function verifyPassword(password:string,stored:string){
  const [algo,salt,hash]=stored.split("$");
  if(algo!=="scrypt"||!salt||!hash)return false;
  const derived=await scrypt(password,salt,KEY_LENGTH) as Buffer;
  const expected=Buffer.from(hash,"hex");
  return expected.length===derived.length&&timingSafeEqual(expected,derived);
}
