import Link from "next/link";
import BrandLogo from "@/components/ui/brand-logo";

export default function LegalPage({title,lead,children}:{title:string;lead?:string;children:React.ReactNode}){
 return <div className="legal-shell">
  <header className="legal-header"><Link href="/" aria-label="Binso One"><BrandLogo/></Link><nav><Link href="/">Start</Link><Link href="/support">Support</Link><Link href="/datenschutz">Datenschutz</Link></nav></header>
  <main className="legal-main"><div className="legal-kicker">Binso One · Rechtliches</div><h1>{title}</h1>{lead&&<p className="legal-lead">{lead}</p>}<article className="legal-content">{children}</article></main>
  <footer className="legal-footer"><span>© 2026 Binso GmbH</span><div><Link href="/impressum">Impressum</Link><Link href="/agb">AGB</Link><Link href="/datenschutz">Datenschutz</Link><Link href="/cookies">Cookies</Link><Link href="/auftragsbearbeitung">Auftragsbearbeitung</Link><Link href="/unterauftragsbearbeiter">Unterauftragsbearbeiter</Link><Link href="/sicherheit">Sicherheit</Link></div></footer>
 </div>
}
