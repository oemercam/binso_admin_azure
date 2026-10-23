import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {sendReport,reportDeliveries} from '@/lib/server/report-mail';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,{params}:Context){try{const s=await requireSession(),{id}=await params;return json({items:await reportDeliveries(s,id)});}catch(error){return apiError(error)}}
export async function POST(request:NextRequest,{params}:Context){try{
 assertSameOrigin(request);const s=await requireSession(),{id}=await params;
 await enforceRateLimit(request,'report-mail:'+s.organizationId+':'+s.userId,6,60000);
 const body=await readJson<Record<string,unknown>>(request,18000);
 if(!body||Array.isArray(body)||Object.keys(body).some(key=>!['recipient','subject','message'].includes(key))||typeof body.recipient!=='string'||typeof body.subject!=='string'||typeof body.message!=='string')throw new ApiError(400,'invalid_report_mail','Bitte Empfänger, Betreff und Begleittext prüfen.');
 return json(await sendReport(s,id,{recipient:body.recipient,subject:body.subject,message:body.message,key:request.headers.get('Idempotency-Key')??''}));
}catch(error){return apiError(error)}}
