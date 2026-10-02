import Link from "next/link";

export function PublicShell({children}:{children:React.ReactNode}) {
  return <main className="public-shell">
    <header className="public-header">
      <Link className="public-brand" href="/">binso <span>One</span></Link>
      <nav>
        <Link href="/funktionen">Funktionen</Link><Link href="/so-funktioniert-es">So funktioniert es</Link>
        <Link href="/preise">Preise</Link><Link href="/faq">FAQ</Link>
      </nav>
      <div className="public-actions"><Link href="/login">Anmelden</Link><Link className="black" href="/registrieren">30 Tage kostenlos testen</Link><button>DE⌄</button></div>
    </header>{children}
  </main>
}