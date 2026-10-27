import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {ApiError,apiError,assertSameOrigin,json} from '@/lib/server/http';
/** Historical tenant MFA flags no longer control customer login. */
export async function GET(){try{
 const session=await requireSession();authorize(session,'users:manage');
 return json({item:{required:false,loginMethod:'password'}});
}catch(error){return apiError(error)}}
export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);const session=await requireSession();authorize(session,'users:manage');
 throw new ApiError(410,'password_login_required','Die Kundenanmeldung verwendet E-Mail und Passwort.');
}catch(error){return apiError(error)}}
