import type { ReactNode } from 'react'
import { PublicPageIntro, PublicShell } from './public-shell'

export function LegalPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <PublicShell compact>
      <main className="v80-main v812-page v812-legal-page">
        <PublicPageIntro eyebrow="Rechtliches" title={title} description={description} />
        <article className="v812-legal-content"><p className="legal-language-note">Übersetzungen dienen der besseren Verständlichkeit. Bei Abweichungen ist die deutsche Fassung massgebend.</p>{children}</article>
      </main>
    </PublicShell>
  )
}
