# Aktueller Lieferstand und Konzeptablage

Stand: 20.10.2026, Europe/Zurich. Diese Seite ist der Einstieg in den aktuellen
Lieferstand, kein weiterer UX-Vertrag und kein zweites Freigaberegister.

## Konzepte und Rangfolge

Die jüngste ausdrückliche Nutzerentscheidung hat Vorrang. Danach gelten
[AGENTS](../../AGENTS.md), [aktuelle UX-Entscheidungen](ux-current-approval.md),
[V25.5-Originalquellen](v25-5-source/BINSO_ONE_Plattform_Gesamtkonzept_V25_5.md),
die unveränderten [V25.4-Quellen](v25-4-source/README_BINSO_ONE_V25_4.md) und deren
V25.3-/UX-Beilagen. Frühere Berichte bleiben datierte Nachweise; sie ersetzen
keinen aktuellen Prüfstatus. Bestehende Microsoft-Foundation und CSS-Owner unter
[Reference Foundation](reference-foundation.md) bleiben verbindlich.

Ein einziges aktives [Register](v25-5-traceability.csv) enthält alle 390 PL-/BP-/
UX-/PL-G-/D-IDs. IMPLEMENTED bedeutet keine vollständige fachliche oder visuelle
Abnahme. NOT_STARTED markiert fehlende individuelle Prüfung, auch wenn eine
Funktion bereits besteht. BLOCKED bleibt ohne entsprechende Freigabe gesperrt.
Die Quellkonzepte werden weder umgeschrieben noch als vollständig erledigt markiert.

## GitHub-Abhängigkeiten

| Paket | GitHub | Grundlage / Zweck |
| --- | --- | --- |
| Foundation | [Draft-PR #297](https://github.com/oemercam/binso_admin_azure/pull/297) | Aktueller geschützter Main als Basis |
| V25.4 | [Draft-PR #298](https://github.com/oemercam/binso_admin_azure/pull/298) | Baut auf #297 auf; Tarifquelle, Trial und Modulprofile |
| V25.5 | [Draft-PR #299](https://github.com/oemercam/binso_admin_azure/pull/299) | Baut auf #298 auf; Identität, Passkeys und Lifecycle |

Der bekannte ausgelieferte Ausgangsstand ist Main d2825134deb33cac67a05c6e703b945ff28066e6.
Neuere Auslieferung darf erst nach erfolgreichem Deployment und SHA-Nachweis
behauptet werden. #267, #271, Sicherheitsbranch und c1da9ebb sind nicht Teil
dieser Integration. Kein PR wird wegen eines grünen anderen Commits freigegeben.

## Tatsächlich vorbereitete V25.5-Änderungen

- Genau eine aktive Firma je Identität; vorhandene mehrdeutige Daten bleiben
  erhalten und blockieren Login statt eine Firma stillschweigend auszuwählen.
- Einladungen werden vor Erstellung und Annahme erneut geprüft. Ein enges,
  tokengebundenes SQL-Gateway liefert nur notwendige Pending-Metadaten unter RLS.
- Echte Passkeys: RP, Origin, Challenge, UV, Signatur, Counter und Einmalverwendung;
  frisches Passwort/TOTP beim Verwalten, Credential-/Sessionwiderruf, Audit und
  Sicherheitsmail. Passwort/TOTP bleiben erhalten, keine privilegierte MFA-Absenkung.
- Lokaler Authenticator-QR ohne externen Bilddienst.
- Einreichen vor unabhängiger Zeitfreigabe, auch bei interner Zeit; Solo-Ausnahme.
  Die UI zeigt die effektive Regel statt einen unwirksamen Abschaltschalter.
- Teamsperre pausiert den Timer, entzieht Sessions/Einladungen und erhält die
  persönliche Identität sowie die Arbeitsgeschichte. Keine Owner-Selbstsperre.
- Trial beginnt nach erster Verifikation und dauert exakt 336 Stunden. Vorzeitiger
  kostenpflichtiger Checkout bleibt bis zur Fachentscheidung blockiert.
- Unbekannte Teamkapazität wird nicht als unbegrenzt oder geratenes Start-Limit
  behandelt. Preise und bestätigte Tarifentscheidungen bleiben erhalten.
- Graph-MIME für echten Klartext, HTML und PDF, ohne zweiten Versandprovider.
  Providerannahme ist kein Zustellnachweis; keine externe Testmail ausgeführt.
- Ausschliesslich berechtigte mobile Ziele für alle Rollen und Tarife. Höhe,
  Material, Icons, Position und blauer Plus bleiben erhalten; alte Referenzen archiviert.
- Geschäftsexport enthält keine Authentifizierungstabellen, Passkey-/Challenge-Daten.

## Verifikation und bekannte Grenzen

Lokale Lint-/Typecheck-/Build- und gezielte Sicherheits-/Business-Tests sind im
[V25.5-Bericht](v25-5-platform-lifecycle.md) beschrieben. Die aktuelle vollständige
SHA-gebundene Quality-/CodeQL-Qualifikation steht im PR #299; frühere fehlgeschlagene
Läufe bleiben sichtbar. Ein korrigierter Adapter verwendet für PostgreSQL und
PGlite den unterstützten Query-Aufruf. Die Browserprüfung verlangt unabhängige
Freigabe statt des überholten abschaltbaren Schalters, einschliesslich Fehler-,
Member- und Solo-Gegenfällen. Keine Assertions oder Gates werden übersprungen.

Offen bleiben die vollständigen individuellen PL/BP/UX-Abnahmen, reale iPhone-/
PWA-/Android-/iPad-/AT-Prüfungen, echte Mailclients und Zustellung, Restore- und
Application-Insights-Nachweise sowie die im Register benannten Fach-/Legal-/
Recovery-/Provider-Gates. Keine neuen Infrastrukturaufträge. Die bekannte,
befristete braces-Entwicklungsadvisory wird nicht versteckt oder verlängert.

## Integration, Migration und Auslieferung

Der aktuelle Nutzerauftrag verlangt aktualisierte GitHub-Dokumentation, ZIP und
Deployment. Die konkrete Release-SHA und die produktiven Migrationen benötigen
vor Ausführung die vereinbarte separate Freigabe. Schutzregeln, Pflichtprüfungen,
Production-Environment, ZIP-Integrität und exakte SHA-Bindung bleiben erhalten.
0060–0063 sind nur vorbereitet; zusammen mit den Vorgänger-Migrationen sind sie
vor Rollout als Gesamtpaket zu prüfen. Der Deployment-Schritt führt den aggregierten Ein-Firma-/Checkout-Preflight
vor jeder Migration aus. Er verwendet ausschliesslich die bereits geschützte
Datenbankverbindung; READ ONLY und row_security=off verhindern Schreibaktionen
und scheinbare Nulltreffer bei fehlendem RLS-Lesezugriff. Jeder Konflikt, fehlende
Metadaten oder unzureichende Rechte stoppen vor den Migrationen. Der produktive
Bestand ist noch nicht geprüft. Der Wiederherstellungsweg bleibt zu bestätigen. Keine
blinde Datenbereinigung, kein automatisches Zurücksetzen der Sicherheitsgrenzen.

Das aktuelle ZIP ist ein Quellcode-Export des benannten Commits, kein ausgeliefertes
Azure-Artefakt und kein Datenbankbackup. Es enthält Konzepte, Dokumentation und
Tests, aber keine .env-Dateien, Secrets, node_modules, .next oder privaten Evidence.
