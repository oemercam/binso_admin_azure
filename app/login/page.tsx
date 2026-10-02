import Link from "next/link";

export default function Login() {
  return (
    <main className="auth">
      <div className="auth-brand">binso <span>One</span></div>
      <section>
        <h1>Willkommen zurück</h1>
        <p>Melde dich bei deinem Konto an.</p>
        <label>E-Mail<input type="email" autoComplete="email" placeholder="name@firma.ch" /></label>
        <label>Passwort<input type="password" autoComplete="current-password" placeholder="Passwort eingeben" /></label>
        <div className="auth-options">
          <label><input type="checkbox" /> Angemeldet bleiben</label>
          <Link href="/passwort-vergessen">Passwort vergessen?</Link>
        </div>
        <Link className="auth-submit" href="/dashboard">Anmelden</Link>
        <footer>Noch kein Konto?<br /><Link href="/registrieren">Jetzt kostenlos testen</Link></footer>
      </section>
    </main>
  );
}