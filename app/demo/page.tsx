import Link from "next/link";
import { Button, Logo } from "@/components/ui";
export default function Demo(){return <main className="auth-page"><section className="auth-card demo-card"><Logo/><span className="demo-badge">DEMO</span><h1>Binso One ausprobieren</h1><p>Starte direkt mit realistischen Beispieldaten. Keine Registrierung notwendig.</p><div className="demo-company"><b>Musterwerk AG</b><span>Demo-Umgebung · Beispielinhalt</span></div><Button href="/dashboard">Demo starten</Button><Link href="/">Zurück zur Website</Link></section></main>}
