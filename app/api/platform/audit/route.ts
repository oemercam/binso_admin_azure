import { getPlatformSession } from '@/lib/auth/server'
import { listPlatformAudit } from '@/lib/db/repositories/platform-governance'
import { apiError,apiJson } from '@/lib/http/server-api'
import { canAuditPlatform } from '@/lib/auth/platform-permissions'
export async function GET(){const s=await getPlatformSession();if(!s?.user.platformRole||!canAuditPlatform(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.');return apiJson({events:await listPlatformAudit()})}
