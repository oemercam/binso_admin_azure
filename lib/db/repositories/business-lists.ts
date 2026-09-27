import 'server-only'
import { withTenantTransaction } from '@/lib/db/tenant'
import { boundedLimit, decodeCursor, encodeCursor } from '@/modules/shared/pagination'

export type BusinessListResource = 'customers'|'contacts'|'quotes'|'orders'|'time'|'invoices'|'payments'|'employees'|'contracts'|'suppliers'|'supplierInvoices'|'expenses'|'creditNotes'

type Context = { organizationId: string; userId: string }

type ListResult = { items: Record<string, unknown>[]; nextCursor: string | null }

const specs: Record<BusinessListResource, { table: string; alias: string; select: string; search: string[]; status?: string }> = {
  customers: { table:'customers', alias:'r', select:'r.external_id as id,r.customer_no as "customerNo",r.name,r.legal_name as "legalName",r.contact_name as contact,r.email,r.phone,r.address,r.zip,r.city,r.country,r.uid,r.payment_days as "paymentDays",r.status,r.notes,r.created_at as "createdAt",r.updated_at as "updatedAt",r.version', search:['r.name','r.customer_no','r.email','r.uid'], status:'r.status' },
  contacts: { table:'customer_contacts', alias:'r', select:'r.external_id as id,c.external_id as "customerId",r.name,r.email,r.phone,r.role_label as role,r.is_primary as primary,r.created_at as "createdAt",r.version', search:['r.name','r.email','r.phone'] },
  quotes: { table:'quotes', alias:'r', select:'r.external_id as id,r.quote_no as number,c.external_id as "customerId",c.name as "customerName",r.title,r.valid_until as "validUntil",r.status,r.version,r.created_at as "createdAt",r.updated_at as "updatedAt"', search:['r.quote_no','r.title','c.name'], status:'r.status' },
  orders: { table:'orders', alias:'r', select:'r.external_id as id,c.external_id as "customerId",c.name as "customerName",r.name,r.end_customer_name as "endCustomerName",r.mandate_ref as "mandateRef",r.procurement_ref as "procurementRef",r.budget_hours::float8 as "budgetHours",r.sales_rate::float8 as "salesRate",r.cost_rate::float8 as "costRate",r.billing_model as "billingModel",r.status,r.version,r.created_at as "createdAt",r.updated_at as "updatedAt"', search:['r.name','c.name','r.mandate_ref','r.procurement_ref'], status:'r.status' },
  time: { table:'time_entries', alias:'r', select:'r.external_id as id,o.external_id as "orderId",o.name as "orderName",r.person_name as "personName",r.worker_type as "workerType",r.work_date as date,r.hours::float8,r.description,r.billable,r.approved,r.sales_rate::float8 as "salesRate",r.internal_cost_rate::float8 as "internalCostRate",r.created_at as "createdAt",r.version', search:['r.person_name','r.description','o.name'] },
  invoices: { table:'invoices', alias:'r', select:'r.external_id as id,r.invoice_no as number,c.external_id as "customerId",c.name as "customerName",r.period,r.issue_date as "issueDate",r.due_date as due,r.status,r.subtotal::float8,r.vat_amount::float8 as "vatAmount",r.total_amount::float8 as amount,r.paid_amount::float8 as "paidAmount",r.version,r.created_at as "createdAt",r.updated_at as "updatedAt"', search:['r.invoice_no','c.name','r.period'], status:'r.status' },
  payments: { table:'payments', alias:'r', select:'r.external_id as id,i.external_id as "invoiceId",i.invoice_no as "invoiceNumber",r.payment_date as date,r.amount::float8,r.method,r.reference,r.created_at as "createdAt",r.version', search:['i.invoice_no','r.reference','r.method'] },
  employees: { table:'employees', alias:'r', select:'r.external_id as id,r.name,r.email,r.role,r.employment_type as "employmentType",case when r.active then \'active\' else \'inactive\' end as status,r.target_hours::float8 as "targetHours",r.internal_cost_rate::float8 as "internalCostRate",r.created_at as "createdAt",r.version', search:['r.name','r.email'] },
  contracts: { table:'contracts', alias:'r', select:'r.external_id as id,r.contract_no as number,c.external_id as "customerId",c.name as "customerName",r.name,r.start_date as "startDate",r.end_date as "endDate",r.status,r.billing_interval as "billingInterval",r.next_invoice_date as "nextInvoiceDate",r.reference,r.version,r.created_at as "createdAt",r.updated_at as "updatedAt"', search:['r.contract_no','r.name','c.name','r.reference'], status:'r.status' },
  suppliers: { table:'suppliers', alias:'r', select:'r.external_id as id,r.supplier_no as "supplierNo",r.name,r.contact_name as contact,r.email,r.uid,r.payment_days as "paymentDays",r.status,r.version,r.created_at as "createdAt"', search:['r.supplier_no','r.name','r.email','r.uid'], status:'r.status' },
  supplierInvoices: { table:'supplier_invoices', alias:'r', select:'r.external_id as id,r.supplier_invoice_no as number,s.external_id as "supplierId",s.name as "supplierName",o.external_id as "orderId",o.name as "orderName",r.invoice_date as "invoiceDate",r.due_date as due,r.period,r.hours::float8,r.net_amount::float8 as "netAmount",r.vat_amount::float8 as "vatAmount",r.total_amount::float8 as amount,r.status,r.note,r.version,r.created_at as "createdAt"', search:['r.supplier_invoice_no','s.name','o.name'], status:'r.status' },
  expenses: { table:'expenses', alias:'r', select:'r.external_id as id,c.external_id as "customerId",c.name as "customerName",o.external_id as "orderId",o.name as "orderName",r.expense_date as date,r.description,r.category,r.quantity::float8,r.unit_price::float8 as "unitPrice",r.billable,r.version,r.created_at as "createdAt"', search:['r.description','c.name','o.name','r.category'] },
  creditNotes: { table:'credit_notes', alias:'r', select:'r.external_id as id,r.credit_no as number,i.external_id as "invoiceId",i.invoice_no as "invoiceNumber",c.external_id as "customerId",c.name as "customerName",r.credit_date as date,r.amount::float8,r.reason,r.version,r.created_at as "createdAt"', search:['r.credit_no','i.invoice_no','c.name','r.reason'] },
}

function joins(resource: BusinessListResource) {
  switch (resource) {
    case 'contacts': return ' join customers c on c.id=r.customer_id and c.organization_id=r.organization_id '
    case 'quotes': case 'orders': case 'invoices': case 'contracts': return ' join customers c on c.id=r.customer_id and c.organization_id=r.organization_id '
    case 'time': return ' join orders o on o.id=r.order_id and o.organization_id=r.organization_id '
    case 'payments': return ' join invoices i on i.id=r.invoice_id and i.organization_id=r.organization_id '
    case 'supplierInvoices': return ' join suppliers s on s.id=r.supplier_id and s.organization_id=r.organization_id left join orders o on o.id=r.order_id and o.organization_id=r.organization_id '
    case 'expenses': return ' join customers c on c.id=r.customer_id and c.organization_id=r.organization_id left join orders o on o.id=r.order_id and o.organization_id=r.organization_id '
    case 'creditNotes': return ' join invoices i on i.id=r.invoice_id and i.organization_id=r.organization_id join customers c on c.id=r.customer_id and c.organization_id=r.organization_id '
    default: return ''
  }
}

export async function listBusinessRecords(context: Context, resource: BusinessListResource, input: { limit?: string|number|null; cursor?: string|null; search?: string|null; status?: string|null }): Promise<ListResult> {
  const spec=specs[resource]
  if(!spec) throw new Error('unsupported_resource')
  const limit=boundedLimit(input.limit)
  const cursor=decodeCursor(input.cursor)
  const search=(input.search??'').trim().slice(0,100)
  const values: unknown[]=[context.organizationId]
  const where=['r.organization_id=$1','r.archived_at is null']
  if(cursor){values.push(cursor.createdAt,cursor.id);where.push(`(r.created_at,r.id) < ($${values.length-1}::timestamptz,$${values.length}::uuid)`)}
  if(search){values.push(`%${search.replaceAll('%','\\%').replaceAll('_','\\_')}%`);where.push(`(${spec.search.map(col=>`${col} ilike $${values.length} escape '\\'`).join(' or ')})`)}
  if(input.status && spec.status){values.push(input.status);where.push(`${spec.status}=$${values.length}`)}
  values.push(limit+1)
  return withTenantTransaction(context, async client=>{
    const q=`select ${spec.select},r.id::text as "_pk" from ${spec.table} r ${joins(resource)} where ${where.join(' and ')} order by r.created_at desc,r.id desc limit $${values.length}`
    const result=await client.query<Record<string,unknown>>(q,values)
    const hasMore=result.rows.length>limit
    const rows=hasMore?result.rows.slice(0,limit):result.rows
    const last=rows.at(-1)
    const nextCursor=hasMore&&last&&last.createdAt ? encodeCursor({createdAt:new Date(String(last.createdAt)).toISOString(),id:String(last._pk)}):null
    return {
      items: rows.map(row => {
        const item = { ...row }
        delete item._pk
        return item
      }),
      nextCursor,
    }
  })
}
