# Rechtsseiten: technischer Abgleich, keine juristische Abnahme

Geprüfter Code: Revision7-Branch, Ausgangspunkt b637dd57. Keine produktiven
Rechtstexte ersetzt, keine Vertragsfrist oder Zustimmung eigenmächtig geändert.
Dies dokumentiert tatsächliche Implementierung und offene Nachweise.

| Route | Quelle / gemeinsamer Owner | Version im Code | Noch offen |
|---|---|---|---|
| /impressum | app/impressum/page.tsx, config/legal.ts, LegalPage | Stand 5. Oktober 2026 | Unternehmensangaben vom Inhaber bestätigen lassen |
| /datenschutz | app/datenschutz/page.tsx, LegalPage | privacyVersion 2026-10-05.2 | Speicher-/Provider-/Löschabläufe und obsolete Demo-Aussage fachlich abgleichen |
| /agb | app/agb/page.tsx, LegalPage | termsVersion 2026-10-05 | Aktuelle Tarif-/Test-/Kündigungsabläufe gegen Vertrag prüfen; keine neue Zusage aus UI ableiten |
| /auftragsbearbeitung | app/auftragsbearbeitung/page.tsx, LegalPage | dpaVersion 2026-10-05 | Tatsächliche Verarbeitung, Transferverträge, Aufbewahrung und Rechteprozesse qualifiziert prüfen |
| /unterauftragsbearbeiter | app/unterauftragsbearbeiter/page.tsx, LegalPage | Stand 5. Oktober 2026 | Microsoft-/Stripe-Vertrags- und Standortnachweise sind nicht durch Quellcode bewiesen |

Gemeinsamer Rahmen: components/legal-page.tsx mit MarketingHeader,
MarketingFooter und gegenseitigen Rechtslinks. Die gemeinsame Sprachwahl und
die datensparsame Consent-Foundation sind vorhanden. Öffentliche
Erreichbarkeit, Zoom, lange Texte, Fokus und jede Sprachfassung gehören in die
noch offene gebündelte Seitenabnahme. Im geprüften Ausgangspunkt fehlte ein Inhaltsverzeichnis. Es wird nun im
gemeinsamen LegalPage-Owner ergänzt, mit sprachstabilen Abschnittsankern und
erhaltenem Kontakt-Deep-Link; Textinhalte und Versionsdaten bleiben unverändert.

## Nachgewiesene Abweichungen und Prüfgrenzen

- Datenschutz Abschnitt8 nennt weiterhin notwendige Speicherung für
  «Demo-Funktionen». Die öffentliche Demo-Bereitstellung ist im aktuellen Code
  geschlossen. Diese historische Formulierung passt damit nicht mehr zum
  geprüften Funktionsumfang. Eine abgestimmte Textkorrektur samt Versionierung
  und gegebenenfalls Information bestehender Nutzer ist noch freizugeben.
- LegalPage rendert Einleitung und Eyebrow unverändert, während Titel und viele
  Fachabsätze LocalizedText verwenden. Die Subprozessor-Zwecke/-Standorte/-Transfers
  werden ebenfalls als unveränderte deutsche Datensätze ausgegeben. Vollständige,
  konsistente und fachjuristisch freigegebene FR-/IT-/EN-Fassungen sind dadurch
  nicht nachgewiesen. Keine weiteren rechtlichen Übersetzungen improvisiert.
- Das technische Speicherinventar steht separat in browser-storage.md.
  Notwendige Sitzung/Präferenzen, zeitbegrenzte Formularentwürfe, Service Worker
  und optionale Web-Vitals sind unterschiedliche Datenflüsse. Die Quellcodeprüfung
  beweist keine vollständige Laufzeit-Inventur beim Hosting/Identity-/Mailprovider.
- Neue ausgestellte Rechnungs-PDFs erhalten mit Migration0070 unveränderliche
  Bytes. Diese Migration ist nicht produktiv ausgeführt. Historische Originalbytes,
  vollständige Datenwiederherstellung und reale Retentionsläufe sind nicht aus
  diesem Implementierungsstand ableitbar.
- Microsoft Graph, Stripe und Azure sind im Code und in bestehenden Rechtstexten
  benannt. Tatsächliche Mandantenkonfiguration, Regionen sämtlicher beteiligter
  Dienste, Subprozessorverträge, Transfergarantien und tatsächliche Zustellung
  müssen durch berechtigte externe Nachweise bestätigt werden. Keine solche
  Bestätigung aus einer grünen Softwareprüfung abgeleitet.

## Freigabepunkte

1. Inhaber/Fachjurist prüft die bestehende deutsche Fassung gegen die tatsächlichen
   Datenflüsse und entscheidet die sachliche Demo-Korrektur sowie Versionsfolgen.
2. Qualifizierte FR-/IT-/EN-Fassungen und deren Versionsbezug bereitstellen bzw.
   die vorhandenen Fassungen ausdrücklich fachlich abnehmen.
3. Vor Veröffentlichung die technische Darstellung einschliesslich Sprachgrenzen,
   Ankern, öffentlichem Zugriff und Consent-Einstieg prüfen.

Keine Behauptung rechtlicher Konformität oder endgültiger Rechtsfreigabe.
