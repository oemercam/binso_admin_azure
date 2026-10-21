import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {authorizeCustomerMergeReview,previewCustomerMerge,commitCustomerMerge,cancelCustomerMerge,customerMergeStatus} from '@/lib/server/repositories/customer-merge';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorizeCustomerMergeReview(s);await requireModuleEntitlement(s.organizationId,'kunden');
 await enforceRateLimit(request,'customer-merge:'+s.organizationId+':'+s.userId,20,60000);
 const body=await readJson<Record<string,unknown>>(request,2048),uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!body||Array.isArray(body))throw new ApiError(400,'invalid_merge','Bitte die Kundenauswahl prüfen.');
 if(body.action==='status'){
  if(Object.keys(body).some(k=>!['action','key'].includes(k))||typeof body.key!=='string'||!uuid.test(body.key))throw new ApiError(400,'invalid_merge','Ungültige Vorgangskennung.');
  return json(await customerMergeStatus(s,body.key.toLowerCase()));
 }
 if(!['preview','commit','cancel'].includes(String(body.action))||Object.keys(body).some(k=>!['action','sourceId','targetId','revision','confirmed'].includes(k))||typeof body.sourceId!=='string'||!uuid.test(body.sourceId)||typeof body.targetId!=='string'||!uuid.test(body.targetId))throw new ApiError(400,'invalid_merge','Bitte zwei gültige Kunden wählen.');
 const sourceId=body.sourceId.toLowerCase(),targetId=body.targetId.toLowerCase();
 if(sourceId===targetId)throw new ApiError(400,'invalid_merge','Bitte zwei unterschiedliche Kunden wählen.');
 if(body.action==='preview'){if(body.revision!==undefined||body.confirmed!==undefined)throw new ApiError(400,'invalid_merge','Bitte die Kundenauswahl erneut prüfen.');return json({item:await previewCustomerMerge(s,sourceId,targetId)});}
 const key=request.headers.get('Idempotency-Key')??'';
 if(!uuid.test(key)||typeof body.revision!=='string'||!/^[a-f0-9]{64}$/.test(body.revision)||body.action==='commit'&&body.confirmed!==true||body.action==='cancel'&&body.confirmed!==undefined)throw new ApiError(400,'invalid_merge','Die geprüfte Vorschau muss ausdrücklich bestätigt werden.');
 if(body.action==='cancel')return json(await cancelCustomerMerge(s,sourceId,targetId,body.revision,key.toLowerCase()));
 return json(await commitCustomerMerge(s,sourceId,targetId,body.revision,key.toLowerCase()));
}catch(error){return apiError(error)}}
