import type {Metadata} from "next";
import {LegalPage} from "@/components/legal-page";
import {legalConfig} from "@/config/legal";

export const metadata:Metadata={title:"Impressum – Binso One",description:"Anbieter- und Kontaktinformationen der Binso GmbH.",alternates:{canonical:"/impressum"}};

export default function Page(){
 const c=legalConfig.company;
 return <LegalPage eyebrow="RECHTLICHES" title="Impressum" intro="Anbieterinformationen zu Binso One und den öffentlichen Online-Angeboten der Binso GmbH.">
  <section><h2>Anbieter</h2><p><strong>{c.name}</strong><br/>{c.address}<br/>{c.postalCode} {c.city}<br/>{c.country}</p></section>
  <section><h2>Kontakt</h2><p>E-Mail: <a href={"mailto:"+c.email}>{c.email}</a><br/>Telefon: <a href={"tel:"+c.phone.replace(/\s/g,"")}>{c.phone}</a><br/>Web: <a href="https://www.binso.ch">www.binso.ch</a></p></section>
  <section><h2>Unternehmensidentifikation</h2><p>UID: <strong>{c.uid}</strong></p><p>Binso GmbH ist eine Gesellschaft mit beschränkter Haftung mit Sitz in Appenzell, Schweiz.</p></section>
  <section><h2>Vertretungsberechtigte Personen</h2><p>Simon Noah Steiner, Gesellschafter und Vorsitzender der Geschäftsführung, mit Einzelunterschrift.<br/>Oemer Cam, Gesellschafter und Geschäftsführer, mit Einzelunterschrift.</p></section>
  <section><h2>Haftung für Inhalte und Links</h2><p>Binso GmbH bemüht sich um aktuelle und korrekte Informationen. Soweit gesetzlich zulässig, wird keine Gewähr für Vollständigkeit, Richtigkeit oder ständige Verfügbarkeit öffentlich zugänglicher Inhalte übernommen. Für Inhalte externer Websites sind deren Betreiber verantwortlich.</p></section>
  <p className="legal-version">Stand: {legalConfig.versionDate}</p>
 </LegalPage>;
}
