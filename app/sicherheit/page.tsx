import LegalPage from "@/components/legal/legal-page";
export const metadata={title:"Sicherheit"};
export default function Page(){return <LegalPage title="Sicherheit bei Binso One" lead="Technische und organisatorische Sicherheitsgrundsätze der Plattform.">
<h2>Mandantentrennung</h2><p>Produktive Geschäftsdaten werden einer Organisation zugeordnet. Serverseitige Autorisierung und Datenbankrichtlinien bilden mehrere Schutzschichten gegen mandantenübergreifende Zugriffe.</p>
<h2>Authentifizierung und Sessions</h2><p>Passwörter werden nicht im Klartext gespeichert. Produktive Sessions verwenden zufällige serverseitig validierte Tokens und HttpOnly-Cookies. Betreiberkonten sind von Kundenkonten getrennt.</p>
<h2>Berechtigungen</h2><p>Binso One verwendet rollenbasierte Berechtigungen. Rechte werden serverseitig geprüft und nicht nur durch ausgeblendete Menüpunkte gesteuert.</p>
<h2>Logging und Audit</h2><p>Sicherheits- und Geschäftsaktionen können auditierbar protokolliert werden. Sensible Werte werden im technischen Logging reduziert oder redigiert.</p>
<h2>Infrastruktur</h2><p>Für den produktiven Betrieb ist Microsoft Azure mit verschlüsselter Übertragung, PostgreSQL, kontrolliertem Storage, Monitoring und getrennten Secrets vorgesehen.</p>
<h2>Sicherheitsmeldungen</h2><p>Sicherheitsrelevante Hinweise können über das Supportsystem mit Kategorie «Sicherheit» gemeldet werden. Hochkritische Vorfälle werden priorisiert behandelt.</p>
</LegalPage>}
