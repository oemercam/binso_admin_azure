import 'server-only'
import type { PoolClient } from 'pg'
import { withTenantTransaction } from '@/lib/db/tenant'
import { query } from '@/lib/db/client'
import { sendGraphMail } from '@/lib/email/graph'
import { renderEmailDocument } from '@/modules/documents/email-document'
import type { CompanyProfile, Invoice, Quote } from '@/types/domain'

export type DocumentMailKind = 'quote' | 'invoice' | 'reminder'
export async function enqueueDocument(client: PoolClient, input: { organizationId: string; userId: string; kind: DocumentMailKind; entityId: string; to: string; key: string; state: Record<string, unknown> }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to) || input.to.length > 254) throw new Error('Ungültige E-Mail-Adresse.')
  const documents = input.state[input.kind === 'quote' ? 'quotes' : 'invoices'] as Array<Invoice | Quote> | undefined
  const document = documents?.find(item => item.id === input.entityId)
  if (!document) throw new Error('Dokument wurde nicht gefunden.')
  if (input.kind === 'quote' ? !['draft', 'sent'].includes(document.status) : ['cancelled', 'paid'].includes(document.status)) throw new Error('Dokument kann nicht versendet werden.')
  if (input.kind === 'reminder') {
    const invoice = document as Invoice
    if (invoice.status === 'draft' || invoice.due >= new Date().toISOString().slice(0, 10) || invoice.amount - invoice.paidAmount - (invoice.creditedAmount ?? 0) <= 0) throw new Error('Keine offene überfällige Rechnung.')
  }
  const html = renderEmailDocument(input.kind, document, input.state.companyProfile as CompanyProfile)
  const title = input.kind === 'quote' ? 'Angebot' : input.kind === 'invoice' ? 'Rechnung' : 'Zahlungserinnerung'
  const result = await client.query<{ id: string; status: string }>(`insert into mail_outbox
    (organization_id,deduplication_key,kind,entity_id,recipient,subject,body,attachment_html,created_by)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    on conflict (organization_id,deduplication_key) do update set deduplication_key=excluded.deduplication_key returning id,status`,
    [input.organizationId, input.key, input.kind, input.entityId, input.to, `${title} ${document.number}`,
      `Guten Tag\n\nIm Anhang erhalten Sie das Dokument ${document.number} als druckbare HTML-Datei.\n\nFreundliche Grüsse\n${(input.state.companyProfile as CompanyProfile).name}`, html, input.userId])
  await client.query(`insert into audit_events (organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail)
    values ($1,$2,$2,'mail.queued','mail_outbox',$3,$4)`, [input.organizationId, input.userId, result.rows[0].id, input.kind])
  return result.rows[0]
}

export async function queueDocument(input: { organizationId: string; userId: string; kind: DocumentMailKind; entityId: string; to: string; key: string; expectedVersion: number }) {
  return withTenantTransaction(input, async client => {
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [input.organizationId])
    const state = await client.query<{ state: Record<string, unknown>; version: string }>('select state, version::text from tenant_business_state where organization_id=$1 for update', [input.organizationId])
    if (Number(state.rows[0]?.version) !== input.expectedVersion) throw new Error('Die Daten wurden geändert. Bitte neu laden.')
    return enqueueDocument(client, { ...input, state: state.rows[0].state })
  })
}

export async function processMailOutbox() {
  // A process crash after Graph acceptance is ambiguous. Never retry it blindly.
  await query("update mail_outbox set status='uncertain', last_error='Versand unterbrochen; Absenderpostfach vor erneutem Versand prüfen.', updated_at=now() where status='sending' and updated_at < now()-interval '10 minutes'")
  let accepted = 0
  const pending = await query<{ id: string; organization_id: string }>("select id,organization_id from mail_outbox where status='queued' order by created_at limit 20")
  for (const row of pending.rows) {
    const claimed = await query<{ recipient: string; subject: string; body: string; attachment_html: string | null; kind: string; entity_id: string }>(`update mail_outbox set status='sending', attempts=attempts+1, updated_at=now() where id=$1 and status='queued'
      returning recipient,subject,body,attachment_html,kind,entity_id`, [row.id])
    const mail = claimed.rows[0]
    if (!mail) continue
    try {
      await withTenantTransaction({ organizationId: row.organization_id, userId: 'system' }, async client => {
        await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [row.organization_id])
        const record = await client.query<{ state: Record<string, unknown> }>('select state from tenant_business_state where organization_id=$1 for update', [row.organization_id])
        const access = await client.query<{is_demo:boolean}>(`select o.is_demo from platform_tenants pt join organization_subscriptions s on s.organization_id=pt.organization_id join organizations o on o.id=pt.organization_id where pt.organization_id=$1 and (pt.platform_status in ('active','past_due') or (pt.platform_status='trial' and s.trial_until>now()))`, [row.organization_id])
        if (!access.rowCount) {
          await client.query("update mail_outbox set status='cancelled',last_error='Organisation ist nicht aktiv.',updated_at=now() where id=$1", [row.id]); return
        }
        if (access.rows[0]?.is_demo) {
          await client.query("update mail_outbox set status='cancelled',last_error='Demo-Organisation: externer Versand unterdrückt.',updated_at=now() where id=$1", [row.id]); return
        }
        if (mail.kind !== 'invitation') {
          const state = record.rows[0]?.state
          const doc = (state?.[mail.kind === 'quote' ? 'quotes' : 'invoices'] as Array<Invoice | Quote> | undefined)?.find(item => item.id === mail.entity_id)
          if (!state || !doc || ['cancelled','paid','accepted','declined','revised'].includes(doc.status) || renderEmailDocument(mail.kind as DocumentMailKind, doc, state.companyProfile as CompanyProfile) !== mail.attachment_html) {
            await client.query("update mail_outbox set status='cancelled',last_error='Dokument wurde zwischenzeitlich geändert. Versand neu einplanen.',updated_at=now() where id=$1", [row.id]); return
          }
        } else {
          const invitation = await client.query("select 1 from organization_memberships where organization_id=$1 and id=$2 and status='invited' and lower(email)=lower($3)", [row.organization_id, mail.entity_id, mail.recipient])
          if (!invitation.rowCount) { await client.query("update mail_outbox set status='cancelled',updated_at=now() where id=$1", [row.id]); return }
        }
        const result = await sendGraphMail({ to: mail.recipient, subject: mail.subject, text: mail.body, htmlAttachment: mail.attachment_html ?? undefined })
        await client.query("update mail_outbox set status='accepted', provider_request_id=$2, updated_at=now() where id=$1", [row.id, result.requestId])
        if (record.rows[0] && mail.kind !== 'invitation') {
          const state = record.rows[0].state
          const key = mail.kind === 'quote' ? 'quotes' : 'invoices'
          const docs = state[key] as Array<Invoice | Quote>
          state[key] = docs.map(doc => doc.id !== mail.entity_id ? doc : { ...doc, sentTo: mail.recipient,
            ...(mail.kind === 'reminder' ? { lastReminderAt: new Date().toISOString(), reminderLevel: Math.min(3, ((doc as Invoice).reminderLevel ?? 0) + 1) } : { sentAt: new Date().toISOString(), status: doc.status === 'draft' ? 'sent' : doc.status }) })
          await client.query("update tenant_business_state set state=$2::jsonb,version=version+1,updated_by='system',updated_at=now() where organization_id=$1", [row.organization_id, JSON.stringify(state)])
        }
        await client.query(`insert into audit_events (organization_id,actor_user_id,actor_name,action,entity_type,entity_id) values ($1,'system','System','mail.accepted','mail_outbox',$2)`, [row.organization_id, row.id])
        accepted++
      })
    } catch (error) {
      await query("update mail_outbox set status='uncertain',last_error=$2,updated_at=now() where id=$1", [row.id, error instanceof Error ? error.message.slice(0, 500) : 'Versand fehlgeschlagen'])
    }
  }
  return { accepted }
}
