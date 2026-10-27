import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {beginPasskeyRegistration,beginPasskeyAuthentication} from '@/lib/server/passkeys';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'passkey-options',10,15*60_000);
 const b=await readJson<{mode?:unknown;password?:unknown;code?:unknown;label?:unknown}>(request,8192);
 if(b.mode==='authenticate')throw new ApiError(410,'password_login_required','Bitte melde dich mit E-Mail und Passwort an.');
 if(b.mode==='reauthenticate')return json(await beginPasskeyAuthentication(await requireSession({allowMfaEnrollment:true})));
 if(b.mode!=='register')throw new ApiError(400,'action_invalid','Ungültige Aktion.');
 return json(await beginPasskeyRegistration(await requireSession({allowMfaEnrollment:true}),b.password,b.code,b.label));
}catch(e){return apiError(e)}}
