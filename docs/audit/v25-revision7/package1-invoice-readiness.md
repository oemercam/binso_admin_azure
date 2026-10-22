# Paket 1 — Rechnungs-Readiness

Basis: gesicherter WIP `5540e8e62422d864bfe1dbe68bd10fccf88ac1e0`.
Nur Qualifikation der bestehenden Readiness; andere Pakete bleiben unverändert.

Der fokussierte Runner `scripts/business-readiness-test.mjs` verwendet die echten
Migrationen, `binso_runtime`/RLS, den vorhandenen Readiness-Vertrag, die tatsächliche
Dokumentmutation und endgültige Ausstellung einschliesslich PDF-Archivierung.
Das synthetische Unternehmen hat kein Logo; der Logo-Adapter liefert wie im
bestehenden nativen Parallelharness kein Bild. Keine Auth-/RLS-Prüfung ersetzt.

Lokal tatsächlich bestanden: PGlite-Readiness, acht Rollen, persönliche Präferenz,
Read-only/Demo, Audit-Rollback, Entwurf ohne Bankdaten, ungültige Bank-/Adressdaten
nach erfolgreichem Vorabcheck, direkte Ausstellungsablehnung, Korrektur ohne
automatische Ausstellung und erst anschliessende explizite Ausstellung.
Betroffener ESLint, Typecheck und unveränderter Navigationsvertrag bestanden.

Native PostgreSQL und Browser benötigen lokal eine nicht verfügbare isolierte
QA-Datenbank. `.github/workflows/invoice-readiness.yml` führt den gleichen Vertrag
auf PostgreSQL16 und genau die Readiness-Browserinteraktion auf Chromium bei390px
in Light aus. Die synthetischen UI-API-Antworten sind kein echter HTTP-/RLS-Beweis;
diesen liefert getrennt der native Vertrag beziehungsweise das bestehende
verpflichtende Quality-HTTP-Gate. Keine vollständige V25-Browsermatrix gestartet.

Der Browseradapter erhält beim Readiness-Test eine stabile Page statt einer beim
Navigieren ersetzten Page. Zusätzlich prüft er fehlgeschlagenes Einstellungs-Save
mit erhaltenem Formular vor erfolgreicher Rückkehr. Die bestehenden Einstellungen-
Tests behalten ihren Readiness-Aufruf; ein eigener Interaktionsname erlaubt den
begrenzten Paketlauf. Keine Assertion entfernt oder abgeschwächt.

Zum Zeitpunkt dieser Notiz sind die neuen GitHub-Läufe noch ausstehend. Ein grüner
historischer Lauf qualifiziert diesen Paketcommit nicht. Bottom-Navigation/FAB,
Produktivmigrationen, Provider und Deployment bleiben unverändert. Paket2 beginnt
nicht automatisch.
