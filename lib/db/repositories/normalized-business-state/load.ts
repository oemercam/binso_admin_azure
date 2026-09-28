import 'server-only'
import type { PoolClient } from 'pg'
import { addMinor, fromMinorUnits, multiplyMinor, toMinorUnits } from '@/modules/shared/money'
import { dateText, num, stringArray, text, timestampText, type Obj, type State } from './shared'

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

