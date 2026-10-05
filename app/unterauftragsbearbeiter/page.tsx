import type {Metadata} from "next";
import {LegalPage} from "@/components/legal-page";
import {legalConfig} from "@/config/legal";

export const metadata:Metadata={title:"Unterauftragsbearbeiter – Binso One",description:"Liste wesentlicher Dienstleister und Unterauftragsbearbeiter von Binso One.",alternates:{canonical:"/unterauftragsbearbeiter"}};

const processors=[
 {name:"Microsoft Azure / Microsoft 365 / Microsoft Entra ID",purpose:"Hosting der Anwendung, Azure Database for PostgreSQL, Dateispeicher und technische Infrastruktur; Microsoft Entra ID für interne Binso-Administrationszugriffe; Microsoft Graph / Microsoft 365 für transaktionale E-Mails.",location:"Kernbetrieb der Binso-One-Anwendung in der Schweiz (Azure Switzerland North); je nach Microsoft-Dienst, E-Mail-Infrastruktur und Support können weitere Standorte beteiligt sein.",transfer:"Vertragliche Datenschutz- und Transfermechanismen von Microsoft; soweit erforderlich geeignete Garantien für Drittstaatentransfers."},
 {name:"Stripe",purpose:"Zahlungsabwicklung, Abonnemente, Rechnungs-/Billing-Portal und Betrugsprävention.",location:"Europäische und weltweite Stripe-Infrastruktur; Übermittlungen können insbesondere die USA betreffen.",transfer:"Stripe DPA und anwendbare Transfermechanismen, einschliesslich Swiss-US Data Privacy Framework bzw. Standardvertragsklauseln, soweit anwendbar."},
];

export default function Page(){
 return <LegalPage eyebrow="DATENSCHUTZ" title="Unterauftragsbearbeiter" intro="Wesentliche externe Dienstleister, die Binso One beim sicheren Betrieb, bei Zahlungen und beim E-Mail-Versand unterstützen.">
  <section><h2>Aktuelle Liste</h2><div className="legal-processor-list">{processors.map(p=><article key={p.name}><h3>{p.name}</h3><dl><div><dt>Zweck</dt><dd>{p.purpose}</dd></div><div><dt>Bearbeitungsort</dt><dd>{p.location}</dd></div><div><dt>Auslandtransfer</dt><dd>{p.transfer}</dd></div></dl></article>)}</div></section>
  <section><h2>Änderungen</h2><p>Binso kann diese Liste anpassen, wenn Dienstleister ersetzt oder zusätzliche Dienste für den Betrieb erforderlich werden. Wesentliche Änderungen werden so kommuniziert, dass Geschäftskunden ihre datenschutzrechtlichen Pflichten wahrnehmen können.</p></section>
  <p className="legal-version">Stand: {legalConfig.versionDate}</p>
 </LegalPage>;
}
