import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {prepareReportExport} from '@/lib/server/report-exports';
import type {Locale} from '@/lib/locales';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'reports:read');
 await enforceRateLimit(request,'report-export:'+s.organizationId+':'+s.userId,12,60000);
 const body=await readJson<Record<string,unknown>>(request,6144);
 if(!body||Array.isArray(body)||Object.keys(body).some(key=>!['query','locale'].includes(key))||typeof body.query!=='string'||body.query.length>4096||typeof body.locale!=='string'||!['de','fr','it','en'].includes(body.locale))throw new ApiError(400,'invalid_report_filter','Bitte die Berichtsfilter und Sprache prüfen.');
 const key=request.headers.get('Idempotency-Key')??'';
 if(key.length<8||key.length>128)throw new ApiError(400,'idempotency_required','Idempotency-Key fehlt oder ist ungültig.');
 return json({item:await prepareReportExport(s,new URLSearchParams(body.query),body.locale as Locale,key)});
}catch(error){return apiError(error)}}
