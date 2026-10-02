import Link from "next/link";
import { Button, Logo } from "@/components/ui";

export default function Register() {
  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1>Konto erstellen</h1>
      <p>Nur das Nötigste. Weitere Angaben kannst du später ergänzen.</p>
      <form>
        <label>Firmenname<input autoFocus placeholder="Meine Firma GmbH"/></label>
        <label>E-Mail<input type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
        <label>Passwort<input type="password" autoComplete="new-password" placeholder="Mindestens 8 Zeichen"/></label>
        <Button href="/willkommen">Account erstellen</Button>
      </form>
      <small>Mit der Registrierung akzeptierst du die AGB und Datenschutzerklärung.</small>
      <p className="auth-bottom">Bereits registriert? <Link href="/login">Anmelden</Link></p>
    </section>
  </main>;
}