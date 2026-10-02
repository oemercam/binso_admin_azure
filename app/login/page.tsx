"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Logo } from "@/components/ui";

export default function Login() {
  const [show, setShow] = useState(false);
  return <main className="auth-page">
    <section className="auth-card">
      <Logo/>
      <h1>Willkommen zurück</h1>
      <p>Melde dich in deinem Binso One Konto an.</p>
      <form>
        <label>E-Mail<input type="email" inputMode="email" autoComplete="email" placeholder="name@firma.ch"/></label>
        <label>Passwort
          <div className="password-field">
            <input type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"/>
            <button type="button" onClick={() => setShow(!show)}>{show ? "Ausblenden" : "Anzeigen"}</button>
          </div>
        </label>
        <div className="form-link"><Link href="/passwort-vergessen">Passwort vergessen?</Link></div>
        <Button href="/dashboard">Anmelden</Button>
      </form>
      <div className="auth-divider"><span>oder</span></div>
      <Button href="/demo" variant="secondary">Demo starten</Button>
      <p className="auth-bottom">Noch kein Konto? <Link href="/registrieren">Account erstellen</Link></p>
    </section>
  </main>;
}