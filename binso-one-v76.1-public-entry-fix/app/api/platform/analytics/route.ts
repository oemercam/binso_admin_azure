import { getPlatformSession } from '@/lib/auth/server'
import { getPlatformAnalytics } from '@/lib/db/repositories/platform-workflows'
import { apiError, apiJson } from '@/lib/http/server-api'
export async function GET(){const s=await getPlatformSession();if(!s?.user.platformRole)return apiError(403,'forbidden','Keine Plattformberechtigung.');return apiJson(await getPlatformAnalytics())}
