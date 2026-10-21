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
