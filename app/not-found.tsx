import {LocalizedText} from "@/lib/client/locale";
import { Button, Logo } from "@/components/ui";

export default function NotFound() {
  return <main className="auth-page flow-noir flow-auth"><section className="auth-card error-state"><Logo/><span className="error-code">404</span><h1><LocalizedText>{"Seite nicht gefunden"}</LocalizedText></h1><p><LocalizedText>{"Diese Seite existiert nicht oder wurde verschoben."}</LocalizedText></p><Button href="/dashboard"><LocalizedText>{"Zur Übersicht"}</LocalizedText></Button><Button href="/" variant="secondary"><LocalizedText>{"Zur Website"}</LocalizedText></Button></section></main>;
}