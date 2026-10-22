import {NextRequest} from 'next/server';
import {apiError,assertSameOrigin,json,readJson,ApiError} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {readSetupGuide,readInvoiceReadiness,setSetupGuideDismissed} from '@/lib/server/business-readiness';
export async function GET(request:NextRequest){
 try{const s=await requireSession(),action=request.nextUrl.searchParams.get('action');if(action&&action!=='issue_invoice')throw new ApiError(400,'action_invalid','Ungültige Aktion.');return json(await withTenant(s.organizationId,s.userId,async c=>({item:action?await readInvoiceReadiness(c,s,request.nextUrl.searchParams.get('number')??''):await readSetupGuide(c,s)}),{snapshot:true}));}
 catch(error){return apiError(error);}
}
export async function PATCH(request:NextRequest){
 try{assertSameOrigin(request);const s=await requireSession(),body=await readJson<Record<string,unknown>>(request,1024);if(!body||Array.isArray(body)||Object.keys(body).length!==1||!Object.hasOwn(body,'dismissed'))throw new ApiError(400,'preference_invalid','Bitte eine gültige Einstellung wählen.');return json(await withTenant(s.organizationId,s.userId,async c=>({item:await setSetupGuideDismissed(c,s,body.dismissed)})));}
 catch(error){return apiError(error);}
}
