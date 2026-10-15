"use client";

import Link from "next/link";
import {type ReactNode} from "react";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {Icon,Logo} from "./ui";
import {LocaleSwitcher} from "./locale-switcher";

/** Auth presentation only: forms retain their existing API/session handlers. */
export function AuthWorkspace({children}:{children:ReactNode}){
 return <main className="auth-page auth-workspace">
  <header className="auth-workspace-header"><Link href="/" aria-label="Binso One"><Logo/></Link><LocaleSwitcher compact/></header>
  <div className="auth-workspace-body">
   <section className="auth-workspace-intro" aria-labelledby="auth-workspace-title">
    <span className="eyebrow"><LocalizedText>{"Dein Geschäft. Klar organisiert."}</LocalizedText></span>
    <h2 id="auth-workspace-title"><LocalizedText>{"Alles verbunden. Alles im Blick."}</LocalizedText></h2>
    <p><LocalizedText>{"Kunden, Angebote, Rechnungen und Zeit – ein Arbeitsbereich für deinen Geschäftsalltag."}</LocalizedText></p>
    <ul>{[["users","Vom Kundenkontakt bis zur Zahlung"],["clock","Am Schreibtisch und unterwegs"],["chart","Zahlen und nächste Schritte im Überblick"]].map(([icon,label])=><li key={icon}><Icon name={icon} size={18}/><LocalizedText>{label}</LocalizedText></li>)}</ul>
    <Link className="text-action" href="/demo"><LocalizedText>{"Demo starten"}</LocalizedText><Icon name="arrow" size={16}/></Link>
   </section>
   {children}
  </div>
  <footer className="auth-workspace-footer"><span>© Binso GmbH</span><LocalizedElement as="nav" aria-label="Rechtliches"><Link href="/datenschutz"><LocalizedText>{"Datenschutz"}</LocalizedText></Link><Link href="/impressum"><LocalizedText>{"Impressum"}</LocalizedText></Link></LocalizedElement></footer>
 </main>;
}
