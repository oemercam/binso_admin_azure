import LegalPage from "@/components/legal/legal-page";import CookieSettingsButton from "@/components/privacy/cookie-settings-button";import {legalConfig as c} from "@/lib/legal";
export const metadata={title:"Cookies und Privacy Center"};
export default function Page(){return <LegalPage title="Cookies und ähnliche Technologien" lead="Du entscheidest über optionale Analysefunktionen.">
<h2>Notwendige Funktionen</h2><p>Technisch notwendige Cookies oder lokale Speicherungen können für Anmeldung, Sicherheit, Mandantensitzung, Sprache, PWA-Funktionen, Consent-Nachweis und grundlegende Einstellungen erforderlich sein. Diese Funktionen können nicht vollständig deaktiviert werden, ohne die Plattformfunktion zu beeinträchtigen.</p>
<h2>Optionale Analyse</h2><p>Binso One ist so vorbereitet, dass optionale Nutzungsanalyse getrennt gesteuert werden kann. Solange keine Analyseintegration konfiguriert ist, werden durch diese Kategorie keine externen Analyse-Tracker geladen. Eine spätere Aktivierung darf erst nach der entsprechenden Auswahl im Privacy Center erfolgen.</p>
<h2>Auswahl ändern</h2><p>Die Auswahl kann jederzeit erneut geöffnet und geändert werden.</p><CookieSettingsButton/>
<h2>Consent-Speicherung</h2><p>Die gewählte Einstellung wird mit einer Consent-Version im Browser gespeichert. Bei einer wesentlichen Änderung der Kategorien oder Zwecke kann eine erneute Auswahl verlangt werden.</p>
<p><small>Version {c.cookieVersion}</small></p>
</LegalPage>}
