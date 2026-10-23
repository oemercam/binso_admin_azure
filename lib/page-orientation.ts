import {tenantCan,permissionForModule} from './permissions';
import {moduleForPath} from '@/config/plan-access';
/** Exact workspace routes only: record details, chats and forms keep their context. */
const descriptions:Readonly<Record<string,string>>={
 "/dashboard":"Deine Geschäftszahlen und nächsten Aufgaben im Blick.",
 "/kunden":"Kunden und Kontaktpersonen verwalten.",
 "/angebote":"Angebote erstellen und ihren Status verfolgen.",
 "/rechnungen":"Rechnungen erstellen und offene Beträge verfolgen.",
 "/zahlungen":"Zahlungseingänge erfassen und Rechnungen zuordnen.",
 "/produkte":"Produkte, Leistungen und Preise verwalten.",
 "/zeit":"Arbeitszeiten erfassen und Einträge verwalten.",
 "/projekte":"Aufträge und erfasste Zeiten verwalten.",
 "/spesen":"Ausgaben und Belege erfassen und verwalten.",
 "/belege":"Belege erfassen und verwalten.",
 "/finanzen":"Umsatz, offene Forderungen und Zahlungen im Blick.",
 "/berichte":"Geschäftszahlen auswerten und Berichte erstellen.",
 "/mitarbeiter":"Mitarbeiter und ihre Geschäftsdaten verwalten.",
 "/support":"Support-Anfragen erstellen und Antworten verfolgen.",
 "/benachrichtigungen":"Aktuelle Hinweise und wichtige Ereignisse im Blick.",
 "/einstellungen":"Konto, Unternehmen und Anwendung einrichten.",
 "/einstellungen/konto":"Dein Konto und deine Profildaten verwalten.",
 "/einstellungen/firma":"Unternehmensdaten für Dokumente und Kommunikation pflegen.",
 "/einstellungen/team":"Teamzugänge und Rollen verwalten.",
 "/einstellungen/sicherheit":"Anmeldung und Kontosicherheit verwalten.",
 "/einstellungen/abonnement":"Plan, Nutzung und Abrechnung verwalten.",
 "/einstellungen/dokumente":"Vorgaben für Rechnungen und Dokumente festlegen.",
 "/einstellungen/zeiterfassung":"Vorgaben für die Zeiterfassung festlegen.",
 "/einstellungen/benachrichtigungen":"Festlegen, wie du informiert wirst.",
 "/einstellungen/sprache":"Sprache der Benutzeroberfläche wählen.",
 "/einstellungen/darstellung":"Light-, Dark- oder Systemdarstellung wählen.",
 "/einstellungen/datenschutz":"Datenschutzeinstellungen und Cookies verwalten.",
};
const readDescriptions:Readonly<Record<string,string>>={
 '/kunden':'Berechtigte Kunden und Kontaktpersonen finden.',
 '/angebote':'Angebote und ihren Bearbeitungsstand ansehen.',
 '/rechnungen':'Rechnungen, Fälligkeiten und offene Beträge ansehen.',
 '/zahlungen':'Erfasste Zahlungseingänge und ihre Zuordnung ansehen.',
 '/produkte':'Produkte, Leistungen und Preise ansehen.',
 '/projekte':'Berechtigte Aufträge und ihren Fortschritt ansehen.',
 '/mitarbeiter':'Berechtigte Mitarbeiterinformationen ansehen.',
 '/spesen':'Berechtigte Ausgaben, Belege und ihren Status ansehen.',
 '/einstellungen/team':'Teamzugänge und Rollen ansehen.',
 '/einstellungen/abonnement':'Plan, Nutzung und Abrechnung ansehen.',
 '/einstellungen/firma':'Unternehmensdaten für Dokumente und Kommunikation ansehen.',
 '/einstellungen/dokumente':'Zentrale Vorgaben für Rechnungen und Dokumente ansehen.',
 '/einstellungen/zeiterfassung':'Vorgaben für die Zeiterfassung ansehen.',
};
export function pageOrientation(pathname:string,editing=false,role?:string){
 if(editing||!Object.hasOwn(descriptions,pathname))return undefined;
 if(!role)return descriptions[pathname];
 if(pathname==='/dashboard')return role==='member'?'Deine Arbeitszeit, Einträge und nächsten Aufgaben im Blick.':role==='hr'?'Mitarbeiter und persönliche Aufgaben im Blick.':['project_manager','manager'].includes(role)?'Deine Aufträge, Arbeitszeiten und offenen Freigaben im Blick.':role==='reader'?'Berechtigte Geschäftsvorgänge und ihren Status im Blick.':descriptions[pathname];
 if(role==='member'&&pathname==='/zeit')return 'Deine Arbeitszeit erfassen, Rapporte einreichen und Rückmeldungen verfolgen.';
 if(role==='member'&&pathname==='/spesen')return 'Eigene Belege einreichen und ihren Bearbeitungsstand verfolgen.';
 const settings:Record<string,Parameters<typeof tenantCan>[1]>={'/einstellungen/team':'users:manage','/einstellungen/abonnement':'billing:write','/einstellungen/firma':'organization:write','/einstellungen/dokumente':'organization:write','/einstellungen/zeiterfassung':'organization:write'};
 const moduleKey=moduleForPath(pathname),permission=settings[pathname]??(moduleKey?permissionForModule(moduleKey,'write'):undefined);
 return permission&&!tenantCan(role,permission)?readDescriptions[pathname]??descriptions[pathname]:descriptions[pathname];
}
