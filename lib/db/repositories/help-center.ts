import 'server-only'
import { platformQuery } from '@/lib/db/client'

export type HelpArticle = {id:string;slug:string;title:string;summary?:string;body:string;categorySlug?:string;categoryTitle?:string;updatedAt:string}

export async function listPublishedHelpArticles(queryText='') {
  const q=queryText.trim()
  const r=await platformQuery<{id:string;slug:string;title:string;summary:string|null;body:string;category_slug:string|null;category_title:string|null;updated_at:Date}>(
    `select a.id,a.slug,a.title,a.summary,a.body,c.slug category_slug,c.title category_title,a.updated_at
       from help_center_articles a left join help_center_categories c on c.id=a.category_id
      where a.published=true and ($1='' or lower(a.title||' '||coalesce(a.summary,'')||' '||a.body||' '||array_to_string(a.keywords,' ')) like '%'||lower($1)||'%')
      order by coalesce(c.sort_order,999),a.title limit 100`,[q])
  return r.rows.map(x=>({id:x.id,slug:x.slug,title:x.title,summary:x.summary??undefined,body:x.body,categorySlug:x.category_slug??undefined,categoryTitle:x.category_title??undefined,updatedAt:x.updated_at.toISOString()}))
}

export async function getPublishedHelpArticle(slug:string){const list=await platformQuery<{id:string;slug:string;title:string;summary:string|null;body:string;category_slug:string|null;category_title:string|null;updated_at:Date}>(`select a.id,a.slug,a.title,a.summary,a.body,c.slug category_slug,c.title category_title,a.updated_at from help_center_articles a left join help_center_categories c on c.id=a.category_id where a.slug=$1 and a.published=true`,[slug]);const x=list.rows[0];return x?{id:x.id,slug:x.slug,title:x.title,summary:x.summary??undefined,body:x.body,categorySlug:x.category_slug??undefined,categoryTitle:x.category_title??undefined,updatedAt:x.updated_at.toISOString()}:null}

export async function recordHelpFeedback(input:{articleId:string;organizationId?:string;userId?:string;helpful:boolean}){await platformQuery(`insert into help_center_feedback(article_id,organization_id,user_id,helpful) values($1,$2,$3,$4)`,[input.articleId,input.organizationId??null,input.userId??null,input.helpful])}

export type PlatformHelpArticle = HelpArticle & {
  categoryId?: string
  published: boolean
  keywords: string[]
  helpful: number
  notHelpful: number
}

export async function listPlatformHelpArticles(): Promise<PlatformHelpArticle[]> {
  const result = await platformQuery<{
    id:string;slug:string;title:string;summary:string|null;body:string;category_id:string|null;category_slug:string|null;category_title:string|null;keywords:string[]|null;published:boolean;updated_at:Date;helpful:string;not_helpful:string
  }>(`select a.id,a.slug,a.title,a.summary,a.body,a.category_id,c.slug category_slug,c.title category_title,a.keywords,a.published,a.updated_at,
      count(f.id) filter (where f.helpful=true)::text helpful,
      count(f.id) filter (where f.helpful=false)::text not_helpful
    from help_center_articles a
    left join help_center_categories c on c.id=a.category_id
    left join help_center_feedback f on f.article_id=a.id
    group by a.id,c.id
    order by coalesce(c.sort_order,999),a.title`)
  return result.rows.map(row=>({
    id:row.id,slug:row.slug,title:row.title,summary:row.summary??undefined,body:row.body,
    categoryId:row.category_id??undefined,categorySlug:row.category_slug??undefined,categoryTitle:row.category_title??undefined,
    keywords:row.keywords??[],published:row.published,updatedAt:row.updated_at.toISOString(),helpful:Number(row.helpful),notHelpful:Number(row.not_helpful),
  }))
}

export async function listPlatformHelpCategories() {
  const result=await platformQuery<{id:string;slug:string;title:string;description:string|null;sort_order:number;published:boolean}>(
    `select id,slug,title,description,sort_order,published from help_center_categories order by sort_order,title`,
  )
  return result.rows.map(row=>({id:row.id,slug:row.slug,title:row.title,description:row.description??undefined,sortOrder:row.sort_order,published:row.published}))
}

export async function upsertPlatformHelpArticle(input:{
  id?:string;slug:string;title:string;summary?:string;body:string;categoryId?:string;keywords:string[];published:boolean;actorUserId:string;actorEmail:string
}) {
  const result=input.id
    ? await platformQuery<{id:string}>(`update help_center_articles set slug=$2,title=$3,summary=$4,body=$5,category_id=$6,keywords=$7,published=$8,updated_by_user_id=$9,updated_at=now() where id=$1 returning id`,[input.id,input.slug,input.title,input.summary??null,input.body,input.categoryId??null,input.keywords,input.published,input.actorUserId])
    : await platformQuery<{id:string}>(`insert into help_center_articles(slug,title,summary,body,category_id,keywords,published,updated_by_user_id) values($1,$2,$3,$4,$5,$6,$7,$8) returning id`,[input.slug,input.title,input.summary??null,input.body,input.categoryId??null,input.keywords,input.published,input.actorUserId])
  const id=result.rows[0]?.id
  if (!id) throw new Error('help_article_not_saved')
  await platformQuery(`insert into platform_audit_events(actor_user_id,actor_email,action,detail) values($1,$2,'help.article.updated',$3)`,[input.actorUserId,input.actorEmail,`${id}; ${input.slug}; published=${input.published}`])
  return id
}
