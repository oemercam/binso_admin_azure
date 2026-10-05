import Link from "next/link";
import {MarketingFooter,MarketingHeader} from "@/components/marketing";

export function LegalPage({eyebrow,title,intro,children}:{eyebrow:string;title:string;intro:string;children:React.ReactNode}){
  return <><MarketingHeader/><main className="legal-page">
    <header className="legal-hero"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></header>
    <article className="legal-content">{children}</article>
    <nav className="legal-related" aria-label="Rechtliche Dokumente">
      <Link href="/impressum">Impressum</Link>
      <Link href="/datenschutz">Datenschutz</Link>
      <Link href="/agb">AGB</Link>
      <Link href="/auftragsbearbeitung">Auftragsbearbeitung</Link>
      <Link href="/unterauftragsbearbeiter">Unterauftragsbearbeiter</Link>
    </nav>
  </main><MarketingFooter/></>;
}
