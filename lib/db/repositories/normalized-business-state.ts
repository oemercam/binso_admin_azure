import 'server-only'
import type { PoolClient } from 'pg'
import { allocateDocumentNumber } from '@/lib/db/repositories/document-counters'
import { assertTransition, quoteTransitions, orderTransitions, invoiceTransitions } from '@/modules/shared/state-machine'
import { addMinor, fromMinorUnits, multiplyMinor, toMinorUnits } from '@/modules/shared/money'

export const NORMALIZED_CORE_KEYS = [
  'customers', 'customerContacts', 'quotes', 'orders', 'timeEntries', 'invoices', 'payments',
  'employees', 'contracts', 'suppliers', 'supplierInvoices', 'expenses', 'creditNotes', 'customerActivities',
] as const

type State = Record<string, unknown>
type Obj = Record<string, unknown>

type NumberTable = 'customers' | 'quotes' | 'invoices' | 'contracts' | 'credit_notes'
type NumberColumn = 'customer_no' | 'quote_no' | 'invoice_no' | 'contract_no' | 'credit_no'

function records(state: State, key: string): Obj[] {
  const value = state[key]
  return Array.isArray(value)
    ? value.filter((item): item is Obj => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

function nestedRecords(value: unknown): Obj[] {
  return Array.isArray(value)
    ? value.filter((item): item is Obj => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

function text(value: unknown, fallback = '') { return typeof value === 'string' ? value : fallback }
function optionalText(value: unknown) { return typeof value === 'string' && value.trim() ? value : null }
function num(value: unknown, fallback = 0) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback }
function bool(value: unknown, fallback = false) { return typeof value === 'boolean' ? value : fallback }
function json(value: unknown) { return value && typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : null }
function stringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [] }
function dateText(value: unknown) { return value instanceof Date ? value.toISOString().slice(0, 10) : optionalText(value) }
function timestampText(value: unknown) { return value instanceof Date ? value.toISOString() : optionalText(value) }

async function existingNumber(
  client: PoolClient,
  table: NumberTable,
  organizationId: string,
  externalId: string,
  column: NumberColumn,
) {
  const result = await client.query<Record<string, string>>(
    `select ${column} as value from ${table} where organization_id=$1 and external_id=$2`,
    [organizationId, externalId],
  )
  return result.rows[0]?.value ?? null
}

async function existingStatus(client: PoolClient, table: 'quotes' | 'orders' | 'invoices', organizationId: string, externalId: string) {
  const result = await client.query<{ status: string }>(
    `select status from ${table} where organization_id=$1 and external_id=$2`,
    [organizationId, externalId],
  )
  return result.rows[0]?.status ?? null
}

async function pk(client: PoolClient, table: string, organizationId: string, externalId: string | null) {
  if (!externalId) return null
  const allowed = new Set(['customers', 'quotes', 'orders', 'invoices', 'contracts', 'suppliers', 'expenses', 'time_entries', 'invoice_lines'])
  if (!allowed.has(table)) throw new Error('normalized_repository_invalid_table')
  const result = await client.query<{ id: string }>(
    `select id::text from ${table} where organization_id=$1 and external_id=$2`,
    [organizationId, externalId],
  )
  return result.rows[0]?.id ?? null
}

async function syncChildRows(client: PoolClient, table: 'quote_lines' | 'contract_lines' | 'invoice_lines', organizationId: string, parentColumn: 'quote_id' | 'contract_id' | 'invoice_id', parentId: string, externalIds: string[]) {
  await client.query(
    `delete from ${table} where organization_id=$1 and ${parentColumn}=$2 and not (external_id = any($3::text[]))`,
    [organizationId, parentId, externalIds],
  )
}

/**
 * Compatibility strangler. The current UI keeps its stable string IDs while PostgreSQL
 * remains authoritative through UUID PKs + tenant-local external_id mappings.
 * Top-level rows are never implicitly deleted; financial/legal history is retained.
 * Child document lines are authoritative for their parent and are synchronised transactionally.
 */
export async function persistNormalizedCoreState(client: PoolClient, organizationId: string, state: State) {
  for (const customer of records(state, 'customers')) {
    const externalId = text(customer.id)
    if (!externalId) continue
    const currentNo = await existingNumber(client, 'customers', organizationId, externalId, 'customer_no')
    const authoritativeNo = currentNo ?? await allocateDocumentNumber(client, {
      organizationId, kind: 'customer', prefix: 'KD-', padding: 5,
    })
    await client.query(
      `insert into customers(organization_id,external_id,customer_no,name,legal_name,contact_name,email,phone,address,zip,city,country,uid,payment_days,status,notes,workflow_override,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,null)
       on conflict(organization_id,external_id) do update set
         customer_no=excluded.customer_no,name=excluded.name,legal_name=excluded.legal_name,contact_name=excluded.contact_name,
         email=excluded.email,phone=excluded.phone,address=excluded.address,zip=excluded.zip,city=excluded.city,country=excluded.country,
         uid=excluded.uid,payment_days=excluded.payment_days,status=excluded.status,notes=excluded.notes,workflow_override=excluded.workflow_override`,
      [organizationId, externalId, authoritativeNo, text(customer.name), optionalText(customer.legalName), optionalText(customer.contact),
        optionalText(customer.email), optionalText(customer.phone), optionalText(customer.address), optionalText(customer.zip),
        optionalText(customer.city), text(customer.country, 'Schweiz'), optionalText(customer.uid), num(customer.paymentDays, 30),
        text(customer.status, 'active'), optionalText(customer.notes), json(customer.workflowOverride)],
    )
  }

  for (const contact of records(state, 'customerContacts')) {
    const customerId = await pk(client, 'customers', organizationId, text(contact.customerId))
    if (!customerId || !text(contact.id)) continue
    await client.query(
      `insert into customer_contacts(organization_id,external_id,customer_id,name,email,phone,role_label,is_primary,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,null)
       on conflict(organization_id,external_id) do update set customer_id=excluded.customer_id,name=excluded.name,email=excluded.email,
         phone=excluded.phone,role_label=excluded.role_label,is_primary=excluded.is_primary`,
      [organizationId, text(contact.id), customerId, text(contact.name), optionalText(contact.email), optionalText(contact.phone), optionalText(contact.role), bool(contact.primary)],
    )
  }

  for (const employee of records(state, 'employees')) {
    if (!text(employee.id)) continue
    await client.query(
      `insert into employees(organization_id,external_id,name,email,role,employment_type,target_hours,internal_cost_rate,active,settlement_override,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,null)
       on conflict(organization_id,external_id) do update set name=excluded.name,email=excluded.email,role=excluded.role,
         employment_type=excluded.employment_type,target_hours=excluded.target_hours,internal_cost_rate=excluded.internal_cost_rate,
         active=excluded.active,settlement_override=excluded.settlement_override`,
      [organizationId, text(employee.id), text(employee.name), text(employee.email), text(employee.role, 'employee'),
        text(employee.employmentType, 'salary'), num(employee.targetHours), num(employee.internalCostRate),
        text(employee.status, 'active') === 'active', json(employee.settlementOverride)],
    )
  }

  for (const supplier of records(state, 'suppliers')) {
    if (!text(supplier.id)) continue
    await client.query(
      `insert into suppliers(organization_id,external_id,supplier_no,name,contact_name,email,uid,payment_days,status,settlement_override,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,null)
       on conflict(organization_id,external_id) do update set supplier_no=excluded.supplier_no,name=excluded.name,contact_name=excluded.contact_name,
         email=excluded.email,uid=excluded.uid,payment_days=excluded.payment_days,status=excluded.status,settlement_override=excluded.settlement_override`,
      [organizationId, text(supplier.id), text(supplier.supplierNo), text(supplier.name), optionalText(supplier.contact),
        optionalText(supplier.email), optionalText(supplier.uid), num(supplier.paymentDays, 30), text(supplier.status, 'active'), json(supplier.settlementOverride)],
    )
  }

  for (const quote of records(state, 'quotes')) {
    const externalId = text(quote.id)
    const customerId = await pk(client, 'customers', organizationId, text(quote.customerId))
    if (!externalId || !customerId) continue
    const year = (optionalText(quote.issueDate) ?? optionalText(quote.validUntil) ?? new Date().toISOString()).slice(0, 4)
    const currentNo = await existingNumber(client, 'quotes', organizationId, externalId, 'quote_no')
    const oldStatus = await existingStatus(client, 'quotes', organizationId, externalId)
    const nextStatus = text(quote.status, 'draft')
    if (oldStatus) assertTransition(oldStatus as keyof typeof quoteTransitions, nextStatus as keyof typeof quoteTransitions, quoteTransitions, 'quote_transition_invalid')
    const authoritativeNo = currentNo ?? await allocateDocumentNumber(client, {
      organizationId, kind: 'quote', period: year, prefix: `AN-${year}-`, padding: 3,
    })
    await client.query(
      `insert into quotes(organization_id,external_id,quote_no,customer_id,title,issue_date,valid_until,status,recipient_name,recipient_address,recipient_zip,recipient_city,recipient_country,recipient_email,intro_text,closing_text,reference,email_to,sent_at,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,null)
       on conflict(organization_id,external_id) do update set quote_no=excluded.quote_no,customer_id=excluded.customer_id,title=excluded.title,
         issue_date=excluded.issue_date,valid_until=excluded.valid_until,status=excluded.status,recipient_name=excluded.recipient_name,
         recipient_address=excluded.recipient_address,recipient_zip=excluded.recipient_zip,recipient_city=excluded.recipient_city,
         recipient_country=excluded.recipient_country,recipient_email=excluded.recipient_email,intro_text=excluded.intro_text,
         closing_text=excluded.closing_text,reference=excluded.reference,email_to=excluded.email_to,sent_at=excluded.sent_at`,
      [organizationId, externalId, authoritativeNo, customerId, text(quote.title), optionalText(quote.issueDate), optionalText(quote.validUntil), nextStatus,
        optionalText(quote.recipientName), optionalText(quote.recipientAddress), optionalText(quote.recipientZip), optionalText(quote.recipientCity),
        optionalText(quote.recipientCountry), optionalText(quote.recipientEmail), optionalText(quote.introText), optionalText(quote.outroText),
        optionalText(quote.reference), optionalText(quote.sentTo), optionalText(quote.sentAt)],
    )
    const quoteId = await pk(client, 'quotes', organizationId, externalId)
    if (!quoteId) continue
    const lines = nestedRecords(quote.lines)
    const externalIds: string[] = []
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      const lineExternalId = text(line.id, `${externalId}-${index}`)
      externalIds.push(lineExternalId)
      await client.query(
        `insert into quote_lines(organization_id,external_id,quote_id,sort_order,description,quantity,unit,unit_price,vat_rate)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict(organization_id,external_id) do update set quote_id=excluded.quote_id,sort_order=excluded.sort_order,
           description=excluded.description,quantity=excluded.quantity,unit=excluded.unit,unit_price=excluded.unit_price,vat_rate=excluded.vat_rate`,
        [organizationId, lineExternalId, quoteId, index, text(line.description), num(line.quantity, 1), text(line.unit, 'h'), num(line.unitPrice), typeof line.vatRate === 'number' ? line.vatRate : null],
      )
    }
    await syncChildRows(client, 'quote_lines', organizationId, 'quote_id', quoteId, externalIds)
  }

  for (const contract of records(state, 'contracts')) {
    const externalId = text(contract.id)
    const customerId = await pk(client, 'customers', organizationId, text(contract.customerId))
    if (!externalId || !customerId) continue
    const year = (optionalText(contract.startDate) ?? new Date().toISOString()).slice(0, 4)
    const currentNo = await existingNumber(client, 'contracts', organizationId, externalId, 'contract_no')
    const authoritativeNo = currentNo ?? await allocateDocumentNumber(client, {
      organizationId, kind: 'contract', period: year, prefix: `VR-${year}-`, padding: 3,
    })
    await client.query(
      `insert into contracts(organization_id,external_id,contract_no,customer_id,name,start_date,end_date,status,auto_renew,notice_days,billing_interval,next_invoice_date,billing_day,reference,notes,workflow_override,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,null)
       on conflict(organization_id,external_id) do update set contract_no=excluded.contract_no,customer_id=excluded.customer_id,name=excluded.name,
         start_date=excluded.start_date,end_date=excluded.end_date,status=excluded.status,auto_renew=excluded.auto_renew,notice_days=excluded.notice_days,
         billing_interval=excluded.billing_interval,next_invoice_date=excluded.next_invoice_date,billing_day=excluded.billing_day,
         reference=excluded.reference,notes=excluded.notes,workflow_override=excluded.workflow_override`,
      [organizationId, externalId, authoritativeNo, customerId, text(contract.name), text(contract.startDate), optionalText(contract.endDate),
        text(contract.status, 'draft'), bool(contract.autoRenew), num(contract.noticeDays), text(contract.billingInterval, 'none'),
        optionalText(contract.nextInvoiceDate), num(contract.billingDay) || null, optionalText(contract.reference), optionalText(contract.notes), json(contract.workflowOverride)],
    )
    const contractId = await pk(client, 'contracts', organizationId, externalId)
    if (!contractId) continue
    const lines = nestedRecords(contract.lines)
    const externalIds: string[] = []
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      const lineExternalId = text(line.id, `${externalId}-${index}`)
      externalIds.push(lineExternalId)
      await client.query(
        `insert into contract_lines(organization_id,external_id,contract_id,sort_order,description,quantity,unit,unit_price,vat_rate)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict(organization_id,external_id) do update set contract_id=excluded.contract_id,sort_order=excluded.sort_order,
           description=excluded.description,quantity=excluded.quantity,unit=excluded.unit,unit_price=excluded.unit_price,vat_rate=excluded.vat_rate`,
        [organizationId, lineExternalId, contractId, index, text(line.description), num(line.quantity, 1), text(line.unit, 'h'), num(line.unitPrice), num(line.vatRate, 8.1)],
      )
    }
    await syncChildRows(client, 'contract_lines', organizationId, 'contract_id', contractId, externalIds)
  }

  for (const order of records(state, 'orders')) {
    const externalId = text(order.id)
    const customerId = await pk(client, 'customers', organizationId, text(order.customerId))
    if (!externalId || !customerId) continue
    const oldStatus = await existingStatus(client, 'orders', organizationId, externalId)
    const nextStatus = text(order.status, 'active')
    if (oldStatus) assertTransition(oldStatus as keyof typeof orderTransitions, nextStatus as keyof typeof orderTransitions, orderTransitions, 'order_transition_invalid')
    const sourceQuoteId = await pk(client, 'quotes', organizationId, optionalText(order.sourceQuoteId))
    const contractId = await pk(client, 'contracts', organizationId, optionalText(order.contractId))
    await client.query(
      `insert into orders(organization_id,external_id,customer_id,source_quote_id,contract_id,name,end_customer_name,prime_contractor_name,mandate_ref,procurement_ref,budget_hours,sales_rate,cost_rate,billing_model,status,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,null)
       on conflict(organization_id,external_id) do update set customer_id=excluded.customer_id,source_quote_id=excluded.source_quote_id,
         contract_id=excluded.contract_id,name=excluded.name,end_customer_name=excluded.end_customer_name,prime_contractor_name=excluded.prime_contractor_name,
         mandate_ref=excluded.mandate_ref,procurement_ref=excluded.procurement_ref,budget_hours=excluded.budget_hours,sales_rate=excluded.sales_rate,
         cost_rate=excluded.cost_rate,billing_model=excluded.billing_model,status=excluded.status`,
      [organizationId, externalId, customerId, sourceQuoteId, contractId, text(order.name), optionalText(order.endCustomerName),
        optionalText(order.primeContractorName), optionalText(order.mandateRef), optionalText(order.procurementRef), num(order.budgetHours),
        num(order.salesRate), num(order.costRate), text(order.billingModel, 'time'), nextStatus],
    )
  }

  // First pass leaves invoice references nullable because invoices are persisted after time/expenses.
  for (const entry of records(state, 'timeEntries')) {
    const orderId = await pk(client, 'orders', organizationId, text(entry.orderId))
    if (!orderId || !text(entry.id)) continue
    await client.query(
      `insert into time_entries(organization_id,external_id,order_id,person_external_id,person_name,worker_type,work_date,hours,description,billable,approved,sales_rate,internal_cost_rate,invoiced_invoice_id,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,null,null)
       on conflict(organization_id,external_id) do update set order_id=excluded.order_id,person_external_id=excluded.person_external_id,
         person_name=excluded.person_name,worker_type=excluded.worker_type,work_date=excluded.work_date,hours=excluded.hours,description=excluded.description,
         billable=excluded.billable,approved=excluded.approved,sales_rate=excluded.sales_rate,internal_cost_rate=excluded.internal_cost_rate`,
      [organizationId, text(entry.id), orderId, optionalText(entry.personId), text(entry.personName), text(entry.workerType, 'employee'),
        text(entry.date), num(entry.hours), optionalText(entry.description), bool(entry.billable, true), bool(entry.approved), num(entry.salesRate), num(entry.internalCostRate)],
    )
  }

  for (const expense of records(state, 'expenses')) {
    const customerId = await pk(client, 'customers', organizationId, text(expense.customerId))
    if (!customerId || !text(expense.id)) continue
    const orderId = await pk(client, 'orders', organizationId, optionalText(expense.orderId))
    const contractId = await pk(client, 'contracts', organizationId, optionalText(expense.contractId))
    await client.query(
      `insert into expenses(organization_id,external_id,customer_id,order_id,contract_id,expense_date,description,category,quantity,unit_price,billable,invoiced_invoice_id,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,null,null)
       on conflict(organization_id,external_id) do update set customer_id=excluded.customer_id,order_id=excluded.order_id,contract_id=excluded.contract_id,
         expense_date=excluded.expense_date,description=excluded.description,category=excluded.category,quantity=excluded.quantity,
         unit_price=excluded.unit_price,billable=excluded.billable`,
      [organizationId, text(expense.id), customerId, orderId, contractId, text(expense.date), text(expense.description),
        text(expense.category, 'other'), num(expense.quantity, 1), num(expense.unitPrice), bool(expense.billable, true)],
    )
  }

  for (const invoice of records(state, 'invoices')) {
    const externalId = text(invoice.id)
    const customerId = await pk(client, 'customers', organizationId, text(invoice.customerId))
    if (!externalId || !customerId) continue
    const year = (optionalText(invoice.issueDate) ?? new Date().toISOString()).slice(0, 4)
    const currentNo = await existingNumber(client, 'invoices', organizationId, externalId, 'invoice_no')
    const oldStatus = await existingStatus(client, 'invoices', organizationId, externalId)
    const nextStatus = text(invoice.status, 'draft')
    if (oldStatus) assertTransition(oldStatus as keyof typeof invoiceTransitions, nextStatus as keyof typeof invoiceTransitions, invoiceTransitions, 'invoice_transition_invalid')
    const authoritativeNo = currentNo ?? await allocateDocumentNumber(client, {
      organizationId, kind: 'invoice', period: year, prefix: `RE-${year}-`, padding: 3,
    })
    const orderId = await pk(client, 'orders', organizationId, optionalText(invoice.orderId))
    const contractId = await pk(client, 'contracts', organizationId, optionalText(invoice.contractId))
    const sourceQuoteId = await pk(client, 'quotes', organizationId, optionalText(invoice.sourceQuoteId))
    await client.query(
      `insert into invoices(organization_id,external_id,invoice_no,customer_id,order_id,contract_id,source_quote_id,period,issue_date,due_date,status,
         subtotal,vat_amount,total_amount,paid_amount,recipient_name,recipient_address,recipient_zip,recipient_city,recipient_country,recipient_email,
         intro_text,closing_text,reference,email_to,sent_at,last_reminder_at,reminder_level,credited_amount,invoice_kind,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,null)
       on conflict(organization_id,external_id) do update set invoice_no=excluded.invoice_no,customer_id=excluded.customer_id,order_id=excluded.order_id,
         contract_id=excluded.contract_id,source_quote_id=excluded.source_quote_id,period=excluded.period,issue_date=excluded.issue_date,due_date=excluded.due_date,
         status=excluded.status,subtotal=excluded.subtotal,vat_amount=excluded.vat_amount,total_amount=excluded.total_amount,paid_amount=excluded.paid_amount,
         recipient_name=excluded.recipient_name,recipient_address=excluded.recipient_address,recipient_zip=excluded.recipient_zip,
         recipient_city=excluded.recipient_city,recipient_country=excluded.recipient_country,recipient_email=excluded.recipient_email,
         intro_text=excluded.intro_text,closing_text=excluded.closing_text,reference=excluded.reference,email_to=excluded.email_to,sent_at=excluded.sent_at,
         last_reminder_at=excluded.last_reminder_at,reminder_level=excluded.reminder_level,credited_amount=excluded.credited_amount,invoice_kind=excluded.invoice_kind`,
      [organizationId, externalId, authoritativeNo, customerId, orderId, contractId, sourceQuoteId, text(invoice.period), text(invoice.issueDate), text(invoice.due),
        nextStatus, num(invoice.subtotal), num(invoice.vatAmount), num(invoice.amount), num(invoice.paidAmount), optionalText(invoice.recipientName),
        optionalText(invoice.recipientAddress), optionalText(invoice.recipientZip), optionalText(invoice.recipientCity), optionalText(invoice.recipientCountry),
        optionalText(invoice.recipientEmail), optionalText(invoice.introText), optionalText(invoice.outroText), optionalText(invoice.reference), optionalText(invoice.sentTo),
        optionalText(invoice.sentAt), optionalText(invoice.lastReminderAt), num(invoice.reminderLevel), num(invoice.creditedAmount), text(invoice.kind, 'standard')],
    )

    const invoiceId = await pk(client, 'invoices', organizationId, externalId)
    if (!invoiceId) continue
    const lines = nestedRecords(invoice.lines)
    const externalIds: string[] = []
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      const lineExternalId = text(line.id, `${externalId}-${index}`)
      externalIds.push(lineExternalId)
      const sourceTimeIds = stringArray(line.sourceTimeEntryIds)
      const sourceExpenseIds = stringArray(line.sourceExpenseIds)
      await client.query(
        `insert into invoice_lines(organization_id,external_id,invoice_id,sort_order,description,quantity,unit,unit_price,vat_rate,source_time_external_ids,source_expense_external_ids)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::text[],$11::text[])
         on conflict(organization_id,external_id) do update set invoice_id=excluded.invoice_id,sort_order=excluded.sort_order,
           description=excluded.description,quantity=excluded.quantity,unit=excluded.unit,unit_price=excluded.unit_price,vat_rate=excluded.vat_rate,
           source_time_external_ids=excluded.source_time_external_ids,source_expense_external_ids=excluded.source_expense_external_ids`,
        [organizationId, lineExternalId, invoiceId, index, text(line.description), num(line.quantity, 1), text(line.unit, 'h'), num(line.unitPrice), num(line.vatRate, 8.1), sourceTimeIds, sourceExpenseIds],
      )
      const invoiceLineId = await pk(client, 'invoice_lines', organizationId, lineExternalId)
      if (!invoiceLineId) continue
      await client.query('delete from invoice_line_time_entries where organization_id=$1 and invoice_line_id=$2', [organizationId, invoiceLineId])
      for (const sourceTimeExternalId of sourceTimeIds) {
        const timeEntryId = await pk(client, 'time_entries', organizationId, sourceTimeExternalId)
        if (timeEntryId) await client.query(
          `insert into invoice_line_time_entries(organization_id,invoice_line_id,time_entry_id) values($1,$2,$3) on conflict do nothing`,
          [organizationId, invoiceLineId, timeEntryId],
        )
      }
      await client.query('delete from invoice_line_expenses where organization_id=$1 and invoice_line_id=$2', [organizationId, invoiceLineId])
      for (const sourceExpenseExternalId of sourceExpenseIds) {
        const expenseId = await pk(client, 'expenses', organizationId, sourceExpenseExternalId)
        if (expenseId) await client.query(
          `insert into invoice_line_expenses(organization_id,invoice_line_id,expense_id) values($1,$2,$3) on conflict(invoice_line_id,expense_id) do nothing`,
          [organizationId, invoiceLineId, expenseId],
        )
      }
    }
    await syncChildRows(client, 'invoice_lines', organizationId, 'invoice_id', invoiceId, externalIds)
  }

  // Second pass: invoice rows now exist, so source records can be linked safely.
  for (const entry of records(state, 'timeEntries')) {
    const invoiceId = await pk(client, 'invoices', organizationId, optionalText(entry.invoicedInvoiceId))
    await client.query('update time_entries set invoiced_invoice_id=$3 where organization_id=$1 and external_id=$2', [organizationId, text(entry.id), invoiceId])
  }
  for (const expense of records(state, 'expenses')) {
    const invoiceId = await pk(client, 'invoices', organizationId, optionalText(expense.invoicedInvoiceId))
    await client.query('update expenses set invoiced_invoice_id=$3 where organization_id=$1 and external_id=$2', [organizationId, text(expense.id), invoiceId])
  }

  for (const payment of records(state, 'payments')) {
    const invoiceId = await pk(client, 'invoices', organizationId, text(payment.invoiceId))
    if (!invoiceId || !text(payment.id)) continue
    await client.query(
      `insert into payments(organization_id,external_id,invoice_id,payment_date,amount,method,reference,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,null)
       on conflict(organization_id,external_id) do update set invoice_id=excluded.invoice_id,payment_date=excluded.payment_date,
         amount=excluded.amount,method=excluded.method,reference=excluded.reference`,
      [organizationId, text(payment.id), invoiceId, text(payment.date), num(payment.amount), text(payment.method), optionalText(payment.reference)],
    )
  }

  for (const credit of records(state, 'creditNotes')) {
    const externalId = text(credit.id)
    const invoiceId = await pk(client, 'invoices', organizationId, text(credit.invoiceId))
    const customerId = await pk(client, 'customers', organizationId, text(credit.customerId))
    if (!externalId || !invoiceId || !customerId) continue
    const year = (optionalText(credit.date) ?? new Date().toISOString()).slice(0, 4)
    const currentNo = await existingNumber(client, 'credit_notes', organizationId, externalId, 'credit_no')
    const authoritativeNo = currentNo ?? await allocateDocumentNumber(client, {
      organizationId, kind: 'credit_note', period: year, prefix: `GS-${year}-`, padding: 3,
    })
    await client.query(
      `insert into credit_notes(organization_id,external_id,credit_no,invoice_id,customer_id,credit_date,amount,reason,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,null)
       on conflict(organization_id,external_id) do update set credit_no=excluded.credit_no,invoice_id=excluded.invoice_id,
         customer_id=excluded.customer_id,credit_date=excluded.credit_date,amount=excluded.amount,reason=excluded.reason`,
      [organizationId, externalId, authoritativeNo, invoiceId, customerId, text(credit.date), num(credit.amount), text(credit.reason)],
    )
  }

  for (const supplierInvoice of records(state, 'supplierInvoices')) {
    const supplierId = await pk(client, 'suppliers', organizationId, text(supplierInvoice.supplierId))
    if (!supplierId || !text(supplierInvoice.id)) continue
    const orderId = await pk(client, 'orders', organizationId, optionalText(supplierInvoice.orderId))
    await client.query(
      `insert into supplier_invoices(organization_id,external_id,supplier_id,order_id,supplier_invoice_no,invoice_date,due_date,period,hours,net_amount,vat_amount,total_amount,status,note,archived_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,null)
       on conflict(organization_id,external_id) do update set supplier_id=excluded.supplier_id,order_id=excluded.order_id,
         supplier_invoice_no=excluded.supplier_invoice_no,invoice_date=excluded.invoice_date,due_date=excluded.due_date,period=excluded.period,hours=excluded.hours,
         net_amount=excluded.net_amount,vat_amount=excluded.vat_amount,total_amount=excluded.total_amount,status=excluded.status,note=excluded.note`,
      [organizationId, text(supplierInvoice.id), supplierId, orderId, text(supplierInvoice.number), text(supplierInvoice.invoiceDate),
        text(supplierInvoice.due), optionalText(supplierInvoice.period), typeof supplierInvoice.hours === 'number' ? supplierInvoice.hours : null,
        num(supplierInvoice.netAmount), num(supplierInvoice.vatAmount), num(supplierInvoice.amount), text(supplierInvoice.status, 'open'), optionalText(supplierInvoice.note)],
    )
  }

  for (const activity of records(state, 'customerActivities')) {
    const customerId = await pk(client, 'customers', organizationId, text(activity.customerId))
    if (!customerId || !text(activity.id)) continue
    await client.query(
      `insert into customer_activities(organization_id,external_id,customer_id,activity_type,title,detail,created_at,archived_at)
       values($1,$2,$3,$4,$5,$6,coalesce($7::timestamptz,now()),null)
       on conflict(organization_id,external_id) do update set customer_id=excluded.customer_id,activity_type=excluded.activity_type,
         title=excluded.title,detail=excluded.detail`,
      [organizationId, text(activity.id), customerId, text(activity.type, 'note'), text(activity.title), optionalText(activity.detail), optionalText(activity.createdAt)],
    )
  }
}

export async function hasNormalizedCoreState(client: PoolClient, organizationId: string) {
  const result = await client.query<{ exists: boolean }>(
    'select exists(select 1 from customers where organization_id=$1) as exists',
    [organizationId],
  )
  return Boolean(result.rows[0]?.exists)
}

export async function loadNormalizedCoreState(client: PoolClient, organizationId: string): Promise<State> {
  const customers = await client.query(
    `select external_id as id,name,legal_name as "legalName",customer_no as "customerNo",contact_name as contact,email,phone,address,zip,city,country,uid,
            payment_days as "paymentDays",status,notes,workflow_override as "workflowOverride"
       from customers where organization_id=$1 and archived_at is null order by created_at,id`, [organizationId],
  )
  const contacts = await client.query(
    `select cc.external_id as id,c.external_id as "customerId",cc.name,cc.email,cc.phone,cc.role_label as role,cc.is_primary as primary
       from customer_contacts cc join customers c on c.id=cc.customer_id and c.organization_id=cc.organization_id
      where cc.organization_id=$1 and cc.archived_at is null order by cc.created_at,cc.id`, [organizationId],
  )
  const employees = await client.query(
    `select e.external_id as id,e.name,e.email,e.role,e.employment_type as "employmentType",case when e.active then 'active' else 'inactive' end as status,
            e.target_hours::float8 as "targetHours",coalesce(sum(t.hours),0)::float8 as "bookedHours",
            coalesce(sum(t.hours) filter(where t.billable),0)::float8 as "billableHours",
            case when e.target_hours>0 then round((coalesce(sum(t.hours) filter(where t.billable),0)/e.target_hours)*100,2)::float8 else 0::float8 end as utilisation,
            e.internal_cost_rate::float8 as "internalCostRate",e.settlement_override as "settlementOverride"
       from employees e left join time_entries t on t.organization_id=e.organization_id and t.person_external_id=e.external_id and t.archived_at is null
      where e.organization_id=$1 and e.archived_at is null
      group by e.id,e.external_id,e.name,e.email,e.role,e.employment_type,e.active,e.target_hours,e.internal_cost_rate,e.settlement_override order by e.name,e.id`, [organizationId],
  )
  const suppliers = await client.query(
    `select external_id as id,name,supplier_no as "supplierNo",coalesce(contact_name,'') as contact,coalesce(email,'') as email,uid,
            payment_days as "paymentDays",status,settlement_override as "settlementOverride"
       from suppliers where organization_id=$1 and archived_at is null order by created_at,id`, [organizationId],
  )
  const quotes = await client.query(
    `select q.external_id,q.quote_no,c.external_id as customer_external,c.name as customer_name,q.title,q.issue_date,q.valid_until,q.status,q.version,
            q.recipient_name,q.recipient_address,q.recipient_zip,q.recipient_city,q.recipient_country,q.recipient_email,q.intro_text,q.closing_text,q.reference,q.email_to,q.sent_at
       from quotes q join customers c on c.id=q.customer_id and c.organization_id=q.organization_id
      where q.organization_id=$1 and q.archived_at is null order by q.created_at,q.id`, [organizationId],
  )
  const quoteLines = await client.query(
    `select q.external_id as quote_external,ql.external_id,ql.description,ql.quantity::float8,ql.unit,ql.unit_price::float8,ql.vat_rate::float8
       from quote_lines ql join quotes q on q.id=ql.quote_id and q.organization_id=ql.organization_id
      where ql.organization_id=$1 order by ql.quote_id,ql.sort_order,ql.id`, [organizationId],
  )
  const contracts = await client.query(
    `select c.external_id,c.contract_no,cu.external_id as customer_external,cu.name as customer_name,c.name,c.start_date,c.end_date,c.status,c.auto_renew,
            c.notice_days,c.billing_interval,c.next_invoice_date,c.billing_day,c.reference,c.notes,c.workflow_override
       from contracts c join customers cu on cu.id=c.customer_id and cu.organization_id=c.organization_id
      where c.organization_id=$1 and c.archived_at is null order by c.created_at,c.id`, [organizationId],
  )
  const contractLines = await client.query(
    `select c.external_id as contract_external,cl.external_id,cl.description,cl.quantity::float8,cl.unit,cl.unit_price::float8,cl.vat_rate::float8
       from contract_lines cl join contracts c on c.id=cl.contract_id and c.organization_id=cl.organization_id
      where cl.organization_id=$1 order by cl.contract_id,cl.sort_order,cl.id`, [organizationId],
  )
  const orders = await client.query(
    `select o.external_id as id,cu.external_id as "customerId",cu.name as "customerName",o.name,o.end_customer_name as "endCustomerName",
            o.prime_contractor_name as "primeContractorName",o.mandate_ref as "mandateRef",o.procurement_ref as "procurementRef",
            o.budget_hours::float8 as "budgetHours",coalesce((select sum(t.hours)::float8 from time_entries t where t.organization_id=o.organization_id and t.order_id=o.id and t.archived_at is null),0)::float8 as "usedHours",
            o.sales_rate::float8 as "salesRate",o.cost_rate::float8 as "costRate",o.billing_model as "billingModel",q.external_id as "sourceQuoteId",
            ct.external_id as "contractId",o.status
       from orders o join customers cu on cu.id=o.customer_id and cu.organization_id=o.organization_id
       left join quotes q on q.id=o.source_quote_id and q.organization_id=o.organization_id
       left join contracts ct on ct.id=o.contract_id and ct.organization_id=o.organization_id
      where o.organization_id=$1 and o.archived_at is null order by o.created_at,o.id`, [organizationId],
  )
  const times = await client.query(
    `select t.external_id as id,o.external_id as "orderId",o.name as "orderName",cu.external_id as "customerId",cu.name as "customerName",
            t.person_name as "personName",coalesce(t.person_external_id,t.employee_id::text,t.supplier_id::text,'') as "personId",t.worker_type as "workerType",
            t.work_date::text as date,t.hours::float8,t.description,t.billable,t.approved,t.sales_rate::float8 as "salesRate",
            t.internal_cost_rate::float8 as "internalCostRate",i.external_id as "invoicedInvoiceId"
       from time_entries t join orders o on o.id=t.order_id and o.organization_id=t.organization_id
       join customers cu on cu.id=o.customer_id and cu.organization_id=o.organization_id
       left join invoices i on i.id=t.invoiced_invoice_id and i.organization_id=t.organization_id
      where t.organization_id=$1 and t.archived_at is null order by t.work_date,t.id`, [organizationId],
  )
  const expenses = await client.query(
    `select e.external_id as id,cu.external_id as "customerId",cu.name as "customerName",o.external_id as "orderId",o.name as "orderName",
            c.external_id as "contractId",e.expense_date::text as date,e.description,e.category,e.quantity::float8,e.unit_price::float8 as "unitPrice",
            e.billable,i.external_id as "invoicedInvoiceId"
       from expenses e join customers cu on cu.id=e.customer_id and cu.organization_id=e.organization_id
       left join orders o on o.id=e.order_id and o.organization_id=e.organization_id
       left join contracts c on c.id=e.contract_id and c.organization_id=e.organization_id
       left join invoices i on i.id=e.invoiced_invoice_id and i.organization_id=e.organization_id
      where e.organization_id=$1 and e.archived_at is null order by e.expense_date,e.id`, [organizationId],
  )
  const invoices = await client.query(
    `select i.external_id,i.invoice_no,cu.external_id as customer_external,cu.name as customer_name,o.external_id as order_external,o.name as order_name,
            q.external_id as quote_external,c.external_id as contract_external,c.name as contract_name,i.invoice_kind,i.period,i.issue_date,i.due_date,i.status,
            i.subtotal::float8,i.vat_amount::float8,i.total_amount::float8,i.paid_amount::float8,i.recipient_name,i.recipient_address,i.recipient_zip,
            i.recipient_city,i.recipient_country,i.recipient_email,i.intro_text,i.closing_text,i.reference,i.email_to,i.sent_at,i.last_reminder_at,
            i.reminder_level,i.credited_amount::float8
       from invoices i join customers cu on cu.id=i.customer_id and cu.organization_id=i.organization_id
       left join orders o on o.id=i.order_id and o.organization_id=i.organization_id
       left join quotes q on q.id=i.source_quote_id and q.organization_id=i.organization_id
       left join contracts c on c.id=i.contract_id and c.organization_id=i.organization_id
      where i.organization_id=$1 and i.archived_at is null order by i.created_at,i.id`, [organizationId],
  )
  const invoiceLines = await client.query(
    `select i.external_id as invoice_external,il.external_id,il.description,il.quantity::float8,il.unit,il.unit_price::float8,il.vat_rate::float8,
            il.source_time_external_ids,il.source_expense_external_ids
       from invoice_lines il join invoices i on i.id=il.invoice_id and i.organization_id=il.organization_id
      where il.organization_id=$1 order by il.invoice_id,il.sort_order,il.id`, [organizationId],
  )
  const payments = await client.query(
    `select p.external_id as id,i.external_id as "invoiceId",p.payment_date::text as date,p.amount::float8,p.method,p.reference
       from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id
      where p.organization_id=$1 and p.archived_at is null order by p.payment_date,p.id`, [organizationId],
  )
  const creditNotes = await client.query(
    `select n.external_id as id,n.credit_no as number,i.external_id as "invoiceId",i.invoice_no as "invoiceNumber",
            c.external_id as "customerId",c.name as "customerName",n.credit_date::text as date,n.amount::float8,n.reason
       from credit_notes n join invoices i on i.id=n.invoice_id and i.organization_id=n.organization_id
       join customers c on c.id=n.customer_id and c.organization_id=n.organization_id
      where n.organization_id=$1 and n.archived_at is null order by n.credit_date,n.id`, [organizationId],
  )
  const supplierInvoices = await client.query(
    `select si.external_id as id,si.supplier_invoice_no as number,s.external_id as "supplierId",s.name as "supplierName",
            o.external_id as "orderId",o.name as "orderName",si.invoice_date::text as "invoiceDate",si.due_date::text as due,si.period,
            si.hours::float8,si.net_amount::float8 as "netAmount",si.vat_amount::float8 as "vatAmount",si.total_amount::float8 as amount,si.status,si.note
       from supplier_invoices si join suppliers s on s.id=si.supplier_id and s.organization_id=si.organization_id
       left join orders o on o.id=si.order_id and o.organization_id=si.organization_id
      where si.organization_id=$1 and si.archived_at is null order by si.invoice_date,si.id`, [organizationId],
  )
  const customerActivities = await client.query(
    `select a.external_id as id,c.external_id as "customerId",a.activity_type as type,a.title,a.detail,a.created_at as "createdAt"
       from customer_activities a join customers c on c.id=a.customer_id and c.organization_id=a.organization_id
      where a.organization_id=$1 and a.archived_at is null order by a.created_at desc,a.id desc`, [organizationId],
  )

  const quoteLineMap = new Map<string, Obj[]>()
  for (const row of quoteLines.rows as Obj[]) {
    const key = text(row.quote_external)
    const list = quoteLineMap.get(key) ?? []
    list.push({ id: row.external_id, description: row.description, quantity: row.quantity, unit: row.unit, unitPrice: row.unit_price, vatRate: row.vat_rate })
    quoteLineMap.set(key, list)
  }
  const contractLineMap = new Map<string, Obj[]>()
  for (const row of contractLines.rows as Obj[]) {
    const key = text(row.contract_external)
    const list = contractLineMap.get(key) ?? []
    list.push({ id: row.external_id, description: row.description, quantity: row.quantity, unit: row.unit, unitPrice: row.unit_price, vatRate: row.vat_rate })
    contractLineMap.set(key, list)
  }
  const invoiceLineMap = new Map<string, Obj[]>()
  for (const row of invoiceLines.rows as Obj[]) {
    const key = text(row.invoice_external)
    const list = invoiceLineMap.get(key) ?? []
    list.push({
      id: row.external_id,
      description: row.description,
      quantity: row.quantity,
      unit: row.unit,
      unitPrice: row.unit_price,
      vatRate: row.vat_rate,
      sourceTimeEntryIds: stringArray(row.source_time_external_ids),
      sourceExpenseIds: stringArray(row.source_expense_external_ids),
    })
    invoiceLineMap.set(key, list)
  }

  return {
    customers: customers.rows.map((row: Obj) => ({ ...row, organizationId })),
    customerContacts: contacts.rows.map((row: Obj) => ({ ...row, organizationId })),
    employees: employees.rows.map((row: Obj) => ({ ...row, organizationId })),
    suppliers: suppliers.rows.map((row: Obj) => ({ ...row, organizationId })),
    quotes: (quotes.rows as Obj[]).map((row) => {
      const lines = quoteLineMap.get(text(row.external_id)) ?? []
      const amountMinor = addMinor(...lines.map((line) => multiplyMinor(toMinorUnits(num(line.unitPrice)), num(line.quantity))))
      return {
        organizationId, id: row.external_id, number: row.quote_no, customerId: row.customer_external, customerName: row.customer_name,
        title: row.title, issueDate: dateText(row.issue_date), validUntil: dateText(row.valid_until) ?? '', status: row.status, version: row.version,
        lines, amount: fromMinorUnits(amountMinor), recipientName: row.recipient_name, recipientAddress: row.recipient_address,
        recipientZip: row.recipient_zip, recipientCity: row.recipient_city, recipientCountry: row.recipient_country, recipientEmail: row.recipient_email,
        introText: row.intro_text, outroText: row.closing_text, reference: row.reference, sentTo: row.email_to, sentAt: timestampText(row.sent_at),
      }
    }),
    contracts: (contracts.rows as Obj[]).map((row) => ({
      organizationId, id: row.external_id, number: row.contract_no, customerId: row.customer_external, customerName: row.customer_name,
      name: row.name, startDate: dateText(row.start_date) ?? '', endDate: dateText(row.end_date) ?? undefined, status: row.status,
      autoRenew: row.auto_renew, noticeDays: row.notice_days, billingInterval: row.billing_interval,
      nextInvoiceDate: dateText(row.next_invoice_date) ?? undefined, billingDay: row.billing_day,
      lines: contractLineMap.get(text(row.external_id)) ?? [], reference: row.reference, notes: row.notes, workflowOverride: row.workflow_override,
    })),
    orders: orders.rows.map((row: Obj) => ({ ...row, organizationId })),
    timeEntries: times.rows.map((row: Obj) => ({ ...row, organizationId })),
    expenses: expenses.rows.map((row: Obj) => ({ ...row, organizationId })),
    invoices: (invoices.rows as Obj[]).map((row) => ({
      organizationId, id: row.external_id, number: row.invoice_no, customerId: row.customer_external, customerName: row.customer_name,
      orderId: row.order_external, orderName: row.order_name, sourceQuoteId: row.quote_external, contractId: row.contract_external, contractName: row.contract_name,
      kind: row.invoice_kind, period: row.period, issueDate: dateText(row.issue_date) ?? '', due: dateText(row.due_date) ?? '', status: row.status,
      lines: invoiceLineMap.get(text(row.external_id)) ?? [], subtotal: row.subtotal, vatAmount: row.vat_amount, amount: row.total_amount, paidAmount: row.paid_amount,
      recipientName: row.recipient_name, recipientAddress: row.recipient_address, recipientZip: row.recipient_zip, recipientCity: row.recipient_city,
      recipientCountry: row.recipient_country, recipientEmail: row.recipient_email, introText: row.intro_text, outroText: row.closing_text,
      reference: row.reference, sentTo: row.email_to, sentAt: timestampText(row.sent_at), lastReminderAt: timestampText(row.last_reminder_at),
      reminderLevel: row.reminder_level, creditedAmount: row.credited_amount,
    })),
    payments: payments.rows.map((row: Obj) => ({ ...row, organizationId })),
    creditNotes: creditNotes.rows.map((row: Obj) => ({ ...row, organizationId })),
    supplierInvoices: supplierInvoices.rows.map((row: Obj) => ({ ...row, organizationId })),
    customerActivities: customerActivities.rows.map((row: Obj) => ({ ...row, organizationId, createdAt: timestampText(row.createdAt) ?? text(row.createdAt) })),
  }
}

export function removeNormalizedCoreFromLegacyState(state: State) {
  const legacy = { ...state }
  for (const key of NORMALIZED_CORE_KEYS) delete legacy[key]
  return legacy
}
