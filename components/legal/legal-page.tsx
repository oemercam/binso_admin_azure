import MarketingFrame from "@/components/marketing/marketing-frame";

export default function LegalPage({title,lead,children}:{title:string;lead?:string;children:React.ReactNode}){
 return <MarketingFrame>
  <section className="legal-main"><div className="legal-kicker">Binso One · Rechtliches</div><h1>{title}</h1>{lead&&<p className="legal-lead">{lead}</p>}<article className="legal-content">{children}</article></section>
 </MarketingFrame>
}
