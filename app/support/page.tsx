import Link from 'next/link'
import { PublicPageIntro,PublicShell } from '@/components/public/public-shell'
import { CustomerSupport } from '@/components/support/customer-support'
import { getSession } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db/client'

export const dynamic='force-dynamic'
export default async function SupportPage(){const session=await getSession();if(session&&isDatabaseConfigured())return <PublicShell><CustomerSupport/></PublicShell>;return <PublicShell><main className="public-main public-main-narrow"><PublicPageIntro eyebrow="Support" title="Hilfe, wenn du sie brauchst." description="Melde dich an, um einen Supportfall direkt in Binso One zu erstellen und den Verlauf zu sehen."/><section className="public-support-grid"><article><span>01</span><h2>Direkter Support</h2><p>Supportfälle werden digital in Binso One bearbeitet und bleiben nachvollziehbar.</p><Link href="/sign-in">Anmelden →</Link></article><article><span>02</span><h2>FAQ</h2><p>Antworten auf häufige Fragen zu Nutzung, Anmeldung und Abrechnung.</p><Link href="/faq">FAQ öffnen →</Link></article><article><span>03</span><h2>Sicher kommunizieren</h2><p>Keine Passwörter, Tokens oder Zugangsdaten senden. Diagnosekontext wird nur in sicherem Umfang ergänzt.</p></article></section></main></PublicShell>}
