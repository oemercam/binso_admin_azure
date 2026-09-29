import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
export default function NotFound(){
 return <main className="system-page"><div className="system-card"><div className="system-icon"><FileQuestion/></div><div className="system-code">404</div><h1>Seite nicht gefunden</h1><p>Die angeforderte Seite konnte nicht gefunden werden.</p><div className="system-actions"><Link href="/" className="secondary-button"><ArrowLeft size={16}/> Zur Startseite</Link><Link href="/dashboard" className="primary-inline">Zurück zum Dashboard</Link></div></div></main>
}
