import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedHelpArticle } from '@/lib/db/repositories/help-center'
import { HelpArticleFeedback } from '@/components/help/help-article-feedback'
import { PublicShell } from '@/components/public/public-shell'

export const dynamic='force-dynamic'
export default async function HelpArticlePage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params
  const a=await getPublishedHelpArticle(slug)
  if(!a)notFound()
  return (
    <PublicShell compact>
      <main className="v80-main v812-page v812-help-article-page">
        <Link className="v81-text-link" href="/help">← Zur Hilfe</Link>
        <article className="v812-help-article"><span className="v80-eyebrow">{a.categoryTitle??'Hilfe'}</span><h1>{a.title}</h1>{a.summary&&<p className="v812-help-summary">{a.summary}</p>}<div className="v812-help-body" style={{whiteSpace:'pre-wrap'}}>{a.body}</div><HelpArticleFeedback articleId={a.id}/></article>
      </main>
    </PublicShell>
  )
}
