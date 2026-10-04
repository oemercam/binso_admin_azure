import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireSession } from '@/lib/server/session';
import { authorize } from '@/lib/server/rbac';
import { withTenant } from '@/lib/server/db';
import { ApiError,apiError,assertSameOrigin,cleanText,json,readJson } from '@/lib/server/http';
export async function GET(){
 try{const s=await requireSession();authorize(s,'support:read');const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query('select id,case_number,subject,category,priority,status,created_at,updated_at from support_cases where organization_id=$1 order by updated_at desc limit 500',[s.organizationId])).rows);return json({items})}catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,'support:write');
  const b=await readJson<Record<string,unknown>>(request);const subject=cleanText(b.subject,160),message=cleanText(b.message,5000);
  if(subject.length<3||!message)throw new ApiError(400,'invalid_ticket','Betreff und Nachricht sind erforderlich.');
  const categories:Record<string,string>={'Allgemeine Frage':'question','Rechnung':'billing','Zeiterfassung':'usage','Technisches Problem':'technical'};
  const requestedCategory=categories[String(b.category)]??String(b.category);
  const category=['question','technical','usage','billing','account','security','idea','other'].includes(requestedCategory)?requestedCategory:'question';
  const priority=['low','normal','high','urgent'].includes(String(b.priority))?String(b.priority):'normal';
  const item=await withTenant(s.organizationId,s.userId,async c=>{
   const id=randomUUID();const r=await c.query("insert into support_cases(id,organization_id,case_number,created_by_user_id,category,subject,status,description,priority,browser,build_version) values($1,$2,$3,$4,$5,$6,'open',$7,$8,$9,$10) returning id,subject,status",[id,s.organizationId,'T-'+id,s.userId,category,subject,message,priority,request.headers.get("user-agent")?.slice(0,500)??null,process.env.BINSO_BUILD_SHA??null]);
   await c.query("insert into support_messages(case_id,author_type,author_user_id,message) values($1,'customer',$2,$3)",[id,s.userId,message]);return r.rows[0];
  });return json({item},201);
 }catch(e){return apiError(e)}
}
