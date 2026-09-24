import Link from 'next/link'
import { PublicPageIntro, PublicShell } from '@/components/public/public-shell'
import { createPublicMetadata } from '@/lib/config/seo'

export const metadata = createPublicMetadata({
  title: 'Systemstatus',
  description: 'Technischer Status und Health-Informationen für Binso One.',
  path: '/status',
  keywords: ['Binso One Status', 'Systemstatus'],
})

export default function StatusPage() {
  return (
    <PublicShell>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Systemstatus" title="Betrieb von Binso One." description="Für technische Prüfungen steht ein standardisierter Health-Endpunkt zur Verfügung. Eine öffentliche Statushistorie wird separat aufgebaut." />
        <section className="public-status-card"><i /><div><strong>Technischer Health Check</strong><p>Der aktuelle Status kann über den produktiven Health-Endpunkt geprüft werden.</p></div><Link href="/api/health">Health Check öffnen →</Link></section>
      </main>
    </PublicShell>
  )
}
