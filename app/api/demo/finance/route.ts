import {withDemo} from '@/lib/server/demo';
import {financeData,cashStatisticsData} from '@/lib/server/repositories/finance';
import {apiError,json} from '@/lib/server/http';
export async function GET(){try{return json(await withDemo(async(c,s)=>({...await financeData(c,s.organizationId),cash:await cashStatisticsData(c,s.organizationId),demo:true})));}catch(e){return apiError(e)}}
