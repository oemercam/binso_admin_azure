import 'server-only'
import type { PoolClient } from 'pg'
import { allocateDocumentNumber } from '@/lib/db/repositories/document-counters'
import { assertTransition, quoteTransitions, orderTransitions, invoiceTransitions } from '@/modules/shared/state-machine'
import { bool, existingNumber, existingStatus, json, nestedRecords, num, optionalText, pk, records, stringArray, syncChildRows, text, type State } from './shared'

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

