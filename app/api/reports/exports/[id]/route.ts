import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {apiError,jsonHeaders} from '@/lib/server/http';
import {getOrganizationPlan} from '@/lib/server/plan-access';
import {readReportExport} from '@/lib/server/report-exports';
export const runtime='nodejs';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession(),{id}=await params,plan=await getOrganizationPlan(s.organizationId);
 const report=await withTenant(s.organizationId,s.userId,c=>readReportExport(c,s,id,plan),{snapshot:true});
 return new Response(new Uint8Array(report.pdf),{headers:{...jsonHeaders,'Content-Type':'application/pdf','Content-Disposition':'inline; filename="'+report.fileName+'"'}});
}catch(error){return apiError(error)}}
