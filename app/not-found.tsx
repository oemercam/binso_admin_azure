import { Button, Logo } from "@/components/ui";

export default function NotFound() {
  return <main className="auth-page"><section className="auth-card error-state"><Logo/><span className="error-code">404</span><h1>Seite nicht gefunden</h1><p>Diese Seite existiert nicht oder wurde verschoben.</p><Button href="/dashboard">Zur Übersicht</Button><Button href="/" variant="secondary">Zur Website</Button></section></main>;
}