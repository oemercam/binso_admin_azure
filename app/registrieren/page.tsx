import Link from "next/link";

export default function Registrieren() {
  return (
    <main className="auth">
      <div className="auth-brand">binso <span>One</span></div>
      <section>
        <h1>Konto erstellen</h1>
        <p>Starte jetzt 30 Tage kostenlos.</p>
        <label>Name<input autoComplete="name" placeholder="Dein Name" /></label>
        <label>E-Mail<input type="email" autoComplete="email" placeholder="name@firma.ch" /></label>
        <label>Passwort<input type="password" autoComplete="new-password" placeholder="Passwort wählen" /></label>
        <label className="check"><input type="checkbox" /> Ich akzeptiere die AGB und Datenschutzbestimmungen.</label>
        <Link className="auth-submit" href="/dashboard">Konto erstellen</Link>
        <footer>Bereits registriert?<br /><Link href="/login">Anmelden</Link></footer>
      </section>
    </main>
  );
}