# App-Standardisierung – freigegebener Gesamtumfang, 19.10.2026

Diese Entscheidung ergänzt die unveränderten Microsoft-Referenzen vom 15.10.
und ersetzt nur ausdrücklich widersprechende historische Darstellungsverträge.
Neue Screens bleiben abgeleitet. Kein Produktivdeployment und keine produktive
Migration sind durch diesen Implementierungsauftrag freigegeben.

## Abnahmepakete

- [ ] Rollen plus explizite Mitarbeiter-/Kunden-/Auftragszuordnung: API, Server,
  Datenbank, Such-/Auswahllisten, Dateien und Rapporte; keine Rechte durch IDs.
- [ ] Eigene Zeiten/Spesen; separate Freigaberechte, keine Selbstfreigabe;
  nachvollziehbare Änderungen, Entzug, aktive Zeitmessungen und Bestandsdaten.
- [ ] Einzelzeit und Monatsrapport mit Gesamtstunden und unterschriebenem
  Nachweis; Einreichen/Prüfen, Sperren und Schutz vor doppelter Verrechnung.
- [ ] Benutzeroberfläche verwendet Auftrag statt Projekt; interne IDs bleiben.
- [ ] Gemeinsame Listentrennung, erkennbare Abschnittstitel, Status-Badges,
  kompakte Kontakte/Dokumente/Spesen und kontextbezogene Aktionsmenüs.
- [ ] Statusfilter im Filter-Sheet, keine Status-Tab-Leisten; aktive Filter
  entfernbar, fachliche Tabs bleiben; Auswahlfelder und Feldabstände gemeinsam.
- [ ] Mobiler blauer Plus-Button unten rechts oberhalb Navigation/Safe Area;
  Desktop beschriftet. Nicht während Erfassung, Dialog, Tastatur oder Chat.
- [ ] Erfassung: X und Abbrechen, kein zusätzlicher Header-Zurück-Pfeil;
  Nachfrage nur bei ungespeicherten Änderungen. X blau und gut bedienbar.
- [ ] Strasse/Hausnummer getrennt ohne geratenes Zerlegen bestehender Adressen;
  neue Kunden aktiv, Statusänderung später kontrolliert anbieten.
- [ ] Einstellungen: klare Texte, keine redundante mobile Bereichsnavigation,
  zentrale Feld-/Statusmuster und Wiederherstellung der Position beim Zurückgehen.
- [ ] Rechnung/Angebot: kurzer Header, vollständige kopierbare Referenz im Inhalt,
  Positionen/Status/Beträge zuerst, PDF separat, Stammdaten verknüpft statt doppelt.
  Dateianhang per beschriftetem zugänglichem Plus; Korrektur/Storno im Aktionsmenü.
- [ ] Übersicht rollenabhängig: eigene Arbeit, Handlungsbedarf, wenige echte
  Finanzkennzahlen; Rechnung/Zahlung/Ausgabe/Saldo nicht mit Kontostand verwechseln.
- [ ] Analyse: Zeitraum, klare Kernwerte, ein Diagramm, Details/Drilldown bei Bedarf.
- [ ] Timer: digitale Zeit, grüner ruhiger Ring aktiv, Amber pausiert, Blau Start;
  kein vorgetäuschter Fortschritt; Reduced Motion, Pause/Beenden eindeutig.
- [ ] Wiederöffnungs-Hinweis für tatsächlich laufenden Timer, keine automatische
  Unterbrechung oder Mutation, Schutz von Entwürfen und fremden Dialogen.
- [ ] Chat: Header Support exakt zentriert, kein unnötiges Aktionsmenü, keine
  untere Navigation; einzeiliger Composer mit begrenztem Wachstum, kein iOS-Zoom.
- [ ] Ruhiger iPhone/PWA-Start, konsistente Icon-Geometrie, keine doppelten
  Startanimationen; Navigation ohne falsche Leerzustände, sichere Datenaktualität.
- [ ] Filter-Scrim einschliesslich Header/Safe Area; keine weisse Restfläche.
- [ ] Gezielte lokale Regressionen; vollständige GitHub Quality/CodeQL und
  Browserabnahme vor deploybarem Ergebnis. Keine Gates abschwächen.

Die physische iPhone-/PWA-Abnahme ist getrennt von emulierter Browserabnahme
auszuweisen. Datenbankmigrationen werden ausschliesslich lokal/isoliert geprüft.
