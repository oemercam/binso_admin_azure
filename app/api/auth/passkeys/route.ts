import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {listPasskeys,removePasskey,renamePasskey,passkeyOffer,deferPasskeyOffer,rotatePasskeyRecovery} from '@/lib/server/passkeys';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function GET(){try{const s=await requireSession({allowMfaEnrollment:true});return json({items:s.isDemo?[]:await listPasskeys(s),offer:s.isDemo?false:await passkeyOffer(s)});}catch(e){return apiError(e)}}
export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'passkey-manage',10,15*60_000);
 const s=await requireSession({allowMfaEnrollment:true}),body=await readJson<{action?:unknown;id?:unknown;label?:unknown}>(request,8192);
 if(s.isDemo)throw new ApiError(403,'demo_security_unavailable','Passkeys sind im Testzugang deaktiviert.');
 if(body.action==='later')return json(await deferPasskeyOffer(s));
 if(body.action==='recovery')return json(await rotatePasskeyRecovery(s));
 if(body.action==='rename')return json(await renamePasskey(s,body.id,body.label));
 throw new ApiError(400,'action_invalid','Ungültige Aktion.');
}catch(e){return apiError(e)}}
export async function DELETE(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'passkey-remove',5,15*60_000);
 const s=await requireSession(),body=await readJson<{id?:unknown;password?:unknown;code?:unknown}>(request,8192);
 return json(await removePasskey(s,body.id,body.password,body.code));
}catch(e){return apiError(e)}}
