import { apiJson } from '@/lib/http/server-api'
import { publicEnv } from '@/lib/config/public-env'
export async function GET(){return apiJson({status:'ok',service:'binso-one',time:new Date().toISOString(),build:publicEnv.buildId||'unknown'})}
