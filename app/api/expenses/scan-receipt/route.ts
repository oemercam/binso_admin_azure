import {NextRequest} from 'next/server';
import {ApiError,apiError,assertSameOrigin,json,readBoundedBody} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {limitsConfig} from '@/config/limits';
import {scanReceipt,receiptEndpoint} from '@/lib/server/receipt-scan';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const session=await requireSession();authorize(session,'expenses:write');
 const endpoint=process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT??'',key=process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY??'';
 receiptEndpoint(endpoint);if(!key)throw new ApiError(503,'receipt_scan_unavailable','Belegerkennung ist noch nicht konfiguriert.');
 await enforceRateLimit(request,'receipt-scan:'+session.organizationId+':'+session.userId,limitsConfig.receiptScanRequestsPerMinute,60_000);
 const body=await readBoundedBody(request,limitsConfig.maxFileUploadBytes+256*1024);
 let form:FormData;try{form=await new Request(request.url,{method:'POST',headers:request.headers,body:new Uint8Array(body)}).formData();}catch{throw new ApiError(400,'file_required','Beleg fehlt.');}
 const file=form.get('file');if(!(file instanceof File))throw new ApiError(400,'file_required','Beleg fehlt.');
 return json(await scanReceipt({file,endpoint,key,signal:request.signal}));
}catch(error){return apiError(error)}}
