import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {createReportShare,reportShares,revokeReportShare} from '@/lib/server/public-reports';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,{params}:Context){try{const s=await requireSession(),{id}=await params;return json({items:await reportShares(s,id)});}catch(error){return apiError(error)}}
export async function POST(request:NextRequest,{params}:Context){try{
 assertSameOrigin(request);const s=await requireSession(),{id}=await params;await enforceRateLimit(request,'report-share:'+s.organizationId+':'+s.userId,20,60000);
 const body=await readJson<Record<string,unknown>>(request,4096);
 if(!body||Array.isArray(body)||typeof body!=='object')throw new ApiError(400,'invalid_report_share','Bitte Empfänger und Gültigkeit prüfen.');
 if(body.action==='revoke'&&Object.keys(body).every(key=>['action','linkId'].includes(key))&&typeof body.linkId==='string')return json(await revokeReportShare(s,id,body.linkId));
 if(body.action!=='create'||Object.keys(body).some(key=>!['action','recipient','days'].includes(key))||typeof body.recipient!=='string'||typeof body.days!=='number')throw new ApiError(400,'invalid_report_share','Bitte Empfänger und Gültigkeit prüfen.');
 return json({item:await createReportShare(s,id,body.recipient,body.days,request.headers.get('Idempotency-Key')??'')});
}catch(error){return apiError(error)}}
