import { getPlatformSession } from '@/lib/auth/server'
import { getPlatformSupportThread, listPlatformSupportCases, platformUpdateSupportCase } from '@/lib/db/repositories/support-cases'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'
import type { SupportCaseClassification, SupportCasePriority, SupportCaseStatus, SupportCaseType } from '@/types/domain'

const statuses=new Set<SupportCaseStatus>(['open','in_progress','waiting_for_customer','resolved','closed'])
const caseTypes=new Set<SupportCaseType>(['support','feedback','feature_request','billing'])
const classifications=new Set<SupportCaseClassification>(['blocker','friction','request'])
const priorities=new Set<SupportCasePriority>(['low','normal','high','urgent'])
function canSupport(role?:string){return !!role&&['platform_owner','platform_admin','platform_support'].includes(role)}

export async function GET(request:Request){
  const s=await getPlatformSession();if(!s||!canSupport(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.')
  const id=new URL(request.url).searchParams.get('caseId')
  if(id){const t=await getPlatformSupportThread(id);return t?apiJson(t):apiError(404,'not_found','Supportfall nicht gefunden.')}
  return apiJson({cases:await listPlatformSupportCases()})
}

export async function PATCH(request:Request){
  try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}
  const s=await getPlatformSession();if(!s||!canSupport(s.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.')
  const b=await readJsonBody<{caseId?:string;message?:string;internalNote?:string;status?:SupportCaseStatus;caseType?:SupportCaseType;classification?:SupportCaseClassification|null;priority?:SupportCasePriority;assignedToUserId?:string|null}>(request,24_000).catch(()=>null)
  const message=b?.message?.trim()??''
  const internalNote=b?.internalNote?.trim()??''
  if(!b?.caseId||!b.status||!statuses.has(b.status)||!b.caseType||!caseTypes.has(b.caseType)||!b.priority||!priorities.has(b.priority)||message.length>5000||internalNote.length>5000||(b.classification!=null&&!classifications.has(b.classification)))return apiError(422,'validation','Anliegen, Status, Priorität oder Antwort ungültig.')
  try{return apiJson({message:await platformUpdateSupportCase({caseId:b.caseId,userId:s.user.id,email:s.user.email,message,internalNote,status:b.status,caseType:b.caseType,classification:b.classification??undefined,priority:b.priority,assignedToUserId:b.assignedToUserId?.trim()||undefined})})}catch(e){return apiError(404,'not_found',e instanceof Error?e.message:'Supportfall nicht gefunden.')}
}
