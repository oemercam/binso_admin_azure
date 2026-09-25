import { notFound } from 'next/navigation'
import { getPublishedHelpArticle } from '@/lib/db/repositories/help-center'
import { HelpArticleFeedback } from '@/components/help/help-article-feedback'

export const dynamic='force-dynamic'
export default async function HelpArticlePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=await getPublishedHelpArticle(slug);if(!a)notFound();return <main className="page apple-page"><article className="settings-section"><p>{a.categoryTitle??'Hilfe'}</p><h1>{a.title}</h1>{a.summary&&<p>{a.summary}</p>}<div style={{whiteSpace:'pre-wrap'}}>{a.body}</div><HelpArticleFeedback articleId={a.id}/></article></main>}
