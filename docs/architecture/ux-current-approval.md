# Aktuelle UX-Rangfolge und überprüfbare Pakete

Bestätigt durch den Auftraggeber am 17.10.2026: Das Microsoft-Referenzpaket
unter `docs/audit/v24/reference/` vom 15.10.2026 bleibt die visuelle Grundlage;
die heutige ausdrückliche Rangfolge hat Vorrang. Es gibt keine neue Foundation.

## Historische Freeze-Vorgaben

Die alte Bottom-Navigation ist nicht pauschal geschützt. Jüngere ausdrücklich
freigegebene visuelle Entscheidungen dürfen eine ältere Baseline ersetzen.
Das Archiv bleibt als unveränderte Originalquelle erhalten; sein Satz
„Bestehende Bottom-Navigation exakt erhalten“ ist nach der heutigen Klarstellung
keine bedingungslose Zukunftsvorgabe.

| Bisherige Vorgabe / Quelle | Aktuelle Einordnung | Kontrollierter nächster Schritt |
| --- | --- | --- |
| Freeze-Absatz in AGENTS.md und Foundation | Durch aktuelle Rangfolge ersetzt | Neue ausdrückliche Referenzentscheidungen haben Vorrang |
| Navigationstext im unveränderten Originalpaket vom 15.10. | Datiertes Original, keine spätere Entscheidung überschreiben | Archiv und Quellhashes unverändert erhalten |
| `scripts/navigation-contract-test.mjs`, Hash aus `docs/assets/20261013/navigation-reference.json` | Historische Glass-/Dock-Regressionsbaseline; keine permanente visuelle Freigabe | Weiter aktiv, bis konkreter Ersatz samt gerenderten Zuständen, Fokus, Tastatur und Safe Areas geprüft ist |
| `ux-compliance/navigation-baseline.v2.json`, UX-NAV-Anforderungen und Navigations-Foundation-Tests | Bestehende technische Verträge; mögliche alte Geometriebindung | Im Navigationspaket zeilenweise gegen die dann massgebliche Referenz abgleichen und begründet aktualisieren |
| Alte Flow-/Noir-/Apple-/Toolbox-Audits | Historische Evidenz | Keine Anweisungspriorität gegenüber dem Microsoft-Paket |

In diesem Paket wird kein Navigationselement, kein Hash, keine Erwartung und
kein Gate entfernt oder abgeschwächt. Eine schematische Vorschau wird nicht
stillschweigend zur endgültigen Navigationsfreigabe erklärt.

## Erstes UX-Paket: mobile Auth-Darstellung

Bewusst klein: vorhandene zentrale Typografie-/Touch-Tokens im bestehenden
Auth-Owner verwenden, ohne Login-, MFA-, Verifikations- oder Sessionlogik zu ändern.

- Mobile Titel: `--type-mobile-heading` (25 px) statt altem 24-px-Sondertoken.
- Die bestehende Checkbox-Beschriftung wird ein mindestens 44 px hohes Ziel;
  Checkbox-Semantik und gespeicherte Remember-Me-Auswahl bleiben erhalten.
- Vorhandene Code-/Zurück-Aktionen und mobile Abbrechen-Links verwenden
  `--touch` (44 px) statt 40 px. Keine zusätzlichen Controls oder neue UX-Foundation.
- Echte Markenassets, Passworteinblendung, Demo-/Registrierungslinks und reale
  Mehrfaktorabläufe bleiben erhalten. Diese zulässigen Funktionsunterschiede
  werden nicht zugunsten einer statischen Mockup-Kopie entfernt.

Bezug: Das bestätigte Referenzpaket verlangt lesbare mobile Titel und geeignete
Touchziele; die Foundation konkretisiert mindestens 44 px und zentrale Tokens.
Vorheriger Browsernachweis: Titel 24 px, Checkbox-Zeile 19 px hoch. Die neue
Regressionsprüfung schlägt gegen diesen bisherigen Build tatsächlich fehl.

Die Browserregression prüft berechnete Geometrie, einen absichtlich verkleinerten
negativen Kontrollfall, den echten Login-Handler mit isolierter 202-MFA-Antwort,
beide Code-Aktionen und Rückkehr per Enter. Genau ein synthetischer Request,
kein Tenantzugriff und kein E-Mail-Versand. Assertions/Baselines werden nicht
automatisch neu akzeptiert.

Validierung: vollständiges Lint, Typecheck und Produktionsbuild bestanden;
Foundation-/Referenz-/Navigations-/UI-/CSS-/Lokalisierungsprüfungen bestanden.
Alle bisherigen Navigationsassertionen, Hashdateien, UX-NAV-Anforderungen und
Navigations-CSS sind unverändert. Neue Regression gegen den alten Build rot
(24 statt 25 px), gegen den korrigierten Build grün; der absichtlich auf 18 px
verkleinerte Kontrollfall wird weiterhin abgelehnt.

30 gezielte Chromium/Edge-Fälle bestanden: Login, Registrierung,
Passwort-vergessen, Reset ohne Token und E-Mail-Bestätigung bei 320/390/1440 px,
Light/Dark. Vier zusätzliche Code-Zustandsaufnahmen und Rückkehr per Enter
bestanden. Lokale Screenshots/DOM-Nachweise: `ux-auth-touch-after`,
unveränderte Referenzrenderings: `ux-next-reference`. Nur synthetische Fixtures.
Dark Mode und nicht im Referenzpaket dargestellte Zustände sind abgeleitet.
Die Code-/Zurück-Interaktionen sind separat von den 30 Routenzuständen geprüft.
Das ist eine Abnahme dieses begrenzten Token-/Touch-Pakets, keine vollständige
Auth-, UX-, physische Geräte- oder Releasefreigabe. GitHub-Pflichtchecks bleiben
vor Integration erforderlich; kein Produktivdeployment.

## Priorisierte weitere UX-Pakete

1. Auth-Paket hier abschliessen: Desktop/Mobile und Light/Dark, Code-/Fehler-/Leer-
   zustände, Fokus und Narrow Screen prüfen; abgeleitete Ansichten kennzeichnen.
2. Kundenliste/Dossier bei identischen Inhaltsbreiten gegen das Microsoft-Paket
   abschliessen: Zeilen-/Spaltenabstände, Tabs/Commandbar, echte Finanzwerte,
   Kontakt-/Dokumentstruktur, Loading/Empty/Error/Read-only und Rückkehrzustand.
3. Navigation kontrolliert abgleichen: Desktop und Mobile separat, neueste konkrete
   Referenzentscheidung dokumentieren, dann alte Verträge gezielt ersetzen;
   keine pauschale Beibehaltung und keine pauschale Löschung der alten Tests.
4. Formulare, Dokumente/PDF, Timer, übrige Listen und Operator-Varianten über
   dieselben Owner umsetzen. Fehlende Vorlagen und Dark Mode bleiben abgeleitet.
5. Erst nach diesen Paketen vollständige visuelle Browser-/Releaseabnahme.
   Offene Infrastruktur-Nachweise bleiben getrennt. Kein Produktivdeployment.
