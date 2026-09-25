import { getPlatformSession } from '@/lib/auth/server'
import { getPlatformCustomerDetail } from '@/lib/db/repositories/platform-customer-detail'
import { apiError, apiJson } from '@/lib/http/server-api'
export async function GET(_request:Request,{params}:{params:Promise<{organizationId:string}>}){const s=await getPlatformSession();if(!s?.user.platformRole)return apiError(403,'forbidden','Keine Plattformberechtigung.');const {organizationId}=await params;const detail=await getPlatformCustomerDetail(organizationId);return detail?apiJson(detail):apiError(404,'not_found','Kunde wurde nicht gefunden.')}
