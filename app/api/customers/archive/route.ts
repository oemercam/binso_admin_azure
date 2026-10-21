import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {archivedCustomers,restoreCustomer} from '@/lib/server/repositories/customers';
import {ApiError,apiError,json,assertSameOrigin,readJson} from '@/lib/server/http';
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'customers:delete');await requireModuleEntitlement(s.organizationId,'kunden');
 const query=(request.nextUrl.searchParams.get('q')??'').trim(),offset=Number(request.nextUrl.searchParams.get('offset')??0);
 if(query.length>200||!Number.isSafeInteger(offset)||offset<0||offset>1_000_000)throw new ApiError(400,'invalid_filter','Ungültiger Filter.');
 return json(await archivedCustomers(s,query,offset));
}catch(error){return apiError(error)}}
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'customers:delete');await requireModuleEntitlement(s.organizationId,'kunden');
 const body=await readJson<{id?:unknown;revision?:unknown}>(request,1024);
 if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id)||typeof body.revision!=='string'||body.revision.length>80||!body.revision)throw new ApiError(400,'invalid_restore','Bitte den Kunden erneut auswählen.');
 return json({item:await restoreCustomer(s,body.id,body.revision)});
}catch(error){return apiError(error)}}
