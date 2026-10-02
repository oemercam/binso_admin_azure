"use client";

import { Button, Logo } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="auth-page"><section className="auth-card error-state"><Logo/><span className="error-code">Fehler</span><h1>Etwas ist schiefgelaufen</h1><p>Die Seite konnte nicht vollständig geladen werden. Deine Daten wurden dadurch nicht verändert.</p><Button onClick={reset}>Erneut versuchen</Button><Button href="/dashboard" variant="secondary">Zur Übersicht</Button></section></main>;
}