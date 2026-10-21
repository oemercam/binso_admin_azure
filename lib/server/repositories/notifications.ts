import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {tenantCanOpenPath} from '@/lib/permissions';

type Notification={id:string;href:string|null;readAt:string|null};
export async function notificationList(c:PoolClient,s:SessionUser){
 const rows=(await c.query<Notification>(`select n.id,n.kind,n.title,n.body,n.body as message,n.href,
 coalesce(r.read_at,case when n.user_id=$2 then n.read_at end) as read_at,
 coalesce(r.read_at,case when n.user_id=$2 then n.read_at end) as "readAt",n.created_at,n.created_at as "createdAt"
 from in_app_notifications n left join notification_reads r on r.notification_id=n.id and r.organization_id=n.organization_id and r.user_id=$2
 where n.organization_id=$1 and (n.user_id is null or n.user_id=$2) and ($3::boolean=false or n.user_id=$2)
 order by n.created_at desc limit 100`,[s.organizationId,s.userId,s.moduleProfile==='time_only'])).rows;
 return rows.filter(item=>item.href?tenantCanOpenPath(s.role,item.href.split('?')[0],s.moduleProfile):s.moduleProfile!=='time_only');
}
export async function markNotificationsRead(c:PoolClient,s:SessionUser,id:string|null){
 await c.query(`insert into notification_reads(organization_id,notification_id,user_id)
 select n.organization_id,n.id,$2 from in_app_notifications n
 where n.organization_id=$1 and (n.user_id is null or n.user_id=$2) and ($3::text is null or n.id::text=$3)
 and ($4::boolean=false or n.user_id=$2)
 on conflict(notification_id,user_id) do nothing`,[s.organizationId,s.userId,id,s.moduleProfile==='time_only']);
}
