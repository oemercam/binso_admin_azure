import { resolveAuthorizedTenantContext } from '@/lib/auth/tenant-server'
import { addTenantSupportMessage, createTenantSupportCase, getTenantSupportThread, listTenantSupportCases } from '@/lib/db/repositories/support-cases'
import { apiError, apiJson, readJsonBody, requestId, requireSameOrigin } from '@/lib/http/server-api'
import type { SupportCaseCategory, SupportCaseType } from '@/types/domain'

const categories=new Set<SupportCaseCategory>(['usage','technical','billing','account','other'])
const caseTypes=new Set<SupportCaseType>(['support','feedback','feature_request','billing'])

export async function GET(request:Request){
  const context=await resolveAuthorizedTenantContext(undefined,'support.request')
  if(!context) return apiError(403,'forbidden','Keine Berechtigung.')
  const caseId=new URL(request.url).searchParams.get('caseId')
  if(caseId){ const thread=await getTenantSupportThread(context,caseId); return thread?apiJson(thread):apiError(404,'not_found','Supportfall wurde nicht gefunden.') }
  return apiJson({cases:await listTenantSupportCases(context)})
}

export async function POST(request:Request){
  try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}
  const body=await readJsonBody<{caseType?:SupportCaseType;category?:SupportCaseCategory;subject?:string;message?:string;currentPage?:string;entityType?:string;entityId?:string;buildVersion?:string;browser?:string}>(request,32_768).catch(()=>null)
  if(!body||!body.caseType||!caseTypes.has(body.caseType)||!body.category||!categories.has(body.category)) return apiError(422,'validation','Anliegen oder Kategorie fehlt.')
  const subject=body.subject?.trim()??''; const message=body.message?.trim()??''
  if(subject.length<3||subject.length>160||message.length<1||message.length>5000) return apiError(422,'validation','Bitte Betreff und Nachricht prüfen.')
  const context=await resolveAuthorizedTenantContext(undefined,'support.request'); if(!context) return apiError(403,'forbidden','Keine Berechtigung.')
  const c=await createTenantSupportCase({organizationId:context.organizationId,userId:context.userId,actorName:context.email,caseType:body.caseType,category:body.category,subject,message,currentPage:body.currentPage?.slice(0,500),entityType:body.entityType?.slice(0,80),entityId:body.entityId?.slice(0,120),buildVersion:body.buildVersion?.slice(0,80),browser:body.browser?.slice(0,300),correlationId:requestId(request)})
  return apiJson({case:c},{status:201})
}

export async function PATCH(request:Request){
  try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}
  const body=await readJsonBody<{caseId?:string;message?:string}>(request,16_384).catch(()=>null); const message=body?.message?.trim()??''
  if(!body?.caseId||message.length<1||message.length>5000) return apiError(422,'validation','Nachricht fehlt.')
  const context=await resolveAuthorizedTenantContext(undefined,'support.request'); if(!context) return apiError(403,'forbidden','Keine Berechtigung.')
  try{return apiJson({message:await addTenantSupportMessage({organizationId:context.organizationId,userId:context.userId,caseId:body.caseId,message})})}catch(e){return apiError(404,'not_found',e instanceof Error?e.message:'Supportfall wurde nicht gefunden.')}
}
