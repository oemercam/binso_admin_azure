import 'server-only';
import type {PoolClient} from 'pg';
/** All reads run in the caller's platform read-only snapshot. Demo data is excluded. */
export async function observabilityReadings(c:PoolClient,{billing,audit}:{billing:boolean;audit:boolean}){
 const incidents=await c.query("select severity,count(*)::int count from platform_incidents where status<>'resolved' group by severity");
 // Document dispatch has its own existing ledger. Historical failed entries
 // cannot prove non-delivery; preserve their conservative uncertain meaning.
 const queue=await c.query(`select status,count(*)::int count from (
  select m.status from mail_outbox m join organizations o on o.id=m.organization_id
   where not o.is_demo and (m.status in ('queued','failed','uncertain') or m.status='sending' and m.updated_at<now()-interval '5 minutes')
  union all
  select case d.status when 'not_attempted' then 'failed' when 'failed' then 'uncertain' else d.status end
   from document_deliveries d join organizations o on o.id=d.organization_id
   where not o.is_demo and (d.status in ('not_attempted','failed','uncertain') or d.status='sending' and d.created_at<now()-interval '5 minutes')
    and (d.status<>'not_attempted' or not exists (
     select 1 from document_deliveries later where later.organization_id=d.organization_id
      and later.document_id=d.document_id and later.kind=d.kind and later.recipient=d.recipient
      and later.purpose=d.purpose and later.created_at>d.created_at
      and later.status='sent' and later.completed_at is not null
    ))
 ) deliveries group by status`);
 const vitals=await c.query<{metric:string;value:number;created_at:string}>("select metric,value,created_at from web_vitals where created_at>=now()-interval '24 hours' order by created_at desc limit 5000");
 const events=await c.query("select severity,count(*)::int count from application_events e left join organizations o on o.id=e.organization_id where e.created_at>=now()-interval '24 hours' and (e.organization_id is null or not o.is_demo) group by severity");
 const business=await c.query(`select count(*)::int customers, count(*) filter(where o.created_at>=now()-interval '24 hours')::int registrations_24h, count(*) filter(where s.status='active')::int subscriptions from organizations o left join organization_subscriptions s on s.organization_id=o.id where not o.is_demo`);
 const finance=billing?(await c.query(`select (select coalesce(sum(p.amount),0) from platform_billing_payments p join organizations o on o.id=p.organization_id where not o.is_demo and p.provider<>'demo' and p.currency='CHF' and p.payment_date between current_date-29 and current_date) payments_30d, (select count(*)::int from organization_subscriptions s join organizations o on o.id=s.organization_id where not o.is_demo and s.status='past_due') past_due, (select count(*)::int from billing_webhook_events e left join organizations o on o.id=e.organization_id where e.received_at>=now()-interval '24 hours' and e.status='failed' and (e.organization_id is null or not o.is_demo)) webhook_failed`)).rows[0]:null;
 const security=audit?(await c.query("select count(*)::int count from platform_audit_events where created_at>=now()-interval '24 hours'")).rows[0]:null;
 return {incidents:incidents.rows,queue:queue.rows,vitals:vitals.rows,events:events.rows,business:business.rows[0],finance,security};
}
