import 'server-only';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import {withTenant} from './db';
import {audit} from './audit';
import {mailLayout,sendMail} from './email';
export type NoticeIdentity={organizationId:string;userId:string;email:string};
/** Audit and queue atomically with the security change; uncertain delivery is not retried. */
export async function queueSecurityNotice(c:PoolClient,s:NoticeIdentity,action:string,text:string){
 const event=randomUUID();
 const language=(await c.query('select language from app_users where id=$1',[s.userId])).rows[0]?.language??'de';
 let locale:'de'|'en'|'fr'|'it'|'tr'='de';
 let title='Kontosicherheit',subject='Binso One Kontosicherheit',body=text;
 if(language!=='de'){const {asLocale,translateMessage}=await import('@/lib/locales');locale=asLocale(language);title=translateMessage(title,locale);subject=translateMessage(subject,locale);body=translateMessage(body,locale);}
 await audit(c,{organizationId:s.organizationId,userId:s.userId,action,entityType:'app_users',entityId:s.userId});
 await c.query(`insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,attachment_html,created_by)
 values($1,$2,'security',$2,$3,$4,$5,$6,$7)`,[s.organizationId,event,s.email,subject,body,mailLayout(title,'<p>'+body+'</p>',undefined,locale),s.userId]);
 return event;
}
export async function deliverSecurityNotice(s:NoticeIdentity,event:string){
 const row=await withTenant(s.organizationId,s.userId,async c=>(await c.query("update mail_outbox set status='sending',attempts=attempts+1,updated_at=now() where organization_id=$1 and deduplication_key=$2 and kind='security' and status='queued' returning *",[s.organizationId,event])).rows[0]);
 if(!row)return 'unknown';
 let status='uncertain';try{status=(await sendMail({to:row.recipient,subject:row.subject,text:row.body,html:row.attachment_html})).delivered?'accepted':'failed';}catch{/* Never repeat a committed change on uncertain mail. */}
 await withTenant(s.organizationId,s.userId,c=>c.query("update mail_outbox set status=$3,updated_at=now() where organization_id=$1 and id=$2 and status='sending'",[s.organizationId,row.id,status]));
 return status;
}
