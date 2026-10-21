import {LocalizedText} from "@/lib/client/locale";
import type {Metadata} from "next";
import {LegalPage} from "@/components/legal-page";
import {legalConfig} from "@/config/legal";

export const metadata:Metadata={title:"Impressum – Binso One",description:"Anbieter- und Kontaktinformationen der Binso GmbH.",alternates:{canonical:"/impressum"}};

export default function Page(){
 const c=legalConfig.company;
 return <LegalPage eyebrow="RECHTLICHES" title="Impressum" intro="Anbieterinformationen zu Binso One und den öffentlichen Online-Angeboten der Binso GmbH.">
  <section><h2><LocalizedText>{"Anbieter"}</LocalizedText></h2><p><strong>{c.name}</strong><br/>{c.address}<br/>{c.postalCode} {c.city}<br/>{c.country}</p></section>
  <section id="kontakt"><h2><LocalizedText>{"Kontakt"}</LocalizedText></h2><p><LocalizedText>{"E-Mail: "}</LocalizedText><a href={"mailto:"+c.email}>{c.email}</a><br/><LocalizedText>{"Telefon: "}</LocalizedText><a href={"tel:"+c.phone.replace(/\s/g,"")}>{c.phone}</a><br/><LocalizedText>{"Web: "}</LocalizedText><a href="https://www.binso.ch"><LocalizedText>{"www.binso.ch"}</LocalizedText></a></p></section>
  <section><h2><LocalizedText>{"Unternehmensidentifikation"}</LocalizedText></h2><p><LocalizedText>{"UID: "}</LocalizedText><strong>{c.uid}</strong></p><p><LocalizedText>{"Binso GmbH ist eine Gesellschaft mit beschränkter Haftung mit Sitz in Appenzell, Schweiz."}</LocalizedText></p></section>
  <section><h2><LocalizedText>{"Vertretungsberechtigte Personen"}</LocalizedText></h2><p><LocalizedText>{"Simon Noah Steiner, Gesellschafter und Vorsitzender der Geschäftsführung, mit Einzelunterschrift."}</LocalizedText><br/><LocalizedText>{"Oemer Cam, Gesellschafter und Geschäftsführer, mit Einzelunterschrift."}</LocalizedText></p></section>
  <section><h2><LocalizedText>{"Haftung für Inhalte und Links"}</LocalizedText></h2><p><LocalizedText>{"Binso GmbH bemüht sich um aktuelle und korrekte Informationen. Soweit gesetzlich zulässig, wird keine Gewähr für Vollständigkeit, Richtigkeit oder ständige Verfügbarkeit öffentlich zugänglicher Inhalte übernommen. Für Inhalte externer Websites sind deren Betreiber verantwortlich."}</LocalizedText></p></section>
  <p className="legal-version"><LocalizedText>{"Stand: "}</LocalizedText>{legalConfig.versionDate}</p>
 </LegalPage>;
}
