# Priorisierte Restbewertung — keine vollständige Abnahme

Stand: 22.10.2026. Diese Bewertung trennt Code, ausführbare Nachweise und externe
Freigaben. Der [CI-Abgleich](evidence-reconciliation.md) bestimmt, für welchen
Quellstand ein Test gilt. Aus573 Klauseln werden nicht573 angeblich fehlende
Funktionen abgeleitet: Viele Klauseln enthalten mehrere Pflichten, Sicherheitsgrenzen
oder Nachweisaufträge. Ungeprüfte Klauseln bleiben ausdrücklich ungeprüft.

## Implementiert und im angegebenen Umfang geprüft

| Priorität / Bereich | Implementierung und tatsächlicher Nachweis | Grenze |
| --- | --- | --- |
| P0 Dependency-Sicherheit | [Enger Next-Patch](security-braces.md), tatsächliche Next-Regel und Windows-Verzeichnisauflösung positiv/negativ, High-/Critical-Audit ohne Ausnahme, Frozen-Installation und Lint | Aktuelle1567eff4-Quality, CodeQL und Full Development erfolgreich; kein Main-/Alert-Abschluss behauptet |
| P0 Nachweisbindung | [Erweiterte Quellidentität](evidence-reconciliation.md) bindet auch Migrationen, Betriebsrechte, Patchbytes, Workflow- und Root-Konfiguration. Tatsächliche Git-/Mutations- und Negativprüfungen bestanden. | Ältere Digests sind historische Protokolle; aktuelle vollständige CI und exakter Git-Blob-Abgleich belegt. Kein Ersatz für Klausel-/Geräte-/Fachabnahme. |
| P0/P1 Rechnungszahlung und Status | [Explizite Überzahlung und zentrale Statusachsen](invoice-settlement.md), reale HTTP-/RLS-/Sechs-Verbindungsfälle, Audit-Rollback, Refund-/Cash-Parität und Browser-Interaktionen im erfolgreichen1567eff4-Full-Lauf | Keine volle Fach-/Klausel-/Original-/Geräteabnahme; kein Banktransfer |
| P0/P1 Transaktionen, RLS, kontrollierte Kundendubletten | `scripts/migration-test.mjs`, `scripts/postgres-parallel-test.mjs`, `lib/server/repositories/customer-merge.ts`; isolierte und native PostgreSQL-Prüfungen im aktuellen1567eff4-Full-Lauf | Keine automatische Zusammenführung historisch genutzter Kunden; vollständige unabhängige Klauselabnahme offen |
| P2 Persönliche Angebots-Erinnerung | [Vertikales Opt-in-Paket](offer-followups.md), Vorschau und persönlicher Verlauf, Rollen/RLS/Versionsprüfung, atomare Benachrichtigung und Audit; tatsächlicher Migrationstest bestanden | Aktuelle Browser-/Parallel-CI erfolgreich; echte Geräte und vollständige Fachabnahme offen, kein behaupteter Hintergrund-Mailversand |
| P0 Dokumentversand | [Unklare Versandausgänge](document-delivery-outcomes.md) blockieren auch neue Kennungen; bestätigter Nichtversand separat, historische Unklarheiten nicht automatisch freigegeben | Aktuelle Gesamt-CI erfolgreich; verifizierter externer Auflösungsnachweis und kontrollierter Bedienweg bleiben offen |
| P1/P2 Angebots-/MwSt.-Auswertungen und Berichtskopien | `lib/server/repositories/reports.ts`, gemeinsame PDF-/CSV-Projektion, Mail-/Empfängerlink- und Retention-Contracts; aktueller1567eff4-Quality- und Browserlauf | Informative MwSt.-Werte vor Gutschriften und separat ausgewiesene nicht steuerlich aufteilbare Gutschriften; keine Steuerdeklaration |
| P1 Übersetzungsgrenzen / Header | Gemeinsame Select-/Options-/API-Textgrenzen, Locale-Formatierung und redundanter Desktop-Breadcrumb korrigiert; aktuelle1567eff4-Tests und zuvor gleichbreit gerenderte Stichproben | Stichprobe und synthetische Transportdaten sind keine vollständige Sprach-/Original-/Gerätefreigabe |

## Implementiert, aber nicht vollständig abgenommen

- Identity, Registrierung, Sprache, Consent, zentrale Formulare/Switches, Rechtslayout,
  Support-Tickets, Fehlerrückmeldung und Entwurfswiederaufnahme besitzen bestehende
  Implementierungen und Teilnachweise. Alle zugehörigen Rollen, Tarif-/Zustands- und
  Sprachkombinationen sind nicht pauschal abgenommen.
-78 Routen und12 zusätzliche Operatorvarianten sind inventarisiert.76 Routen besitzen
  aktuelle1567eff4-Laufzeitmessungen;5588 Rollen-/Zustandsfälle sind geplant. Das ist kein Nachweis
  ihrer vollständigen Ausführung. Alle verbleibenden Fälle müssen einzeln bewertet
  werden, einschliesslich abgeleiteter und originaler visueller Referenzzustände.
- Berichtsversand, Empfängerfreigaben und Angebotsantworten unterscheiden
  Anbieterannahme von Zustellung/Lesen. Eine Graph-HTTP202-Antwort ist kein Empfang.
- Die vollständige Prüfung aller573 Klauseln auf Codevollständigkeit ist weiterhin
  offen. Das neue Feld `implementationStatus: ungeprueft` darf weder als Fehlerliste
  noch als erledigte Implementierung ausgegeben werden.

Auch die automatisierbaren Abnahmelücken bleiben eigene Arbeit, keine externen
Blocker: Die bestehende vollständige CI-Matrix deckt320–1920px ab, nicht sämtliche
2560+/4K- und echten Browserzoom125/150/200%-Fälle aus R7-47-011. Ein veränderter
Viewport oder Device-Scale-Factor ist nicht automatisch ein echter Browserzoom.
Die individuelle Rollen-/Zustands-/Sprach- und Referenzabnahme ist ebenfalls nicht
vollständig. Das beweist weder eine fehlende Seite noch eine fehlerfreie Umsetzung.

## Neue Implementierung, verbleibende Code- und Integrationslücken

| Priorität / Klauseln | Tatsächliche Lücke | Nächster begrenzter Umsetzungsschritt |
| --- | --- | --- |
| P2 / R7-14-005, R7-34-005, R7-50-005 | Persönliche Opt-in-In-App-Erinnerung mit Vorschau und Verlauf ist implementiert; die aktuelle native Parallel-/Browserprüfung ist erfolgreich, die vollständige fachliche/physische Abnahme ist offen. Automatische Erinnerungs-E-Mails sind davon getrennt nicht angeschlossen. R7-14-005 verlangt selbst keinen garantierten Hintergrund-Mailkanal; dessen Fehlen ist deshalb kein Beleg für eine fehlende Umsetzung dieser Klausel. Die bestehende manuelle dreistufige Rechnungsmahnung bleibt eine andere Funktion. | Funktionsnachweise sind aktuell; die vollständige Fach-/Geräteabnahme bleibt offen. Für automatische E-Mails tatsächlichen Provider-/Betriebsvertrag verifizieren; atomare Reservierung, Status-Neuprüfung und Deduplikation erhalten. Kein echter Versand ohne Freigabe. |
| P0/P1 / R7-06-003–004, R7-35-003 | Verifizierte Provider-Zustell-/Bounce-Verarbeitung und dauerhafte idempotente Wiederaufnahme sind nicht vollständig vorhanden. | Zuerst tatsächlichen Provider-Vertrag festlegen; anschliessend authentifizierte Ereignisverarbeitung und positive/negative Replay-/Signaturtests. Keine erfundene Graph-Webhook-Signatur oder fingierter Zustellstatus. |
| P0 / R7-25-003, R7-36-004 | Benachrichtigungs-/Eskalationsanbindung für alle genannten Betriebsereignisse nicht vollständig vorhanden. `lib/server/observability.ts` nennt diese Grenzen ausdrücklich. Eine zusätzliche eigene persistente Alarmhistorie ist keine ausdrücklich vorgeschriebene Funktion. | Bestehende Mess- und Auditquellen nutzen; erst tatsächlichen freigegebenen Alarm-/Providerweg anschliessen. Keine parallele neue Infrastruktur aus einem Codeaudit heraus. |

Weitere gezielt am aktuellen Code geprüfte Lücken:

| Priorität / Klausel | Konkreter Befund | Einordnung |
| --- | --- | --- |
| P0/P1 / R7-29-001–002 | Dashboard/API haben keine zentrale Einrichtungs-Checkliste; Ausstellung prüft echte QR-/Firmendaten, aber es fehlt der gemeinsame Readiness-Vertrag mit Feldziel und Rückkehr zur Aktion. | Noch zu implementieren; nicht durch fehlende Geräte oder Provider blockiert. Sicherheitsprüfung nicht ersetzen. |
| P1 / R7-05-008 | Kundenrabatt wird gespeichert; der gemeinsame Dokumentpositions-/Summen-/PDF-Datenfluss besitzt keinen expliziten Rabatt. | Noch nicht vollständig implementiert; Rabattbasis, Besteuerung, Persistenz und unveränderliche historische Werte gemeinsam klären/prüfen. Kein stilles Abändern von Preisen. |
| P1 / R7-39-007 | Sichere Bildnormalisierung und serverseitiger zentrierter512px-Zuschnitt sind vorhanden. Die neue Datei wird aber direkt hochgeladen; eine überprüfbare Zuschnittvorschau vor Übernahme fehlt. | Implementierbare UI-Lücke zusätzlich zum offenen realen Upload-/Gerätenachweis. |
| P0/P1 / R7-06-003, R7-35-003 | Entscheidungs-/Mitarbeitermails in public-offers.ts werden nach Entscheidungscommit direkt versendet; Fehler sind ehrlich unbestätigt, aber ohne dauerhaften Wiederaufnahmejob. | Eigene Codeintegrationslücke zusätzlich zum unbekannten Provider-Zustell-/Webhookvertrag; sichere Entscheidung und In-App-Nachricht sind bereits vorhanden. |
| P0 / R7-28-014 | Plattformrollen und erneute Entra-Identitätsbindung sind im Code vorhanden; daraus folgt kein Nachweis phishingresistenter Conditional-Access-Authentifizierung. | Tatsächliche Entra-Richtlinienzuweisung unbekannt, nicht als fehlende Identität behauptet; nur lesende externe Verifizierung erforderlich. |

Diese Liste enthält nachgewiesene Lücken, keine Behauptung, dass alle übrigen
Klauseln bereits vollständig implementiert sind. Offene fachliche Entscheidungen
und unbekannte Provider-Verträge werden nicht durch vermutete Anforderungen ersetzt.

## Extern blockiert / separat freizugeben

[Konkrete Voraussetzungen und nächste Schritte](external-acceptance.md); unbekannte
Konfiguration wird ausdrücklich nicht als fehlende Ressource ausgegeben.

| Priorität | Voraussetzung | Erforderlicher Nachweis beziehungsweise Freigabe |
| --- | --- | --- |
| P0 | Mail-Domain, SPF/DKIM/DMARC/TLS, Bounce-/Zustellvertrag, externe Mailclients | Tatsächliche vorhandene Konfiguration und freigegebener einmaliger Zustelltest; keine Kundentestmails oder DNS-Änderungen aus dieser Fortsetzung |
| P0 | Rechtliche Texte, Subprozessoren, grenzüberschreitende Datenflüsse, Übersetzungen | Fachjuristische und muttersprachliche Freigabe; generierte Texte nicht still veröffentlichen |
| P0 | Restore und Backup-Wirksamkeit | Kontrollierter isolierter Restore mit gesonderter Betriebsfreigabe; Metadaten-GET ist kein Restore-Test |
| P0/P1 | Dateiscanner, echte Provider-/Billing-/Push-Konfiguration | Konkrete bereits vorhandene Zugänge und tatsächliche Integration; fehlende Verbindung sicher blockieren, keine neue Rolle/Secret anlegen |
| P1 | iPhone Safari, installierte iOS-/Android-PWA, OS-Tastatur, Assistenztechnik | Reale Geräte-/Nutzerprüfung; WebKit-Emulation reicht nicht für diese Aussagen |
| P1/P2 | Berichtskopien-Retention im Betrieb | Bestehender Cleanup ist implementiert und isoliert geprüft. Explizite Tenant-Scopes, Environment-Zuordnung, produktive Indexmigration und echter Trockenlauf brauchen separate Freigabe; siehe [Retention](report-retention.md). |
| P0 | Integration / Migration / Deployment | Exakte neue Commit-Freigabe und sämtliche bestehenden Schutzregeln; Draft307 bleibt offen. |

Die vollständige Development-Qualifikation von1567eff4 ist erfolgreich und
[quellhashgeprüft](ci-1567eff4.json). Das ist keine technische Gesamtabnahme. Offen bleiben
die oben genannten Implementierungspakete und die individuelle Klauselabnahme.
55 Klauseln besitzen konkrete Implementierungsbefunde;518 sind noch nicht einzeln abschliessend
als implementiert oder fehlend bewertet. Dieser Zwischenstand ist ausdrücklich keine technische Gesamtabnahme.
