import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/server/session';
import { authorize } from '@/lib/server/rbac';
import { withTenant } from '@/lib/server/db';
import { ApiError,apiError,assertSameOrigin,cleanText,json,readJson } from '@/lib/server/http';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const s=await requireSession();authorize(s,'support:read');const {id}=await params;
 const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query('select m.id,m.case_id ticket_id,m.author_user_id,m.author_type,m.message body,m.created_at from support_messages m join support_cases t on t.id=m.case_id where t.organization_id=$1 and t.id::text=$2 and not m.internal order by m.created_at',[s.organizationId,id])).rows);return json({items})}catch(e){return apiError(e)}
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{assertSameOrigin(request);const s=await requireSession();authorize(s,'support:write');const {id}=await params;const b=await readJson<{body?:unknown}>(request);const message=cleanText(b.body,5000);if(!message)throw new ApiError(400,'message_required','Nachricht darf nicht leer sein.');
 const item=await withTenant(s.organizationId,s.userId,async c=>{
  const ticket=await c.query('select id from support_cases where organization_id=$1 and id::text=$2',[s.organizationId,id]);if(!ticket.rowCount)throw new ApiError(404,'not_found','Ticket wurde nicht gefunden.');
  return (await c.query("insert into support_messages(case_id,author_type,author_user_id,message) values($1,'customer',$2,$3) returning id,message body,created_at",[ticket.rows[0].id,s.userId,message])).rows[0];
 });return json({item},201)}catch(e){return apiError(e)}
}
