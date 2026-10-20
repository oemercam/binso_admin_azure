import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {beginPasskeyRegistration,beginPasskeyAuthentication} from '@/lib/server/passkeys';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'passkey-options',10,15*60_000);
 const b=await readJson<{mode?:unknown;password?:unknown;code?:unknown;label?:unknown}>(request,8192);
 if(b.mode==='authenticate')return json(await beginPasskeyAuthentication());
 if(b.mode!=='register')throw new ApiError(400,'action_invalid','Ungültige Aktion.');
 return json(await beginPasskeyRegistration(await requireSession(),b.password,b.code,b.label));
}catch(e){return apiError(e)}}
