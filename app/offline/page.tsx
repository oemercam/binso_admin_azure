import {LocalizedText} from "@/lib/client/locale";
import Link from "next/link";
import { Logo } from "@/components/ui";

export default function Page() {
  return <main className="auth-page flow-noir flow-auth">
    <section className="auth-card">
      <Logo/>
      <h1><LocalizedText>{"Keine Verbindung"}</LocalizedText></h1>
      <p><LocalizedText>{"Binso One benötigt für aktuelle Unternehmensdaten eine Internetverbindung. Sobald du wieder online bist, kannst du direkt weiterarbeiten."}</LocalizedText></p>
      <Link className="button button-primary" href="/dashboard"><LocalizedText>{"Erneut versuchen"}</LocalizedText></Link>
    </section>
  </main>;
}