# Desktop-Header: Revision7 statt redundanter Altvorgabe

Die tatsächliche italienische WebKit-Aufnahme aus Commit7bc770a4 zeigt
«Area di lavoro / Clienti» zusätzlich zum Seitentitel «Clienti». Kapitel47 der
verbindlichen aktuellen Quelle verbietet genau diese redundante Zeile.

Die Korrektur entfernt ausschliesslich den zentralen Breadcrumb aus AppShell und
seine drei danach unreferenzierten CSS-Regeln. Gemeinsame Suche, Benachrichtigungen,
Avatar-Menü, Sidebar-Toggle und der Seitentitel im Inhaltsbereich bleiben erhalten.
Keine mobile Navigation, kein FAB, keine Rechte oder Zielroute wurden verändert.

Der vorhandene Header-Messvertrag erlaubte diesen alten Breadcrumb ausdrücklich.
Er wurde auf die neuere Anforderung umgestellt: normaler Header besteht;
zurückgebrachter Breadcrumb mit Link und auch nur als Text scheitert. Unzulässige
Geschäftsaktionen und der frühere Header-Timer bleiben ebenfalls blockierend.
Die echte lokale Edge/Chromium-Fixtureprüfung sowie unveränderte Navigations-,
Geometrie-, Icon- und Berechtigungs-Quellverträge bestehen. Der App-Browsertest
prüft zusätzlich Seitentitel und erreichbaren Desktop-Toggle ohne Breadcrumb.
Dieser Nachher-App-Nachweis benötigt noch den aktuellen CI-Lauf.

## Prüfnachweis und offene Gesamtabnahme

[Kompakter tatsächlicher CI-Bericht7bc770a4](ci-7bc770a4.json) bindet Commit,
Quell-Digest, Run39691829176, Artefakt12388958731 und SHA-256 des Originalreports.
Der Report enthält613 aktive Anforderungen (573 aktuelle Klauseln,40 technische
Verträge),392 getrennte historische Einträge,0 fehlgeschlagene Checks und folgende
Coverage:8 passed,21 partial,580 review-required,3 not-tested,1 manual-required.
`compliant:false`; `developmentRelease.ready:true` ist keine Produktivabnahme.

76 von78 Routen besitzen insgesamt6825 aufgezeichnete Laufzeit-Messfälle. Die
beiden vorhandenen Development-Ausnahmen /dev/ux-lab und /operator/wallboard
besitzen keinen solchen Nachweis. Rolle und Sprache werden von diesen Messungen
nicht aufgezeichnet. Daher beweisen sie ausdrücklich nicht alle5588 geplanten
Rollen-/Zustandsfälle oder das vollständige Sprach-/Geräte-Kreuzprodukt. Die
573 Klauseln und78 Routen bleiben bis zum vollständigen Review unabgenommen.

Die neuere Quellenkorrektur ist durch7bc770a4 nicht qualifiziert. Alle aktuellen
Pflichtchecks und die gebündelte Development-Prüfung müssen am Folgecommit erneut
bestehen. Keine Produktionsfreigabe, Migration, Azure- oder Zustellprüfung ausgeführt.
