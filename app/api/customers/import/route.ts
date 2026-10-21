import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {tenantCanCreateAt} from '@/lib/permissions';
import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {ApiError,apiError,assertSameOrigin,json,readBoundedBody,readJson} from '@/lib/server/http';
import {withTenant} from '@/lib/server/db';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {parseDelimited,importLimits} from '@/lib/import-table';
import {readWorkbook} from '@/lib/server/spreadsheet-import.mjs';
import {commitCustomerImport,inspectCustomerImport} from '@/lib/server/repositories/customer-import';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'customers:write');
 if(!tenantCanCreateAt(s.role,'/kunden/neu',s.moduleProfile))throw new ApiError(403,'creation_forbidden','Für diesen Import fehlt die Berechtigung.');
 await requireModuleEntitlement(s.organizationId,'kunden');await enforceRateLimit(request,'customer-import',12,60_000);
 if(request.headers.get('content-type')?.startsWith('multipart/form-data')){
  const bytes=await readBoundedBody(request,importLimits.bytes+65536),form=await new Response(new Uint8Array(bytes),{headers:{'content-type':request.headers.get('content-type')!}}).formData(),file=form.get('file');
  if(!(file instanceof File)||!file.size||file.size>importLimits.bytes)throw new ApiError(400,'import_file','Bitte eine CSV- oder XLSX-Datei bis 3 MB auswählen.');
  let table:{sheets:string[];sheet:string;rows:string[][];rowNumbers:number[]};
  try{if(file.name.toLowerCase().endsWith('.xlsx'))table=await readWorkbook(Buffer.from(await file.arrayBuffer()),String(form.get('sheet')??'')) as typeof table;
  else if(file.name.toLowerCase().endsWith('.csv')){const rowNumbers:number[]=[];table={sheets:[],sheet:'',rows:parseDelimited(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()),rowNumbers),rowNumbers};}else throw Error('format');}
  catch{throw new ApiError(400,'import_invalid','Datei nicht lesbar. Bitte UTF-8-CSV oder XLSX ohne Formeln, Makros und externe Verknüpfungen verwenden; höchstens 500 Zeilen und 32 Spalten.');}
  return json({...table,headers:table.rows[0],rows:table.rows.slice(1),rowNumbers:table.rowNumbers.slice(1)});
 }
 const body=await readJson<{action?:unknown;target?:unknown;rows?:unknown;customerId?:unknown}>(request,2*1024*1024);
 if(!['preview','commit'].includes(String(body.action))||!['customers','contacts'].includes(String(body.target))||!Array.isArray(body.rows))throw new ApiError(400,'import_invalid','Ungültiger Import.');
 const target=body.target as 'customers'|'contacts',rows=body.rows as Record<string,unknown>[],customerId=typeof body.customerId==='string'?body.customerId:'';
 if(target==='contacts'&&!/^[0-9a-f-]{36}$/i.test(customerId))throw new ApiError(400,'import_invalid','Bitte einen Kunden zuordnen.');
 if(body.action==='preview')return json({items:await withTenant(s.organizationId,s.userId,c=>inspectCustomerImport(c,s,target,rows,customerId))});
 return json(await withTenant(s.organizationId,s.userId,c=>commitCustomerImport(c,s,target,rows,customerId,request.headers.get('idempotency-key')??'')));
}catch(error){return apiError(error)}}
