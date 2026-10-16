"use client";

import {LocalizedText} from "@/lib/client/locale";
import { Button, Logo } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="auth-page flow-noir flow-auth"><section className="auth-card error-state"><Logo/><span className="error-code"><LocalizedText>{"Fehler"}</LocalizedText></span><h1><LocalizedText>{"Etwas ist schiefgelaufen"}</LocalizedText></h1><p><LocalizedText>{"Die Seite konnte nicht vollständig geladen werden."}</LocalizedText></p><Button onClick={reset}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button><Button href="/dashboard" variant="secondary"><LocalizedText>{"Zur Übersicht"}</LocalizedText></Button></section></main>;
}