# Aktueller Einstieg und Regelrangfolge

Neuester lokaler Auftrag: [Master V8 – vollständige Quelle](architecture/v8-global-simple-workflow/source-full.md),
[Ist-Soll-Inventur](architecture/v8-global-simple-workflow/matrix.md) und
[tatsächlicher Paketstand](architecture/v8-global-simple-workflow/implementation-status.md).
Kundenlogin bleibt ausdrücklich E-Mail/Passwort. Die lokale Umsetzung gemeinsamer
Abrechnungsmodelle und fehlender/Nullbudgets ist gesondert freigegeben; produktive
Migrationen, Push, Merge, Deployment und neue Kosten sind nicht freigegeben.
Ältere Entwicklungsberichte unten sind historische Einordnung, keine neuen Aufträge.

Jüngster UX-Auftrag vom 27. Oktober: [Globale Seiten-/Sheet-Logik](architecture/global-surfaces-20261027.md).
Umfangreiche Prozesse verwenden ganze Seiten; kurze Kontextaktionen bleiben kompakt.
Firmenvervollständigung ist eine einzelne Seite. Lokale Umsetzung; vollständige
Routenmatrix und reale Geräteabnahme sind noch offen. Kein neuer Produktionsstand.

Jüngste Kunden-Auth-Korrektur vom 27. Oktober: [E-Mail-Bestätigung und anschließender Passwortlogin](architecture/customer-password-login-20261027.md). Diese Regel ersetzt frühere zusätzliche Kunden-Loginfaktoren; Operator-MFA und kritische Kontoänderungen bleiben getrennt.

Stand dieses Dokuments: 26. Oktober 2026. Ausgelieferte Ausgangsbasis:
`02a061a4db4c3f0f55b1f829900b2577bfc9c21f`.
Dieser Commit ist die Basis der Auditkorrekturen, nicht automatisch deren Release.
Aktuellen Main, vollständige Quality und Live-SHA stets getrennt prüfen.

## Verbindliche Orientierung

1. Die jüngste ausdrückliche Nutzerentscheidung und [AGENTS](../AGENTS.md).
2. [Master Phase 1](architecture/master-phase1/source.md),
   [Umsetzungsstand](architecture/master-phase1/implementation.md) sowie die
   erhaltenen [Navigation-V7/V7.1-Quellen](architecture/ux-navigation-v7/source-v7-1.md).
   Sie ergänzen bzw. ersetzen frühere widersprechende UX-Angaben ausschließlich
   in ihrem dokumentierten Umfang. Implementierungsberichte sind keine Freigaben.
3. Bestehende Modulverträge, serverseitige Rollen-/Tarif-/Tenant-Grenzen,
   Finanzregeln, gemeinsame Komponenten und CSS-Owner bleiben verbindlich.
4. V25-/V26- und UX-V3–V5-Berichte sind datierte Grundlagen; ihre jeweiligen
   damaligen Branch-/Push-Verbote oder Angaben „neueste UX“ sind keine Behauptung
   über den aktuellen Lieferstand. Neue Releases bleiben SHA-gebunden freizugeben.

## Gegenwärtige Arbeit

Neuer Implementierungsauftrag vom 27. Oktober: [Passkeys, starke Anmeldung und
Wiederherstellung](architecture/passkeys-20261027/implementation.md), mit
[vollständiger Originalanforderung](architecture/passkeys-20261027/source.md).
Die Regel für UV-bestätigte Passkeys ersetzt in diesem Umfang die frühere
zusätzliche TOTP-Pflicht. Dies ist ein lokaler Entwicklungsstand und keine
Behauptung über den produktiv freigegebenen Release.

Die Nutzerfreigabe vom 26. Oktober umfasst die Korrekturen des Systemaudits:
Datei-Scan-Verfügbarkeit, Netz-/TLS-Härtung, vollständige Schema-Gates,
PostgreSQL-18-Parität, reproduzierbare QA, Betriebsüberwachung und Dokumentation.
Keine Änderung von Preisen, Fachrechten oder rechtlich freizugebenden Texten.

- [Umsetzung und offene Betriebsschritte](operations/system-hardening-20261026.md)
- [Produktions-Abnahmeregister](operations/production-acceptance.json)
- [Release-/Betriebscheckliste](production-launch-checklist.md)
- `database/schema-contract.json`: vollständiger Schema-/RLS-Vertrag, aus der
  gesamten Migrationslinie erzeugt und bei Änderungen bewusst zu prüfen.
- `pnpm ops:readiness`: offene Produktionsnachweise anzeigen;
  `pnpm ops:readiness --production`: fehlende Nachweise blockieren.

Das bekannte Liveprofil ist `development-20261012`, `productionAcceptance=false`.
Neue Code-/Workflowvorbereitung bedeutet weder ausgeführten Restore noch
Mail-/Alarmzustellung, Geräteabnahme oder vollständige kommerzielle Freigabe.

## Ablage

`app/`, `components/`, `lib/`, `config/`, `database/`, `scripts/` und `.github/`
enthalten aktive Implementierung. `docs/architecture/*/source*` bewahrt Quellen;
datierte Audit-/Evidence-Dateien bleiben historische Nachweise. Der bisherige
[Lieferstand vom 20. Oktober](architecture/delivery-status.md) ist ein Archiv.
Workspace-ZIPs, Bildschirmnachweise und Hilfsskripte außerhalb dieses Checkouts
sind keine zweite aktive Codebasis. Sie werden ohne Prüfung ihrer Referenzen
weder verschoben noch gelöscht; das neue Ablageregister klassifiziert sie.
