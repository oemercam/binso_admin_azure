import MarketingFrame from "@/components/marketing/marketing-frame";

export default function LegalPage({title,lead,kicker="Rechtliches",children}:{title:string;lead?:string;kicker?:string;children:React.ReactNode}){
 return <MarketingFrame>
  <section className="legal-main"><div className="legal-kicker">Binso One · {kicker}</div><h1>{title}</h1>{lead&&<p className="legal-lead">{lead}</p>}<article className="legal-content">{children}</article></section>
 </MarketingFrame>
}
