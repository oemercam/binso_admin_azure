"use client";

import {useState,type ReactNode} from "react";
import {Languages} from "lucide-react";
import {usePathname} from "next/navigation";
import {usePageAccess} from "@/lib/client/page-access";
import {LocalizedText,useTranslation} from "@/lib/client/locale";
import {Icon,Input,EmptyState} from "./ui";
import {ActionRow,SettingsGroup} from "./binso-ux";

/** One destination catalogue for the settings overview and every settings page. */
export const settingsGroups:Array<{title:string;rows:Array<readonly [string,ReactNode,string]>}>=[
 {title:"Persönlich",rows:[["/einstellungen/konto","user","Persönliche Daten"],["/einstellungen/sicherheit","lock","Sicherheit"],["/einstellungen/benachrichtigungen","bell","Benachrichtigungen"],["/einstellungen/darstellung","sun","Darstellung & Sprache"],["/einstellungen/sprache",<Languages key="language" size={18} aria-hidden="true"/>,"Sprache"]]},
 {title:"Unternehmen",rows:[["/einstellungen/firma","users","Firma"],["/einstellungen/team","users","Benutzer & Rollen"],["/einstellungen/abonnement","card","Abonnement"]]},
 {title:"Geschäftsprozesse",rows:[["/einstellungen/dokumente","receipt","Rechnungen & Dokumente"],["/einstellungen/zeiterfassung","clock","Zeiterfassung"]]},
 {title:"Datenschutz",rows:[["/einstellungen/datenschutz","lock","Datenschutz & Cookies"]]},
];

export function SettingsNavigation({context=false}:{context?:boolean}){
 const access=usePageAccess(),pathname=usePathname(),translate=useTranslation();
 const [query,setQuery]=useState("");
 const term=query.trim().toLocaleLowerCase();
 const groups=settingsGroups.map(group=>({...group,rows:group.rows.filter(([href,,label])=>access.canOpen(href)&&(!term||(translate(group.title)+" "+translate(label)).toLocaleLowerCase().includes(term)))})).filter(group=>group.rows.length);
 const current=settingsGroups.flatMap(group=>group.rows).find(([href])=>href===pathname)?.[2]??"Einstellungen";
 const content=<><label className="searchbox settings-navigation-search"><Icon name="search"/><Input type="search" aria-label="Einstellungen suchen" placeholder="Einstellungen suchen" value={query} onChange={event=>setQuery(event.target.value)}/></label><nav aria-label={translate("Einstellungen")}>{groups.map(group=><SettingsGroup title={group.title} key={group.title}><div className="settings-list">{group.rows.map(([href,icon,label])=><ActionRow key={href} href={href} icon={icon} title={label} current={pathname===href}/>)}</div></SettingsGroup>)}</nav>{!groups.length&&<EmptyState compact title="Keine passenden Einstellungen" text="Versuche einen anderen Suchbegriff."/>}</>;
 return context?<><aside className="settings-context-navigation">{content}</aside><details className="settings-mobile-navigation" key={pathname}><summary><Icon name="menu"/><LocalizedText>{current}</LocalizedText></summary>{content}</details></>:<div className="settings-overview">{content}</div>;
}

/** Shared workspace composition; pages keep their existing data and form handlers. */
export function SettingsWorkspace({children}:{children:ReactNode}){
 const pathname=usePathname();
 return pathname.startsWith("/einstellungen/")?<div className="settings-workspace"><SettingsNavigation context/><div className="settings-page-content">{children}</div></div>:<>{children}</>;
}
