import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import Link from "next/link";
import {MarketingFooter,MarketingHeader} from "@/components/marketing";

export function LegalPage({eyebrow,title,intro,children}:{eyebrow:string;title:string;intro:string;children:React.ReactNode}){
  return <><MarketingHeader/><main className="legal-page">
    <header className="legal-hero"><span className="eyebrow">{eyebrow}</span><h1><LocalizedText>{title}</LocalizedText></h1><p>{intro}</p></header>
    <article className="legal-content">{children}</article>
    <LocalizedElement as="nav" className="legal-related" aria-label="Rechtliche Dokumente">
      <Link href="/impressum"><LocalizedText>{"Impressum"}</LocalizedText></Link>
      <Link href="/datenschutz"><LocalizedText>{"Datenschutz"}</LocalizedText></Link>
      <Link href="/agb"><LocalizedText>{"AGB"}</LocalizedText></Link>
      <Link href="/auftragsbearbeitung"><LocalizedText>{"Auftragsbearbeitung"}</LocalizedText></Link>
      <Link href="/unterauftragsbearbeiter"><LocalizedText>{"Unterauftragsbearbeiter"}</LocalizedText></Link>
    </LocalizedElement>
  </main><MarketingFooter/></>;
}
