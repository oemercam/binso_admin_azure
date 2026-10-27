import {NextRequest} from 'next/server';
import type {RegistrationResponseJSON,AuthenticationResponseJSON} from '@simplewebauthn/server';
import {requireSession} from '@/lib/server/session';
import {finishPasskeyRegistration,finishPasskeyAuthentication} from '@/lib/server/passkeys';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'passkey-verify',10,15*60_000);
 const b=await readJson<{mode?:unknown;response?:unknown;code?:unknown;remember?:unknown}>(request,65536);
 if(!b.response||typeof b.response!=='object'||!('id' in b.response)||typeof b.response.id!=='string'||b.response.id.length>2048)throw new ApiError(400,'passkey_invalid','Ungültige Passkey-Antwort.');
 if(b.mode==='authenticate')throw new ApiError(410,'password_login_required','Bitte melde dich mit E-Mail und Passwort an.');
 if(b.mode==='reauthenticate')return json(await finishPasskeyAuthentication(b.response as AuthenticationResponseJSON,undefined,false,await requireSession({allowMfaEnrollment:true})));
 if(b.mode!=='register')throw new ApiError(400,'action_invalid','Ungültige Aktion.');
 return json(await finishPasskeyRegistration(await requireSession({allowMfaEnrollment:true}),b.response as RegistrationResponseJSON));
}catch(e){return apiError(e)}}
