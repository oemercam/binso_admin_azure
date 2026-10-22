# Einrichtung, Avatar und Angebotskommunikation — neuer Quellstand

Fortsetzung auf bestehendem feat/v25-revision7 und Draft-PR307. Die grüne
1567eff4-Qualifikation ist historisch: Sie qualifiziert diese neuen Änderungen nicht.

## Nachgewiesene Ursachen und Korrektur

- Die Rechnungsoberfläche blockierte bereits das Speichern eines Entwurfs bei
  fehlender Bankverbindung, obwohl der Server unvollständige Entwürfe zulässt.
  Echte Firmenladefehler bleiben blockierend. Erst Ausstellen benötigt Readiness.
- Gemeinsamer QR-Validator liefert strukturierte Fehler. Der lesende, autorisierte
  Rechnungscheck benennt fehlende Angaben und erlaubte Feldziele. Einstellungen
  öffnen das bestehende Formular am Feld und kehren nach bestätigtem Save zurück.
  Keine automatische Wiederholung der Ausstellung; finale Prüfung bleibt unter Lock.
- Dashboard-Hilfe unterscheidet Pflicht/Empfohlen/Optional. Ihre Anzeige ist eine
  eigene persönliche Präferenz mit Tenant-/User-RLS, bestätigtem Toggle und Audit.
  Einsteiger sehen belegbar leere Finanzkacheln nicht; unbekannte Daten bleiben sichtbar.
- Avatar-Auswahl lud unmittelbar hoch. Jetzt lokale Zuschnittvorschau und explizite
  Übernahme; Abbruch ohne Mutation, bisheriges Bild und Quarantänegates bleiben.
- Public-offers und private Mitarbeiterantworten versendeten nach gespeichertem
  Ereignis direkt ohne dauerhaftes Versandvorhaben. Sie verwenden nun mail_outbox.
  Entscheidung/Antwort und Job werden gemeinsam gespeichert; sichere Wiederaufnahme
  derselben Anfrage dedupliziert. accepted/sending/uncertain werden niemals blind
  neu versandt. Mitarbeiter-Opt-out/Rechte werden frisch geprüft. Reply-To verwendet
  die bestehende Prüfung aktiver, verifizierter Adressen desselben Unternehmens.

## Lokale Nachweise und noch ausstehende Qualifikation

Tatsächliche Handler-/SSR-, QR-/PDF-, Daten-/Lokalisierungs- und Migrationsprüfungen
mit RLS und Fehlern; zugehörige Logs in der lokalen evidence-Ablage. Neue native
HTTP-/sechs-Verbindungen- und Browserfälle sind für die gebündelte CI ergänzt.
Sie zählen bis erfolgreicher Ausführung am exakten Commit nicht als bestanden.
Keine lokale vollständige Browsermatrix. Vollständiger CI-Plan enthält2560/3840px;
echter Browserzoom und physische Geräte bleiben getrennte Nachweise.

## Grenzen

Migration0080 ergänzt nur die persönliche Einrichtungseinstellung;0081 erweitert
nur die bestehenden Outbox-Arten. Beide sind lokal getestet, nicht produktiv
angewandt oder freigegeben. Keine neuen Rollen, Provider, Secrets, Azure-Änderungen,
keine echten E-Mails, kein Merge/Deployment. Eine unbekannte Versandantwort bleibt
ungeklärt; Graph202 ist nur Anbieterannahme. Keine garantierte Hintergrundzustellung
oder verifizierte Inbox-Zustellung aus dem Queue-Code ableiten. Externer Provider-
Vertrag sowie rechtliche/physische Abnahmen bleiben ausdrücklich offen.

Die Rabatt-Fachregel ist gesondert angefragt. Historische Preise/Dokumente bleiben
unverändert, solange Rabattbasis und Berechnung nicht entschieden sind. Keine
pauschale573-Klausel-Abnahme aus dieser gezielten Korrektur ableiten.
