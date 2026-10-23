# Dokumentversand: unklarer Ausgang ist kein wiederholbarer Fehler

Nachgewiesene Ursache: Der Dokumentversand schrieb bei jedem Transportfehler
`failed`. Eine Wiederholung derselben Kennung war gesperrt, aber eine neue Kennung
konnte einen tatsächlich bereits angenommenen, nur nicht quittierten Versand erneut
auslösen. Das ist keine sichere Ende-zu-Ende-Idempotenz.

Die Korrektur unterscheidet:

| Zustand | Bedeutung / zulässiges Verhalten |
| --- | --- |
| `sending` | Reserviert, noch kein abschliessender Ledger-Nachweis; Wiederholung und konkurrierende Dokumentänderung blockiert |
| `sent` | Anbieterannahme bestätigt, ausdrücklich keine Zustell- oder Lesebestätigung; bewusster weiterer Versand mit neuer Kennung bleibt möglich |
| `uncertain` | Transport wurde aufgerufen, Ergebnis nicht bestätigt; auch neue Kennung darf nicht erneut senden |
| `not_attempted` | Nachweislich vor dem Transport abgebrochen oder der Transport hat ausdrücklich Nichtversand zurückgegeben; spätere bewusste neue Anfrage möglich |
| historisches `failed` | Keine belastbare Unterscheidung aus früherem Code möglich; konservativ ungeklärt behandeln, nicht automatisch freigeben |

Die bestehende Konfigurationsprüfung wird vor dem Aufruf des Mailtransports geprüft.
Aktualisierter Zahlungsstand stoppt weiterhin vor einer Mahnung. Ergebnis und Audit
werden gemeinsam gespeichert; ein Persistenz-/Auditfehler lässt den sicheren
ungeklärten Reservierungszustand stehen. Kein automatischer Retry, Fallback oder
simulierter Zustellstatus wird eingeführt.

Die Sperre gilt konsistent für erneuten Versand, Dokumentänderung, Storno,
Angebotsrevision und Gutschrift. Historische Datensätze werden nicht umgeschrieben.
Eine pauschale Freigabe/automatische Bereinigung alter `failed`-Einträge wäre ohne
Anbieternachweis unsicher und ist ausdrücklich nicht implementiert. Für eine echte
Auflösung ist ein verifizierter externer Nachweis und ein gesondert kontrollierter,
auditierter Bedienweg erforderlich; kein manueller SQL-Workaround aus diesem Auftrag.

Migration0078 erweitert ausschliesslich den Status-Constraint. Keine produktive
Migration oder Datenänderung wurde ausgeführt. Die bestehende History-Anzeige
verwendet dieselbe gemeinsame Statusbeschriftung; unklar bleibt «Versand nicht
bestätigt», ein nachgewiesener Nichtversand wird «Nicht versendet» genannt.

Regressionen im bestehenden echten Migrationstest prüfen: Providerannahme und
identische Replay-Anfrage; unklarer Ausgang und neue Kennung ohne zweiten
Transport; gesperrtes Storno; historischer `failed`-Eintrag; fehlende Konfiguration
ohne Transport und expliziter Versand nach Einrichtung; geänderter Zahlungsstand
ohne überholte Mahnung. Reale Providerzustellung und signierte Provider-Ereignisse
bleiben davon getrennte externe Nachweise.
