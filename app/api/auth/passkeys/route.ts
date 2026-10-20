import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {listPasskeys,removePasskey} from '@/lib/server/passkeys';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function GET(){try{const s=await requireSession();return json({items:s.isDemo?[]:await listPasskeys(s)});}catch(e){return apiError(e)}}
export async function DELETE(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'passkey-remove',5,15*60_000);
 const s=await requireSession(),body=await readJson<{id?:unknown;password?:unknown;code?:unknown}>(request,8192);
 return json(await removePasskey(s,body.id,body.password,body.code));
}catch(e){return apiError(e)}}
