"use client";

import MarketingFrame from "@/components/marketing/marketing-frame";
import TranslatedMarkup from "@/components/i18n/translated-markup";
import {useLocale} from "@/components/locale-provider";

export default function LegalPage({title,lead,kicker="Rechtliches",children}:{title:string;lead?:string;kicker?:string;children:React.ReactNode}){
 const {t}=useLocale();
 return <MarketingFrame>
  <section className="legal-main"><div className="legal-kicker">Binso One · {t(kicker)}</div><h1>{t(title)}</h1>{lead&&<p className="legal-lead">{t(lead)}</p>}<article className="legal-content"><TranslatedMarkup>{children}</TranslatedMarkup></article></section>
 </MarketingFrame>;
}
