import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/form-controls'
import { listPublishedHelpArticles } from '@/lib/db/repositories/help-center'

export const dynamic='force-dynamic'
export default async function HelpPage({searchParams}:{searchParams:Promise<{q?:string}>}){const {q=''}=await searchParams;const articles=await listPublishedHelpArticles(q);return <main className="page apple-page"><PageHeader title="Hilfe" description="Kurze Anleitungen für die wichtigsten Schritte in Binso One."/><form className="module-toolbar" action="/help"><Input name="q" defaultValue={q} placeholder="Hilfe durchsuchen"/><button className="button secondary" type="submit">Suchen</button></form><div className="data-list compact-overview-list">{articles.map(a=><Link key={a.id} href={`/help/${a.slug}`} className="data-row compact-overview-row"><span className="primary-cell"><strong>{a.title}</strong><small>{a.categoryTitle??'Hilfe'} · {a.summary??''}</small></span><span className="row-disclosure">›</span></Link>)}</div></main>}
