# Sprachgrenzen im zentralen Dropdown und Angebotsverlauf

Die bisherige Katalogprüfung fand vorhandene Übersetzungen, erkannte aber nicht,
wenn JSX-Texte ausserhalb einer tatsächlichen Übersetzungsgrenze standen.
`LocalizedElement` übersetzt bewusst nur Attribute; Benutzerdaten in seinen
Kindern dürfen nicht pauschal verändert werden.

## Nachgewiesene und korrigierte Stellen

- Zentraler Select: Pflichtauswahlmeldung, zugänglicher Ladestatus, Fehlertext,
  Wiederholen und Blätteraktionen verwenden nun echte `LocalizedText`-Grenzen.
  Suche und Pagination behalten bestehenden DOM-Aufbau, Fokusführung und Sperren.
  Keine sichtbaren Lade-Sätze bei Seitenwechseln; der Ladestatus bleibt `sr-only`.
- Die vorhandene Select-Komponente reagiert mit Caption und offener Optionsliste
  auch auf Kontext-Sprachänderungen. Werte und Datensatznamen bleiben unverändert.
- Die kleinen Feedback-/Pagination-Renderer bleiben im gleichen bestehenden
  Select-Owner und verwenden dieselben Klassen, Buttons und Locale-Foundation.
- Kundenerfassung: Firma/Privatperson sind tatsächlich übersetzte Optionslabels.
- Öffentliche Angebote und privater Angebotsverlauf: Versionsbezeichnung,
  Datums-/Zeitdarstellung und öffentliche Beträge/Mengen nutzen die aktive Sprache.
  Angebote, Nachrichten, Empfänger, PDF-Originalsprache und gespeicherte Werte
  werden nicht umgeschrieben. Zeitpunkte folgen dem vorhandenen Zürich-Formatter.
- Der vorhandene zivile Datumsformatter akzeptiert optional die Sprache, behält
  die Schweizer Voreinstellung und verschiebt keine Geschäftstage über Zeitzonen.
  Ungültige Kalendertage werden nicht in einen anderen Monat gerollt.

## Tatsächliche Nachweise

`localization-test.mjs` rendert die echten gemeinsamen Feedback-/Pagination-
Funktionen unter allen vier LocaleProvidern: Fehler, Status, Wiederholen und
Blättern übersetzt; beide Blätteraktionen während laufender Abfrage gesperrt.
Datumsfälle für alle vier Schweizer Sprachvarianten, explizite andere Locale,
erhaltene Voreinstellung und ungültige Kalendertage bestanden.

`localization-coverage-test.mjs` prüft zusätzlich nackte JSX-Texte in allen
App-/Komponentenquellen. Positiver/negativer AST-Fall unterscheidet echte
Textübersetzung, nur übersetzte Attribute und dynamische Benutzerdaten. Nachweislich
sprachneutrale Markennamen und SI-Minutenwerte sind explizit als neutral registriert;
keine deutschen Bedienlabels wurden durch Neutral-Ausnahmen versteckt.
Bestehende Katalog-, Token-, Benutzertext- und juristische Inhaltsprüfungen bleiben.
Gezielte Kunden-Finanzprojektion, Statistik-/Navigationsregression, Typecheck und
betroffener Lint bestanden; keine fachliche Betrags-/Statusberechnung geändert.

Vier konkrete neue Browserfälle (EN/Hell/390, FR/Dunkel/390, IT/Hell/1440,
DE/Dunkel/1440) prüfen zusätzlich echte Dropdown-Fehler, lesenden Retry,
verzögerten Ladestatus und Pagination sowie die bestehende Zusammenführung.
Sie sind vorbereitet, noch nicht als ausgeführt abgenommen. Vollständiger
Sprache×Viewport×Zustand-Kreuzvergleich, reale Geräte und finanzielle/juristische
Fachabnahme bleiben offen.

## Paralleltest

Quality auf2f671842 scheiterte an einem serialisierten JSONB-Schlüsselvergleich.
Eine echte lokale JSONB-Abfrage bestätigt identische Werte bei anderer Reihenfolge.
Der Paralleltest vergleicht nun alle Ergebniswerte strikt mit `deepEqual`, behält
Ledger-/Replay-/Konkurrenzassertionen und ist noch gegen echtes PostgreSQL in CI
erneut auszuführen. Es wurde kein Sicherheitsgate gelockert.

## Folgekorrektur: API-Texte und Spesen

Eine gezielte AST-Prüfung fand98 fehlende öffentliche API-Fehlermeldungen sowie vier
fehlende Bedienlabels im Sprachkatalog. Diese besitzen nun EN-/FR-/IT-Übersetzungen;
ein grammatisch falscher Auftragshinweis verwendet den bereits vorhandenen korrekten
Katalogschlüssel. Bestehende Übersetzungen wurden nicht überschrieben. Zwei nach der
Dialogverkürzung unbenutzte Zählertexte wurden entfernt. Der physische Tastaturhinweis
«⌘ / Ctrl K» bleibt sprachneutral; deutsche Bedienlabels sind keine Neutral-Ausnahmen.

Die Quellenprüfung unterscheidet unmittelbar gerenderte bedingte Literale und echte
Übersetzungsgrenzen von Attributübersetzung, dynamischen Datensatznamen, internen
Error-Diagnosen und Bedingungscodes. Öffentliche statische ApiError-Meldungen werden
zusätzlich geprüft. Dynamisch zusammengesetzte Meldungen und die tatsächliche
Darstellung aller API-Zustände bleiben gesonderte Abnahmeaufgaben. Echte Renderer-
Tests prüfen drei repräsentative Verweigerungen in EN/FR/IT und unveränderten Benutzertext.

Spesen verwenden den gemeinsamen aktiven Locale-Formatter für Beträge, zivile
Belegtage und tatsächliche Erstattungszeitpunkte. Die Schweiz-Zeitzone bleibt für
Zeitpunkte erhalten; zivile Kalendertage werden nicht verschoben. Der generische
Kunden-Fallback wird übersetzt, echte Kundennamen bleiben unverändert. Positive und
ungültige Datumsfälle sowie Kunden-Finanzprojektion wurden gezielt geprüft.

## Tatsächliche Browser-/Sichtprüfung und ihre Grenzen

7bc770a4 besteht nun beide funktionalen CI-Browserjobs inklusive der vier konkreten
Dialogfälle und echtes PostgreSQL. Zwei tatsächliche WebKit-Mobile-Screens wurden
visuell geprüft. Der vorhandene gemeinsame Sheet-Owner ist flach/undurchsichtig;
französische lange Zählerlabels beanspruchen unnötig mehrere Zeilen. Sie werden auf
«Kontakte»/«Aktivitäten» verkürzt. Der Folgetest scrollt die vollständige Zustimmung
in den Formularbereich und prüft deren gesamte sichtbare Höhe oberhalb des festen
Footers. Dieser neue Nachweis steht bis zum nächsten Browserlauf aus.

Die Screens verwenden synthetische Transportdaten, getrennt von echten migrierten
Persistenz-/RLS-Tests. Sie sind abgeleitete Komponentenansichten, keine neue Original-
Referenzfreigabe. Vollständige Sprache×Viewport×Rolle×Zustand-Abnahme und reale
Geräte bleiben offen. Kein Produktivdeploy und keine Migration wurden ausgeführt.

Die anschliessende tatsächliche italienische Desktop-Sichtprüfung zeigte zusätzlich
«Arbeit & Team» als deutschen Gruppentitel. Der vorhandene Text-Owner war korrekt;
der dynamisch referenzierte Katalogeintrag fehlte. Eine neue AST-Prüfung beider
Tenant-/Operator-Navigationstabellen fand ausserdem «Zugriff & Rollen». Beide Labels
wurden übersetzt. Die Prüfung wurde zuerst mit dem echten fehlenden zweiten Label
rot und besteht nach der Korrektur. Summe:104 neue Katalogeinträge, zwei entfernte
unbenutzte Zählertexte und keine überschriebenen bestehenden Übersetzungen.

## Zentrale Preis-, Mengen- und Personalzusätze

Die gemeinsame Zeilenprojektion formatierte Produkte, Mitarbeiter, Spesen,
Zahlungen und Kundenkennzahlen unabhängig von der aktiven Sprache mit de-CH.
Die vorhandenen Formatter erhalten jetzt die aktive Locale. Standard-Preiseinheiten
werden vor dem Zusammensetzen durch denselben bestehenden Sprachkatalog übersetzt;
eigene Einheiten und Datensatznamen bleiben unverändert, auch bei Kollision mit
einem Katalogwort. Geerbte Objektschlüssel sind keine Standard-Preiseinheiten.
Produktdetails und Mitarbeiterdetails verwenden denselben Weg. Die beiden
Personalzusätze h/Woche und Tage/Jahr besitzen eigene Katalogeinträge.

Tests führen die echte gemeinsame Zeilenprojektion in vier Sprachen aus: vorhandene
Standard-Einheiten, Dezimalwerte, unveränderte Produktnamen/Originalpreise,
benutzerdefinierte Einheiten und Prototype-Schlüssel sowie fehlende finanzielle
Daten als Gedankenstrich. Die früheren deutschen Standardausgaben bleiben mit
Defaultargument kompatibel. Echte Formularhandler-Regressionen, Mengen-/Preis-
Regressionssuite, Typecheck und betroffener Lint bestehen. Der Formular-Testadapter
stellt die nun verwendeten Locale-Kontexte bereit; seine Sperr-, Wiederholungs-,
Navigations- und Fehlerassertionen bleiben vollständig erhalten.

Die tatsächlich heruntergeladenen Chromium-Artefakte aus Full Development39695330278
(a100c1ee, funktionales Artefakt12391456587) bestätigen alle vier Dialogfälle.
FR/Dunkel/390 zeigt den vollständigen Bestätigungstext oberhalb des festen Footers;
IT/Hell/1440 zeigt den übersetzten Gruppentitel. Diese beiden Screens wurden gesichtet.
Der danach gefundene zusammengesetzte Kunden-Spaltenkopf «Umsatz 2026» benötigt eine
Template-Übersetzung. «Umsatz {0}» verwendet nun den bestehenden zentralen
Template-Owner, erhält das tatsächliche Geschäftsjahr und besteht vier Sprachfälle.
Die gesamte a100c1ee-Matrix ist grün; spätere Quellenänderungen bleiben separat zu prüfen.
