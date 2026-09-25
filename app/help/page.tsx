import Link from 'next/link'
import { Input } from '@/components/ui/form-controls'
import { listPublishedHelpArticles } from '@/lib/db/repositories/help-center'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'

export const dynamic='force-dynamic'
export default async function HelpPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=''}=await searchParams
  const articles=await listPublishedHelpArticles(q)
  return (
    <PublicShell>
      <main className="v80-main v812-page">
        <PublicPageIntro eyebrow="Hilfe" title="Schnell zur passenden Antwort." description="Kurze Anleitungen für die wichtigsten Schritte in Binso One." />
        <form className="v812-help-search" action="/help"><Input name="q" defaultValue={q} placeholder="Hilfe durchsuchen"/><button className="button secondary" type="submit">Suchen</button></form>
        <section className="v812-help-list">{articles.map(a=><Link key={a.id} href={`/help/${a.slug}`}><span><strong>{a.title}</strong><small>{a.categoryTitle??'Hilfe'} · {a.summary??''}</small></span><b>→</b></Link>)}</section>
      </main>
    </PublicShell>
  )
}
