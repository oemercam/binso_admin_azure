import {NextRequest} from 'next/server';
import {ApiError,apiError,assertSameOrigin,json,jsonHeaders,readJson} from '@/lib/server/http';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {requestReportCode,verifiedReportPdf} from '@/lib/server/public-reports';
export const runtime='nodejs';
// No GET: visiting/scanning a link cannot request mail or release PDF bytes.
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'public-report',30,60000);
 const body=await readJson<Record<string,unknown>>(request,2048);
 if(!body||Array.isArray(body)||typeof body!=='object'||typeof body.token!=='string'||body.token.length!==43)throw new ApiError(400,'invalid_report_share','Bitte den vollständigen Berichtslink öffnen.');
 if(body.action==='challenge'&&Object.keys(body).every(key=>['token','action'].includes(key))){await enforceRateLimit(request,'public-report-code',5,15*60000);return json(await requestReportCode(body.token));}
 if(body.action!=='pdf'||Object.keys(body).some(key=>!['token','action','code','key'].includes(key))||typeof body.code!=='string'||typeof body.key!=='string')throw new ApiError(400,'invalid_report_code','Bitte den sechsstelligen Code eingeben.');
 const report=await verifiedReportPdf(body.token,body.code,body.key);
 return new Response(new Uint8Array(report.pdf),{headers:{...jsonHeaders,'Content-Type':'application/pdf','Content-Disposition':'inline; filename="'+report.fileName+'"','Referrer-Policy':'no-referrer'}});
}catch(error){return apiError(error)}}
