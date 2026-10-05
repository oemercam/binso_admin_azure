# Binso One – Incident Response und Aufbewahrung

Stand: 5. Oktober 2026

## Security Incident Ablauf
1. Vorfall erfassen und Zeitpunkt/Quelle dokumentieren.
2. Betroffene Systeme, Organisationen und Datenkategorien eingrenzen.
3. Zugriff oder Ursache eindämmen; kompromittierte Sessions/Secrets widerrufen.
4. Integrität und Verfügbarkeit prüfen.
5. Risiko für betroffene Personen bewerten.
6. Geschäftsführung und technische Verantwortliche informieren.
7. Vertragliche Kundeninformation ohne unangemessene Verzögerung vorbereiten.
8. Gesetzliche Meldepflicht gegenüber EDÖB und allfällige Information betroffener Personen beurteilen.
9. Beweise/Auditdaten sichern, ohne unnötig weitere Personendaten zu vervielfältigen.
10. Ursache beheben, Recovery durchführen und Post-Incident-Review dokumentieren.

## Datenaufbewahrung – Grundsätze
- Personendaten nur so lange wie für Zweck, Vertrag, Sicherheit oder gesetzliche Pflicht notwendig.
- Geschäftsbücher und relevante Belege der Binso GmbH: gesetzliche Aufbewahrung nach Schweizer Recht, regelmässig zehn Jahre.
- Kundengeschäftsdaten: während aktivem Vertragsverhältnis; nach Ende Export-/Löschprozess gemäss Vertrag und DPA.
- Authentifizierungs-/Security-Daten: nur für Sicherheits-/Nachweiszweck erforderliche Dauer.
- Inaktive/verbrauchte OTPs und Sessions regelmässig bereinigen.
- Backups: nach dokumentierter Rotation; keine dauerhafte Schattenaufbewahrung.
- Support-/Auditdaten: nach Support-, Sicherheits- und Beweiszweck; periodische Review.

## Vor Go-live verbindlich festzulegen
- konkrete Azure Backup-Retention und Restore Point Objective,
- Log-Retention je Logquelle,
- Frist für automatische Bereinigung abgelaufener Auth-Codes/Sessions,
- Kundenexport- und endgültiger Löschprozess nach Vertragsende,
- Verantwortliche Person für Incident-Koordination.
