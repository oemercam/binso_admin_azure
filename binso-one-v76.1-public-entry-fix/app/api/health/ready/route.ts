import { isDatabaseConfigured,query } from '@/lib/db/client'
import { apiJson } from '@/lib/http/server-api'
export async function GET(){if(!isDatabaseConfigured())return apiJson({status:'not_ready',database:'not_configured'},{status:503});try{await query('select 1');return apiJson({status:'ready',database:'ok',time:new Date().toISOString()})}catch{return apiJson({status:'not_ready',database:'error'},{status:503})}}
