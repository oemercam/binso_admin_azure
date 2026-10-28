# V8 – Integration der sechs Abrechnungsmodelle

Lokales Implementierungspaket vom 28. Oktober 2026, auf Budget-Checkpoint
`39f6a19c3cf3972907b1643153ba9dd5fa253829`. Keine produktive Migration oder externe Mutation.

## Führende Regeln und Daten

`lib/billing-model.ts` besitzt die gemeinsamen sechs Modellverträge, Freigabereife,
Kalenderperioden und kanonische Eingabeidentität. `lib/money.ts` bleibt unverändert
die einzige Betrags-, Rabatt- und Steuerberechnung. Datenbankprüfungen vergleichen
deren gespeicherte Ergebnisse und Quellen; sie berechnen keine zweite Rechnung.

Die neue Migration `0110_shared_billing_agreements.sql` ergänzt unveränderliche,
mandantengebundene Vereinbarungen und Referenzen auf Angeboten, Aufträgen,
Rechnungen und gebundenen Zeiten. Ein angenommener Angebotsstand und daraus
entstandene Aufträge teilen dieselbe Vereinbarung. Bestehende Belege ohne Modell
werden nicht nachträglich klassifiziert oder umgerechnet. Migration 0109 sowie
die bestehenden Budget-Regeln bleiben unverändert.

`lib/server/billing-agreements.ts` bindet die tatsächlichen Quellen innerhalb der
vorhandenen Dokumenttransaktion. Vorhandene Rollen, RLS, Idempotenz, Audit,
Dokumentsnapshots und Zeit-/Minutenreservierungen bleiben zuständig. Eine
zusätzliche Entitlement-Abfrage benutzt jetzt die laufende Transaktion, damit
Statuswechsel keine verschachtelte zweite Datenbanktransaktion öffnen.

## Implementiert

| Modell | Übernahme und Grenze |
| --- | --- |
| Pauschal/Fixpreis | Vereinbarter Nettobetrag; Teil-/Akonto-/Schlussrechnung teilen eine Kapazität. Enthaltene Stunden können auch ohne übermittelte Modellmetadaten nicht zusätzlich fakturiert werden. |
| Nach Aufwand | Freigegebene echte Zeitquellen, vollständige Stunden und gebundener Stundensatz. Angebotsposition oder expliziter Auftragsstundensatz wird beim berechtigten Abrechnen unveränderlich gebunden; keine rückwirkende automatische Umdeutung erfasster Nullsätze. Unverknüpfte Schätzungen bleiben Entwürfe. |
| Nach Menge | Ursprünglicher Preis, Einheit, Steuer und Positionsreferenz; kumulierte Menge und Nettokapazität gegen das angenommene Angebot geprüft. |
| Gemischt | Feste, mengenbezogene und ausdrücklich vereinbarte zusätzliche Zeitkomponenten getrennt. Ein Leistungsanteil darf die Komponente nicht wechseln. |
| Wiederkehrend | Kalendergebundene Monats-/Quartals-/Jahresperioden mit ursprünglichem Ankerdatum und Endgrenze. Kapazität und wiederkehrender fester Rabatt je Periode; keine automatische Ausstellung. |
| Nach Meilensteinen | Stabile IDs, vereinbarte Preise und ausdrücklich bestätigte Erfüllung. Erfüllungsereignisse ändern keine historischen Preisangaben. |

Gemeinsame Auswahl und Bearbeitung in Angebot, Auftrag und Rechnung; umfangreiche
Auftragsformulare verwenden FormPage. Weitere Teilrechnungen sind direkt aus einem
angenommenen modellierten Angebot erreichbar. CHF/EUR sind ausdrücklich wählbar;
ein Modellwechsel erhält die gewählte Währung. Übernommener Kunde, Modell und
Währung sind gesperrt. Fehlende Rechnungs-Gesamtsummen eines Auftrags werden
nicht als NaN übernommen: Der neue Entwurf verwendet die bestehende Engine,
während gespeicherte echte Nullbeträge erhalten bleiben. Ein fehlgeschlagener
Auftragsabruf kann über den gemeinsamen Retry erneut geladen werden.
Zeit-Picker zeigen berechtigte echte
Quellen und vereinbarte Preisoptionen; Sammelabfrage statt einer Abfrage je Eintrag.

Ausgestellte Rechnungen behalten ihre Reservierung bei Storno/Gutschrift; eine
Korrektur erzeugt keine stillschweigend erneut abrechenbare Leistung. Verworfenes,
nie ausgestelltes Entwurfsvolumen wird freigegeben. Die bestehende Gutschrift- und
Zahlungslogik bleibt führend. Schlussrechnungen listen vorherige Rechnungen als
bereits berechnet, ohne Zahlungseingänge zu erfinden. Frühere Teilentwürfe müssen
zuerst ausgestellt sein. Eine gedeckte Null-Schlussrechnung ist zulässig, erzeugt
keine Zahlungsaufforderung und keinen QR-Zahlteil. Abgeschlossene Vereinbarungen
sperren neue verrechenbare Timer/Einträge. Aktive Timer bzw. offene verrechenbare
Zeiten verhindern einen vorzeitigen Abschluss. Eine tatsächlich ausgestellte
Schlussrechnung sperrt auch später abschliessende ältere Entwurfstransaktionen;
frühe Erstellungszeitpunkte sind kein Umgehungsweg. Bereits ausgestellte frühere
Teilrechnungen bleiben für bestehende Verwaltungs-/Zahlungsprozesse zugänglich.
Die Zeiterfassung sperrt den modellierten Auftrag lesend, bevor sie den Abschluss
prüft; der Abschluss sperrt denselben Auftrag schreibend. Native Überlappung bleibt
ein gesonderter, hier nicht ausgeführter Nachweis.

Neue Tabellen verwenden erzwungene RLS und eng begrenzte Rechte. Der bestehende
Firmenexport erfasst sie automatisch. Die Datenbankkaskade der Firmenlöschung entfernt sie über
die Firmenreferenz; der unveränderliche Schutz lässt ausschliesslich diesen
verschachtelten Löschfall bei tatsächlich entfernter Firma zu. Direkte Löschung
bleibt auch im privilegierten isolierten Test gesperrt. Preisbindung,
Modellwechsel, Fremdmandanten, Nur-Lesen, fehlende Rollen und Audit-Fehler werden
serverseitig geprüft. Neue UI-/PDF-Texte liegen in DE/FR/IT/EN/TR vor. Keine
rechtlichen Übersetzungen oder Kunden-Authentifizierungsregeln geändert.

## Testnachweise und Grenzen

`scripts/billing-integration-cases.mjs` läuft im bestehenden Registrierungstest mit
den tatsächlichen APIs und allen Migrationen unter eingeschränkter PGlite-Rolle.
Jedes der sechs Modelle durchläuft Angebot ausstellen/annehmen → Auftrag →
Rechnung ausstellen. Weitere Gegenfälle: gemeinsame Kapazität über Angebot und
Auftrag, falscher Preis/Steuer, Mengenüberschreitung, doppelte Zeitquelle,
unerfüllter Meilenstein, periodischer Rabatt, Akonto/Teil-/Null-Schlussrechnung,
Gutschrift ohne Quellenfreigabe, Rollen/Mandanten/Nur-Lesen, Preisbindung,
Idempotenz und atomarer Audit-Rollback. Die nativen überlappenden HTTP-Transaktionen
sind vorbereitet, aber PGlite gilt ausdrücklich nicht als deren Nachweis.

Gezielte vorhandene Rabatt-, Angebots-, Readiness-, Dokument-, Berechtigungs- und
Migrationsregressionen behalten ihre echten Implementierungen. Testadapter wurden
um die echten gemeinsamen Module ergänzt; keine fachlichen Prüfungen deaktiviert.
Die abschliessenden Pflichtprüfungen werden im Statusbericht separat ausgewiesen.
Prüflogs/Screenshots: `../audit-20261026/v8-billing-*` ausserhalb des Checkouts.

## Offen / nicht als vollständig abgenommen melden

- Eine modellierte Rechnung bindet eine gemeinsame Vereinbarung. Das Kombinieren
  mehrerer unabhängiger modellierter Aufträge/Vereinbarungen in einer Rechnung
  wird sicher abgewiesen. Bestehende unmodellierte Sammelflüsse bleiben erhalten.
- Akonto setzt einen vereinbarten festen Leistungsanteil voraus; kein neues
  ungebundenes Vorauszahlungs-/Verrechnungskonto für reine variable Leistungen.
- Feste Rabatte auf Teilrechnungen werden mit den bestehenden Rabattfeldern
  ausdrücklich aufgeteilt und gegen die Vereinbarung begrenzt. Keine automatische
  proportionale Aufteilung. Cent-Rundung bei mehrfachen Teilmengen kann eine
  Schlussrechnung konservativ blockieren; kein erfundener Toleranzausgleich.
- Vollständige Variantenabnahme externer minutenbasierter Ressourcen im neuen
  Modellkontext sowie alle Kombinationen aus Rabatten und Steuerbefreiung offen.
- Die vollständige bestehende Lösch-CLI mit befülltem Geschäftsdatenbestand ist
  nicht qualifiziert: Ihre alphabetische Behandlung alter restriktiver Fremdschlüssel
  benötigt eine eigene sichere Reihenfolge. Der neue Test beweist die zusätzlichen
  Referenzen und die Kaskade nach kontrollierter Kind-vor-Eltern-Löschung; er
  behauptet keinen ausgeführten vollständigen CLI-Löschvorgang.
- Nativer PostgreSQL-Konkurrenznachweis mangels laufender lokaler Engine blockiert.
- Browseremulation ist keine physische iPhone-Safari-, installierte iOS-PWA- oder
  iPad-Abnahme. Echte Softwaretastatur und vollständige Routen-/Rollenmatrix offen.
- Gesamtes V8 und fachliche/visuelle Release-Abnahme bleiben offen. Kein Push,
  Merge, Produktivschema oder Deployment ohne ausdrückliche Freigabe.
