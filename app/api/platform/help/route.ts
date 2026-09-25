import { getPlatformSession } from '@/lib/auth/server'
import { listPlatformHelpArticles, listPlatformHelpCategories, upsertPlatformHelpArticle } from '@/lib/db/repositories/help-center'
import { apiError, apiJson, readJsonBody, requireSameOrigin } from '@/lib/http/server-api'

function canRead(role?:string){return !!role&&['platform_owner','platform_admin','platform_support','platform_auditor'].includes(role)}
function canManage(role?:string){return role==='platform_owner'||role==='platform_admin'}

export async function GET(){
  const session=await getPlatformSession()
  if(!session||!canRead(session.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.')
  const [articles,categories]=await Promise.all([listPlatformHelpArticles(),listPlatformHelpCategories()])
  return apiJson({articles,categories,canManage:canManage(session.user.platformRole)})
}

export async function PUT(request:Request){
  try{requireSameOrigin(request)}catch{return apiError(403,'invalid_origin','Ungültige Anfragequelle.')}
  const session=await getPlatformSession()
  if(!session||!canManage(session.user.platformRole))return apiError(403,'forbidden','Keine Plattformberechtigung.')
  const body=await readJsonBody<{id?:string;slug?:string;title?:string;summary?:string;body?:string;categoryId?:string;keywords?:string[];published?:boolean}>(request,64_000).catch(()=>null)
  const slug=body?.slug?.trim().toLowerCase()??''
  const title=body?.title?.trim()??''
  const articleBody=body?.body?.trim()??''
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||title.length<3||title.length>180||articleBody.length<10||articleBody.length>30_000)return apiError(422,'validation','Artikelangaben sind ungültig.')
  const keywords=(body?.keywords??[]).map(item=>item.trim().toLowerCase()).filter(Boolean).slice(0,20).map(item=>item.slice(0,80))
  try{
    const id=await upsertPlatformHelpArticle({id:body?.id,slug,title,summary:body?.summary?.trim().slice(0,500),body:articleBody,categoryId:body?.categoryId||undefined,keywords,published:Boolean(body?.published),actorUserId:session.user.id,actorEmail:session.user.email})
    return apiJson({id})
  }catch{return apiError(409,'conflict','Artikel konnte nicht gespeichert werden. Slug eventuell bereits vorhanden.')}
}
