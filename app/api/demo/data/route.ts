import { NextRequest } from 'next/server';
import { withDemo } from '@/lib/server/demo';
import { canonicalApiTables,listApiBusiness } from '@/lib/server/repositories/business-api';
import { ApiError,apiError,json } from '@/lib/server/http';
export async function GET(request:NextRequest){
 try{
  const collection=request.nextUrl.searchParams.get('collection')??'';
  if(!canonicalApiTables.has(collection))throw new ApiError(400,'invalid_collection','Ungültige Datenquelle.');
  const filters=new URLSearchParams();
  for(const key of ['kind','number','id','customer_id']){const value=request.nextUrl.searchParams.get(key);if(value)filters.set(key,'eq.'+value)}
  const items=await withDemo((c,s)=>listApiBusiness(c,s,collection,filters.toString()));
  return json({items,demo:true});
 }catch(e){return apiError(e)}
}
