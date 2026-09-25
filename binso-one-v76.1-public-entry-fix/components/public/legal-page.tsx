import type { ReactNode } from 'react'
import { PublicPageIntro, PublicShell } from './public-shell'

export function LegalPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <PublicShell compact>
      <main className="public-main public-main-narrow">
        <PublicPageIntro eyebrow="Rechtliches" title={title} description={description} />
        <article className="legal-content">{children}</article>
      </main>
    </PublicShell>
  )
}
