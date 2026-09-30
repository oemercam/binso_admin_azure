"use client";

import {ButtonLink} from "@/components/ui/button-link";
import {useLocale} from "@/components/locale-provider";

export default function SystemPage({code,title,text,href="/",linkLabel="Zur Startseite",children}:{code:string;title:string;text:string;href?:string;linkLabel?:string;children?:React.ReactNode}){
 const {t}=useLocale();
 return <main className="system-page"><div className="system-card"><div className="system-code">{code}</div><h1>{t(title)}</h1><p>{t(text)}</p>{children}<ButtonLink href={href}>{t(linkLabel)}</ButtonLink></div></main>;
}
