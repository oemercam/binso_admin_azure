import Link from "next/link";
import BrandLogo from "@/components/ui/brand-logo";
import MarketingFooter from "@/components/marketing/marketing-footer";

export default function LegalPage({title,lead,children}:{title:string;lead?:string;children:React.ReactNode}){
 return <div className="legal-shell">
  <header className="legal-header"><Link href="/" aria-label="Binso One"><BrandLogo/></Link><nav><Link href="/">Start</Link><Link href="/support">Support</Link></nav></header>
  <main className="legal-main"><div className="legal-kicker">Binso One · Rechtliches</div><h1>{title}</h1>{lead&&<p className="legal-lead">{lead}</p>}<article className="legal-content">{children}</article></main>
  <MarketingFooter/>
 </div>
}
