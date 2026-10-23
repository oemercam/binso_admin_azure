"use client";

import Link from "next/link";
import {type ReactNode} from "react";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {Logo} from "./ui";
import {LocaleSwitcher} from "./locale-switcher";
import {PrivacySettingsButton} from './privacy-settings-button';

/** Auth presentation only: forms retain their existing API/session handlers. */
export function AuthWorkspace({children,lang,showLocaleSwitcher=true,variant='identity'}:{children:ReactNode;lang?:string;showLocaleSwitcher?:boolean;variant?:'identity'|'message'}){
 return <main className="auth-page auth-workspace" lang={lang} data-layout={variant}>
  <header className="auth-workspace-header"><Link href="/" aria-label="Binso One"><Logo/></Link>{showLocaleSwitcher&&<LocaleSwitcher compact/>}</header>
  <div className="auth-workspace-body">
   {children}
  </div>
  <footer className="auth-workspace-footer"><span>© Binso GmbH</span><LocalizedElement as="nav" aria-label="Rechtliches"><Link href="/datenschutz"><LocalizedText>{"Datenschutz"}</LocalizedText></Link><Link href="/impressum"><LocalizedText>{"Impressum"}</LocalizedText></Link><PrivacySettingsButton/></LocalizedElement></footer>
 </main>;
}
