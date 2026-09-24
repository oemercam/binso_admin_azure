import { apiJson } from '@/lib/http/server-api'
export async function GET(){return apiJson({status:'ok',service:'binso-one',time:new Date().toISOString(),build:process.env.NEXT_PUBLIC_BUILD_ID??'unknown'})}
