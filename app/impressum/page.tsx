import LegalPage from "@/components/legal/legal-page";import {legalConfig as c} from "@/lib/legal";
export const metadata={title:"Impressum"};
export default function Page(){return <LegalPage title="Impressum" lead="Anbieterinformationen zu Binso One.">
<h2>Anbieterin</h2><p><strong>{c.company}</strong><br/>{c.address}<br/>{c.zipCity}<br/>{c.country}</p>
<p>Unternehmens-Identifikationsnummer: {c.uid}</p>
<h2>Kontakt</h2><p>Telefon: {c.phone}<br/>E-Mail: <a href={`mailto:${c.generalEmail}`}>{c.generalEmail}</a><br/>Web: {c.website}</p>
<h2>Verantwortung für Inhalte</h2><p>Die Inhalte von Binso One werden mit Sorgfalt erstellt und weiterentwickelt. Trotz sorgfältiger Prüfung kann keine Gewähr für die jederzeitige Vollständigkeit, Richtigkeit und Aktualität allgemeiner Informationsinhalte übernommen werden.</p>
<h2>Urheber- und Nutzungsrechte</h2><p>Software, Gestaltung, Texte, Markenbestandteile und sonstige Inhalte von Binso One sind geschützt. Rechte Dritter bleiben vorbehalten. Die vertraglich eingeräumte Nutzung der SaaS-Plattform überträgt keine Eigentums- oder Immaterialgüterrechte an der Plattform.</p>
<p><small>Stand: 29. September 2026</small></p>
</LegalPage>}
