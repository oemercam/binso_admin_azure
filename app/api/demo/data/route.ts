import { NextRequest } from 'next/server';
import { withDemo } from '@/lib/server/demo';
import { canonicalApiTables,listApiBusiness } from '@/lib/server/repositories/business-api';
import { ApiError,apiError,json } from '@/lib/server/http';
export async function GET(request:NextRequest){
 try{
  const collection=request.nextUrl.searchParams.get('collection')??'';
  if(!canonicalApiTables.has(collection))throw new ApiError(400,'invalid_collection','Ungültige Datenquelle.');
  const filters=new URLSearchParams();
  for(const key of ['kind','number','id','customer_id','status','display_status']){const value=request.nextUrl.searchParams.get(key);if(value)filters.set(key,'eq.'+value)}
  for(const key of ['q','order','limit','offset']){const value=request.nextUrl.searchParams.get(key);if(value)filters.set(key,value)}
  const result=await withDemo(async(c,s)=>{
   const items=await listApiBusiness(c,s,collection,filters.toString());
   let total=Number(items[0]?.total_count??0);
   if(!items.length&&Number(filters.get('offset'))>0){const countFilters=new URLSearchParams(filters);countFilters.set('offset','0');countFilters.set('limit','1');const first=await listApiBusiness(c,s,collection,countFilters.toString());total=Number(first[0]?.total_count??0)}
   return {items,total};
  });
  return json({...result,demo:true});
 }catch(e){return apiError(e)}
}
