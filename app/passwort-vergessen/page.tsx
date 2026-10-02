import Link from "next/link";
import { Button, Logo } from "@/components/ui";

export default function Page() {
  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1>Passwort zurücksetzen</h1>
      <p>Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.</p>
      <form>
        <label>E-Mail<input autoFocus type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
        <Button href="/login">Link senden</Button>
      </form>
      <p className="auth-bottom"><Link href="/login">Zurück zur Anmeldung</Link></p>
    </section>
  </main>;
}