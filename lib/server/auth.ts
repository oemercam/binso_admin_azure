import "server-only";
import { getSession, requireSession } from "@/lib/server/session";

export async function requireUser(){
 const session=await requireSession();
 return {user:{id:session.userId,email:session.email,user_metadata:{name:session.name}},session};
}
export async function requireUserNoRefresh(){return requireUser();}
export async function getAccessToken(){return null;}
export async function currentUser(){return getSession();}
