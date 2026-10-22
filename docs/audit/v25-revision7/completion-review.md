# Priorisierte Restbewertung — keine vollständige Abnahme

Stand: 22.10.2026. Diese Bewertung trennt Code, ausführbare Nachweise und externe
Freigaben. Der [CI-Abgleich](evidence-reconciliation.md) bestimmt, für welchen
Quellstand ein Test gilt. Aus573 Klauseln werden nicht573 angeblich fehlende
Funktionen abgeleitet: Viele Klauseln enthalten mehrere Pflichten, Sicherheitsgrenzen
oder Nachweisaufträge. Ungeprüfte Klauseln bleiben ausdrücklich ungeprüft.

## Implementiert und im angegebenen Umfang geprüft

| Priorität / Bereich | Implementierung und tatsächlicher Nachweis | Grenze |
| --- | --- | --- |
| P0 Dependency-Sicherheit | [Enger Next-Patch](security-braces.md), tatsächliche Next-Regel und Windows-Verzeichnisauflösung positiv/negativ, High-/Critical-Audit ohne Ausnahme, Frozen-Installation und Lint | Neue vollständige Commit-CI noch erforderlich; kein Main-/Alert-Abschluss behauptet |
| P0 Nachweisbindung | [Erweiterte Quellidentität](evidence-reconciliation.md) bindet auch Migrationen, Betriebsrechte, Patchbytes, Workflow- und Root-Konfiguration. Tatsächliche Git-/Mutations- und Negativprüfungen bestanden. | Ältere Digests sind historische Protokolle; aktuelle vollständige CI erforderlich. Kein Ersatz für Klausel-/Geräte-/Fachabnahme. |
| P0/P1 Transaktionen, RLS, kontrollierte Kundendubletten | `scripts/migration-test.mjs`, `scripts/postgres-parallel-test.mjs`, `lib/server/repositories/customer-merge.ts`; isolierte und native PostgreSQL-Prüfungen im a9b-Full-Lauf | Keine automatische Zusammenführung historisch genutzter Kunden; vollständige unabhängige Klauselabnahme offen |
| P2 Persönliche Angebots-Erinnerung | [Vertikales Opt-in-Paket](offer-followups.md), Vorschau und persönlicher Verlauf, Rollen/RLS/Versionsprüfung, atomare Benachrichtigung und Audit; tatsächlicher Migrationstest bestanden | Aktuelle Browser-/Parallel-CI offen; kein behaupteter Hintergrund-Mailversand |
| P0 Dokumentversand | [Unklare Versandausgänge](document-delivery-outcomes.md) blockieren auch neue Kennungen; bestätigter Nichtversand separat, historische Unklarheiten nicht automatisch freigegeben | Neue Gesamt-CI erforderlich; verifizierter externer Auflösungsnachweis und kontrollierter Bedienweg bleiben offen |
| P1/P2 Angebots-/MwSt.-Auswertungen und Berichtskopien | `lib/server/repositories/reports.ts`, gemeinsame PDF-/CSV-Projektion, Mail-/Empfängerlink- und Retention-Contracts; a9b-Quality und Browserlauf | Informative MwSt.-Werte vor Gutschriften und separat ausgewiesene nicht steuerlich aufteilbare Gutschriften; keine Steuerdeklaration |
| P1 Übersetzungsgrenzen / Header | Gemeinsame Select-/Options-/API-Textgrenzen, Locale-Formatierung und redundanter Desktop-Breadcrumb korrigiert; a9b-Tests und gleichbreite gerenderte Stichproben | Stichprobe und synthetische Transportdaten sind keine vollständige Sprach-/Original-/Gerätefreigabe |

## Implementiert, aber nicht vollständig abgenommen

- Identity, Registrierung, Sprache, Consent, zentrale Formulare/Switches, Rechtslayout,
  Support-Tickets, Fehlerrückmeldung und Entwurfswiederaufnahme besitzen bestehende
  Implementierungen und Teilnachweise. Alle zugehörigen Rollen, Tarif-/Zustands- und
  Sprachkombinationen sind nicht pauschal abgenommen.
-78 Routen und12 zusätzliche Operatorvarianten sind inventarisiert.76 Routen besitzen
  a9b-Laufzeitmessungen;5588 Rollen-/Zustandsfälle sind geplant. Das ist kein Nachweis
  ihrer vollständigen Ausführung. Alle verbleibenden Fälle müssen einzeln bewertet
  werden, einschliesslich abgeleiteter und originaler visueller Referenzzustände.
- Berichtsversand, Empfängerfreigaben und Angebotsantworten unterscheiden
  Anbieterannahme von Zustellung/Lesen. Eine Graph-HTTP202-Antwort ist kein Empfang.
- Die vollständige Prüfung aller573 Klauseln auf Codevollständigkeit ist weiterhin
  offen. Das neue Feld `implementationStatus: ungeprueft` darf weder als Fehlerliste
  noch als erledigte Implementierung ausgegeben werden.

## Nachweislich noch nicht vollständig implementiert

| Priorität / Klauseln | Tatsächliche Lücke | Nächster begrenzter Umsetzungsschritt |
| --- | --- | --- |
| P2 / R7-14-005, R7-34-005, R7-50-005 | Persönliche In-App-Erinnerung ist jetzt implementiert. Garantierter Hintergrund-Mailversand mit Zustellhistorie bei geschlossener App fehlt weiterhin. Die bestehende manuelle dreistufige Rechnungsmahnung bleibt eine andere Funktion. | Verifizierten Provider-/Betriebsvertrag für einen späteren Hintergrund-Mailweg festlegen; atomare Reservierung, Status-Neuprüfung und Deduplikation erhalten. Kein echter Versand ohne Freigabe. |
| P0/P1 / R7-06-003–004, R7-35-003 | Verifizierte Provider-Zustell-/Bounce-Verarbeitung und dauerhafte idempotente Wiederaufnahme sind nicht vollständig vorhanden. | Zuerst tatsächlichen Provider-Vertrag festlegen; anschliessend authentifizierte Ereignisverarbeitung und positive/negative Replay-/Signaturtests. Keine erfundene Graph-Webhook-Signatur oder fingierter Zustellstatus. |
| P0 / R7-25-003, R7-36-004 | Persistente Monitoring-Alarmhistorie, Benachrichtigungs-/Eskalationsanbindung für alle genannten Betriebsereignisse nicht vollständig vorhanden. `lib/server/observability.ts` nennt diese Grenzen ausdrücklich. | Bestehende Mess- und Auditquellen nutzen; erst tatsächlichen freigegebenen Alarm-/Providerweg anschliessen. Keine parallele neue Infrastruktur aus einem Codeaudit heraus. |

Diese Liste enthält nachgewiesene Lücken, keine Behauptung, dass alle übrigen
Klauseln bereits vollständig implementiert sind. Offene fachliche Entscheidungen
und unbekannte Provider-Verträge werden nicht durch vermutete Anforderungen ersetzt.

## Extern blockiert / separat freizugeben

| Priorität | Voraussetzung | Erforderlicher Nachweis beziehungsweise Freigabe |
| --- | --- | --- |
| P0 | Mail-Domain, SPF/DKIM/DMARC/TLS, Bounce-/Zustellvertrag, externe Mailclients | Tatsächliche vorhandene Konfiguration und freigegebener einmaliger Zustelltest; keine Kundentestmails oder DNS-Änderungen aus dieser Fortsetzung |
| P0 | Rechtliche Texte, Subprozessoren, grenzüberschreitende Datenflüsse, Übersetzungen | Fachjuristische und muttersprachliche Freigabe; generierte Texte nicht still veröffentlichen |
| P0 | Restore und Backup-Wirksamkeit | Kontrollierter isolierter Restore mit gesonderter Betriebsfreigabe; Metadaten-GET ist kein Restore-Test |
| P0/P1 | Dateiscanner, echte Provider-/Billing-/Push-Konfiguration | Konkrete bereits vorhandene Zugänge und tatsächliche Integration; fehlende Verbindung sicher blockieren, keine neue Rolle/Secret anlegen |
| P1 | iPhone Safari, installierte iOS-/Android-PWA, OS-Tastatur, Assistenztechnik | Reale Geräte-/Nutzerprüfung; WebKit-Emulation reicht nicht für diese Aussagen |
| P1/P2 | Berichtskopien-Retention im Betrieb | Bestehender Cleanup ist implementiert und isoliert geprüft. Explizite Tenant-Scopes, Environment-Zuordnung, produktive Indexmigration und echter Trockenlauf brauchen separate Freigabe; siehe [Retention](report-retention.md). |
| P0 | Integration / Migration / Deployment | Exakte neue Commit-Freigabe und sämtliche bestehenden Schutzregeln; Draft307 bleibt offen. |

Die nächste technische Abschlussrunde muss den neuen Commit vollständig qualifizieren
und anschliessend die verbleibenden Implementierungspakete und Klauselreviews
abarbeiten. Dieser Zwischenstand ist ausdrücklich keine technische Gesamtabnahme.
