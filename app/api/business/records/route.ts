import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { isDatabaseConfigured } from '@/lib/db/client'
import { listBusinessRecords, type BusinessListResource } from '@/lib/db/repositories/business-lists'
import { apiError, apiJson, requestId } from '@/lib/http/server-api'
import type { Permission } from '@/types/domain'

const permissions: Record<BusinessListResource, Permission> = {
  customers:'customers.read', contacts:'customers.read', quotes:'quotes.read', orders:'orders.read', time:'time.read', invoices:'invoices.read', payments:'finance.read', employees:'employees.read', contracts:'contracts.read', suppliers:'finance.read', supplierInvoices:'finance.read', expenses:'finance.read', creditNotes:'finance.read',
}

export async function GET(request: Request) {
  const id=requestId(request)
  if(!isDatabaseConfigured()) return apiError(503,'database_unavailable','Datenbank ist nicht konfiguriert.',id)
  const url=new URL(request.url)
  const resource=url.searchParams.get('resource') as BusinessListResource | null
  if(!resource || !(resource in permissions)) return apiError(400,'validation_error','Ungültige Ressource.',id)
  const context=await resolveAuthorizedTenantContext(url.searchParams.get('organizationId'),permissions[resource])
  if(!context) return apiError(403,'forbidden','Keine Berechtigung für diese Ressource.',id)
  try {
    const result=await listBusinessRecords(context,resource,{limit:url.searchParams.get('limit'),cursor:url.searchParams.get('cursor'),search:url.searchParams.get('search'),status:url.searchParams.get('status')})
    return apiJson(result,undefined,id)
  } catch {
    return apiError(500,'internal_error','Daten konnten nicht geladen werden.',id)
  }
}
