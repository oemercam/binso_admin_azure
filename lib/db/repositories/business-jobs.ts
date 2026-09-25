import 'server-only'
import { query } from '@/lib/db/client'
import { withTenantTransaction } from '@/lib/db/tenant'
import { enqueueDocument, processMailOutbox } from './mail-outbox'
import { graphMailConfigured } from '@/lib/email/graph'
import { advanceContractDate } from '@/modules/contracts/schedule'
import { calculateInvoiceTotals } from '@/modules/invoices/calculations'
import { nextInvoiceNumber } from '@/modules/documents/numbering'
import { formatMonthYear, todayZurichIso } from '@/lib/format/locale'
import type { AppSettings, Contract, Customer, DocumentTemplates, Invoice } from '@/types/domain'
import { recordApplicationEvent } from './application-events'

export async function runBusinessJobs() {
  const run = await query<{ id: string }>("insert into job_runs(job_name,status) values ('business-lifecycle','running') returning id")
  const summary = { invoicesCreated: 0, remindersQueued: 0, tenantErrors: 0, accepted: 0 }
  try {
    const tenants = await query<{ organization_id: string }>(`select pt.organization_id from platform_tenants pt
      join organization_subscriptions s on s.organization_id=pt.organization_id
      join organizations o on o.id=pt.organization_id and o.is_demo=false
      where pt.platform_status in ('active','past_due') or (pt.platform_status='trial' and s.trial_until>now())`)
    const today = todayZurichIso()
    for (const tenant of tenants.rows) {
      try {
        const result = await withTenantTransaction({ organizationId: tenant.organization_id, userId: 'system' }, async client => {
          await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [tenant.organization_id])
          const record = await client.query<{ state: Record<string, unknown> }>('select state from tenant_business_state where organization_id=$1 for update', [tenant.organization_id])
          if (!record.rows[0]) return { invoicesCreated: 0, remindersQueued: 0 }
          const state = record.rows[0].state
          const contracts = (state.contracts ?? []) as Contract[]
          const invoices = (state.invoices ?? []) as Invoice[]
          const customers = (state.customers ?? []) as Customer[]
          const settings = state.appSettings as AppSettings | undefined
          const templates = state.documentTemplates as DocumentTemplates | undefined
          let created = 0, reminders = 0
          for (const contract of contracts) {
            if (contract.status !== 'active' || contract.billingInterval === 'none' || !contract.nextInvoiceDate || contract.nextInvoiceDate > today || contract.startDate > today || (contract.endDate && contract.nextInvoiceDate > contract.endDate)) continue
            const billingDate = contract.nextInvoiceDate
            const period = formatMonthYear(billingDate)
            if (invoices.some(invoice => invoice.contractId === contract.id && (invoice.period === period || invoice.period === billingDate.slice(0, 7)) && invoice.status !== 'cancelled')) continue
            const customer = customers.find(item => item.id === contract.customerId)
            if (!customer || !contract.lines.length) continue
            const due = new Date(`${today}T12:00:00Z`)
            due.setUTCDate(due.getUTCDate() + (Number.isFinite(customer.paymentDays) ? customer.paymentDays : 30))
            const lines = contract.lines.map(line => ({ ...line, id: crypto.randomUUID(), sourceTimeEntryIds: [] }))
            invoices.unshift({ id: crypto.randomUUID(), organizationId: tenant.organization_id, number: nextInvoiceNumber(invoices.map(item => item.number), new Date(`${today}T12:00:00Z`)),
              customerId: customer.id, customerName: customer.name, contractId: contract.id, contractName: contract.name, kind: 'recurring', period,
              issueDate: today, due: due.toISOString().slice(0, 10), status: 'draft', lines, ...calculateInvoiceTotals(lines), paidAmount: 0,
              recipientName: customer.legalName || customer.name, recipientAddress: customer.address, recipientZip: customer.zip, recipientCity: customer.city, recipientCountry: customer.country, recipientEmail: customer.email,
              introText: templates?.invoiceIntro, outroText: templates?.invoiceOutro, reference: contract.reference })
            contract.nextInvoiceDate = advanceContractDate(billingDate, contract.billingInterval)
            created++
          }
          state.invoices = invoices
          if (settings?.reminders.enabled && settings.reminders.automaticSend && graphMailConfigured()) {
            const weekday = new Date(`${today}T12:00:00Z`).getUTCDay()
            if (!settings.reminders.onlyBusinessDays || (weekday !== 0 && weekday !== 6)) {
              for (const invoice of invoices) {
                const level = invoice.reminderLevel ?? 0
                const threshold = [settings.reminders.firstAfterDays, settings.reminders.secondAfterDays, settings.reminders.thirdAfterDays][level]
                if (level >= 3 || !Number.isFinite(threshold) || threshold < 1 || !['sent','partial','overdue'].includes(invoice.status) || !invoice.recipientEmail || invoice.amount - invoice.paidAmount - (invoice.creditedAmount ?? 0) <= 0) continue
                const daysLate = (Date.parse(today) - Date.parse(invoice.due)) / 86_400_000
                if (daysLate < threshold) continue
                const key = `reminder-${invoice.id}-${level + 1}`
                const existing = await client.query('select 1 from mail_outbox where organization_id=$1 and deduplication_key=$2', [tenant.organization_id, key])
                if (existing.rowCount) continue
                await enqueueDocument(client, { organizationId: tenant.organization_id, userId: 'system', kind: 'reminder', entityId: invoice.id, to: invoice.recipientEmail, key, state })
                reminders++
              }
            }
          }
          if (created) {
            await client.query("update tenant_business_state set state=$2::jsonb,version=version+1,updated_by='system',updated_at=now() where organization_id=$1", [tenant.organization_id, JSON.stringify(state)])
            await client.query(`insert into audit_events (organization_id,actor_user_id,actor_name,action,entity_type,detail) values ($1,'system','System','contracts.invoiced','invoice',$2)`, [tenant.organization_id, `${created} Entwürfe`])
          }
          return { invoicesCreated: created, remindersQueued: reminders }
        })
        summary.invoicesCreated += result.invoicesCreated
        summary.remindersQueued += result.remindersQueued
      } catch (error) {
        summary.tenantErrors++
        await recordApplicationEvent({ severity: 'error', area: 'business-jobs', code: 'tenant_job_failed', organizationId: tenant.organization_id, message: error instanceof Error ? error.message.slice(0, 500) : 'Job fehlgeschlagen' })
      }
    }
    if (graphMailConfigured()) summary.accepted = (await processMailOutbox()).accepted
    await query('update job_runs set status=$2,summary=$3::jsonb,completed_at=now() where id=$1', [run.rows[0].id, summary.tenantErrors ? 'failed' : 'completed', JSON.stringify(summary)])
    return summary
  } catch (error) {
    await query("update job_runs set status='failed',summary=$2::jsonb,completed_at=now() where id=$1", [run.rows[0].id, JSON.stringify(summary)])
    throw error
  }
}
