import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,json} from '@/lib/server/http';
/** Assignment-bounded picker; never exposes customer dossiers, prices or totals. */
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'time:read');
 const p=request.nextUrl.searchParams,kind=p.get('kind'),q=(p.get('q')??'').trim(),id=(p.get('id')??'').replace(/^eq\./,''),customer=(p.get('customer_id')??p.get('customerId')??'').replace(/^eq\./,'');
 const limit=Number(p.get('limit')??50),offset=Number(p.get('offset')??0);
 if(!['customers','projects'].includes(kind??'')||q.length>200||!Number.isInteger(limit)||limit<1||limit>50||!Number.isInteger(offset)||offset<0||offset>100000)throw new ApiError(400,'picker_invalid','Ungültige Auswahl.');
 return json(await withTenant(s.organizationId,s.userId,async c=>{
  const projects=kind==='projects',values:unknown[]=[s.organizationId],where=['x.organization_id=$1','x.archived_at is null'];
  const bind=(v:unknown)=>{values.push(v);return '$'+values.length};
  where.push(projects?'app_workforce_access(x.customer_id,x.id,current_date,true)':'app_workforce_access(x.id,null,current_date,false)');
  if(q)where.push('x.name ilike '+bind('%'+q.replace(/[\\%_]/g,'\\$&')+'%'));
  if(id)where.push('x.id::text='+bind(id));
  if(projects&&customer)where.push('x.customer_id::text='+bind(customer));
  const from=' from '+(projects?'projects':'customers')+' x where '+where.join(' and ');
  const total=(await c.query('select count(*)::int total'+from,values)).rows[0]?.total??0;
  const items=(await c.query('select x.id,x.name'+(projects?',x.customer_id,x.status':'')+from+' order by x.name,x.id limit '+bind(limit)+' offset '+bind(offset),values)).rows;
  return {items,total:Number(total)};
 },{snapshot:true}));
}catch(error){return apiError(error)}}
