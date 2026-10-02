import Link from "next/link";
import { Logo } from "@/components/ui";

export default function Page() {
  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1>Keine Verbindung</h1>
      <p>Binso One benötigt für aktuelle Unternehmensdaten eine Internetverbindung. Sobald du wieder online bist, kannst du direkt weiterarbeiten.</p>
      <Link className="button button-primary" href="/dashboard">Erneut versuchen</Link>
    </section>
  </main>;
}