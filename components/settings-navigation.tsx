"use client";

import {useState,type ReactNode} from "react";
import {Languages} from "lucide-react";
import {usePathname,useSearchParams} from "next/navigation";
import {safeAppPath} from "@/lib/navigation";
import {usePageAccess} from "@/lib/client/page-access";
import {LocalizedText,useTranslation} from "@/lib/client/locale";
import {EmptyState} from "./ui";
import {ActionRow,SettingsGroup,ListSearch} from "./binso-ux";

/** One destination catalogue for the settings overview and every settings page. */
export const settingsGroups:Array<{title:string;rows:Array<readonly [string,string,string]>}>=[
 {title:"Persönlich",rows:[["/einstellungen/konto","user","Profil"],["/einstellungen/sicherheit","lock","Sicherheit"],["/einstellungen/benachrichtigungen","bell","Benachrichtigungen"],["/einstellungen/darstellung","sun","Darstellung"],["/einstellungen/datenschutz","lock","Datenschutz"]]},
 {title:"Unternehmen",rows:[["/einstellungen/firma","users","Firma"],["/einstellungen/team","users","Benutzerkonten"],["/einstellungen/abonnement","card","Abonnement"],["/einstellungen/rechtliches","file","Rechtliches"]]},
 {title:"Geschäftsprozesse",rows:[["/einstellungen/dokumente","receipt","Dokumente"],["/einstellungen/zeiterfassung","clock","Zeiterfassung"],["/einstellungen/abwesenheiten","calendar","Abwesenheiten"]]},
];

export function SettingsNavigation({context=false}:{context?:boolean}){
 const access=usePageAccess(),pathname=usePathname(),translate=useTranslation();
 const search=useSearchParams(),returnPath=search.get("accountReturn");
 const destination=(href:string)=>returnPath?href+"?accountReturn="+encodeURIComponent(safeAppPath(returnPath,"/einstellungen")):href;
 const [query,setQuery]=useState("");
 const term=query.trim().toLocaleLowerCase();
 const personalContext=context&&(pathname==="/einstellungen/sprache"||settingsGroups[0].rows.some(([href])=>pathname===href));
 const catalogue=personalContext?settingsGroups.slice(0,1):settingsGroups.slice(1);
 const groups=catalogue.map(group=>({...group,rows:group.rows.filter(([href,,label])=>access.canOpen(href)&&(!term||(translate(group.title)+" "+translate(label)).toLocaleLowerCase().includes(term)))})).filter(group=>group.rows.length);
 const content=<><ListSearch ariaLabel="Einstellungen suchen" placeholder="Einstellungen suchen" value={query} onChange={setQuery}/><nav aria-label={translate("Einstellungen")}>{groups.map(group=><SettingsGroup title={group.title} key={group.title}><div className="settings-list">{group.rows.map(([href,icon,label])=><ActionRow key={href} href={destination(href)} icon={icon==="language"?<Languages size={18} aria-hidden="true"/>:icon} title={label} current={pathname===href}/>)}</div></SettingsGroup>)}</nav>{!groups.length&&<EmptyState  title="Keine passenden Einstellungen" />}</>;
 return context?<aside className="settings-context-navigation">{content}</aside>:<div className="settings-overview">{content}</div>;
}

/** Shared workspace composition; pages keep their existing data and form handlers. */
export function SettingsWorkspace({children}:{children:ReactNode}){
 const pathname=usePathname(),search=useSearchParams();
 if(pathname==='/einstellungen/firma'&&(search.get('onboarding')==='1'||['name','address','bank'].includes(search.get('setupStep')??'')))return <>{children}</>;
 return pathname.startsWith("/einstellungen/")?<div className="settings-workspace"><SettingsNavigation context/><div className="settings-page-content">{children}</div></div>:<>{children}</>;
}
