import {cookies} from "next/headers";
import {resolveSession,type AuthenticatedSession} from "./auth-service";
import {sessionCookie} from "./session-cookie";

export async function currentSession():Promise<AuthenticatedSession|null>{
  const store=await cookies();
  const token=store.get(sessionCookie.name)?.value;
  if(!token)return null;
  return resolveSession(token);
}

export async function requireCurrentSession(){
  const session=await currentSession();
  if(!session)throw new Error("UNAUTHENTICATED");
  return session;
}
