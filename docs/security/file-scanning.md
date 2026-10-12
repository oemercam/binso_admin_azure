# Zentrale Datei-Quarantäne und Scanner-Anbindung

## Implementierter Vertrag

`lib/server/file-scan.ts` überträgt exakt die vor der Speicherung validierten Upload-Bytes über ClamAV `zINSTREAM` an einen lokalen Unix-Socket. Eine einzelne vollständige Antwort `stream: OK` mit NUL-Abschluss und anschliessendem Verbindungsende ergibt `clean`. Eine eindeutige `FOUND`-Antwort ergibt eine Ablehnung (HTTP 422); die abgelehnten Bytes werden nicht gespeichert. Fehler, widersprüchliche oder zu grosse Antworten, fehlender Verbindungsabschluss und eine Gesamtdauer über 15 Sekunden ergeben HTTP 503. Es werden keine Signaturnamen, Socket-Pfade oder Provider-Antworten an Nutzer ausgegeben.

`FILE_SCAN_SOCKET` ist optional. Ohne Konfiguration wird die Datei als `pending` gespeichert und ihr Download bleibt HTTP 423. Fehlende Konfiguration ist **kein** erfolgreicher Scan. Bei konfiguriertem, aber unerreichbarem Scanner wird der gesamte Upload abgebrochen. Der App-Client erlaubt keine entfernten TCP-Ziele. Der Azure-Sidecar lauscht ausschliesslich auf `127.0.0.1:3310` im gemeinsamen, isolierten App-Netzwerk; ein lokaler Bridge-Prozess stellt den privaten Unix-Socket bereit. Es gibt keinen öffentlichen Scanner-Endpunkt.

Vor und nach jeder Prüfung muss `VERSION` eine freigegebene Patchversion (1.4.6+ in 1.4 LTS oder 1.5.4+ in 1.5), positive Signaturversion und höchstens 72 Stunden alte geladene Signaturen melden. Ein Versionswechsel während des Scans, veraltete Signaturen oder mehr als fünf Minuten Uhrabweichung brechen die Freigabe ab. Der JSON-Nachweis wird durch additive Migration 0048 an den gespeicherten SHA-256 gebunden und innerhalb derselben Upload-Transaktion gespeichert.

Die Prüfung findet innerhalb des vorhandenen Idempotenz- und Datenbankvertrags vor den Datei-Inserts statt. Bereits erfolgreich gespeicherte Wiederholungen benötigen keinen weiteren Scan; veränderte Nutzlasten mit gleichem Schlüssel ergeben weiterhin HTTP 409. Scannerfehler verbrauchen den Wiederholungsschlüssel nicht. Die zusätzliche Netzwerkzeit innerhalb der Transaktion ist auf 15 Sekunden begrenzt; Poolauslastung und `idle_in_transaction_session_timeout` müssen beim Betriebsnachweis berücksichtigt werden.

Nur `clean`-Uploads ersetzen `organizations.logo_url` oder `app_users.avatar_url`. Bei `pending`, Ablehnung oder Ausfall bleibt die bisherige Referenz erhalten. Die Einstellungen zeigen keinen Erfolg und kein neues gespeichertes Bild für einen ungeprüften Upload an. Ein gewähltes lokales Vorschau-Bild ist noch keine gespeicherte Referenz.

Die Firmen-API erlaubt neue Logo-Referenzen ausschliesslich auf lokal gespeicherte, saubere Bilder mit Zweck `company_logo` im aktuellen Mandanten. Fremde Mandanten, Profilbilder, ungeprüfte Dateien und externe URLs werden abgewiesen. Explizites Entfernen eines Logos bleibt möglich. Der PDF-Logo-Leser und der Download-Endpunkt prüfen den sauberen Status unabhängig davon weiterhin.

## Noch erforderlicher Betriebsnachweis – keine automatische Azure-Aktivierung

1. Einen gepflegten ClamAV-Dienst auf derselben vertrauenswürdigen Linux-Laufzeit bereitstellen. Der lokale Socket muss ausschliesslich der Anwendung und dem Scanner zugänglich sein. Die bestehende Azure-Topologie bietet bisher keinen nachgewiesenen solchen Dienst; eine Container-/Sidecar- oder andere freigegebene Infrastrukturentscheidung ist erforderlich. Dockerfile und Konfiguration in `infrastructure/scanner` sowie `sidecar.bicep` bereiten dies vor. Der tatsächliche Dienst ist noch nicht aktiviert.
2. `freshclam` und Alarmierung für Signaturalter und Updatefehler einrichten. Ein `OK` von einem Dienst mit veralteten oder unvollständigen Regeln ist kein ausreichender Betriebsnachweis.
3. PDF-/Bildprüfung aktivieren und die Scanner-Limits nachweisen: `StreamMaxLength` und `MaxFileSize` mindestens 10 MiB; `MaxScanSize`, Rekursion, Laufzeit und Dateianzahl auf erlaubte Inhalte abstimmen. `AlertExceedsMax yes` und eine abgestimmte Behandlung verschlüsselter/nicht prüfbarer Inhalte (etwa `AlertEncrypted yes`) vorsehen. Überschrittene Scanlimits dürfen nicht still als erfolgreich geprüft gelten.
4. Mit **synthetischen** sauberen Dateien und einer offiziellen Antivirus-Testdatei den tatsächlichen Dienst prüfen: Annahme, Ablehnung, aktualisierte Signaturen, Limits, Scanner-Neustart, Ausfall, Zeitlimit, parallele Uploads und unveränderte Branding-Referenzen. Keine produktiven Dateien verwenden.
5. Erst danach `FILE_SCAN_SOCKET` konfigurieren und die echte Anwendung auf einem isolierten Testmandanten prüfen. Diese Änderung erfolgt separat und benötigt die Freigabe für den Betrieb.

Bestehende `pending`-Dateien werden nicht nachträglich als sauber markiert. Für Altbestände ist ein gesonderter, mandantenisolierter Rescan mit Prüfung derselben gespeicherten Bytes und anschliessender kontrollierter Veröffentlichung nötig. Ein Wiederholungsschlüssel liefert weiterhin seine ursprüngliche Antwort; er löst keinen Rescan aus. Kein SQL-Massenupdate auf `clean` durchführen. Historische Rechnungen, Branding-Referenzen und produktive Daten werden mit diesem Commit nicht migriert.

## Testnachweise und Grenzen

- `node scripts/file-scan-test.mjs`: echter Unix-Socket mit einem kontrollierten **Protokollgegenüber**, fragmentierten Antworten, Chunk-Grenzen, Ablehnung, Fehlern, Widersprüchen, Abbruch und Zeitlimit. Kein Antivirus-Engine-Nachweis.
- Wenn eine isolierte Entwicklungsumgebung Unix-Sockets verweigert, kann ausdrücklich `BINSO_FILE_SCAN_PROTOCOL_TEST_TRANSPORT=memory` verwendet werden. Dabei wird derselbe Client gegen verbundene Duplex-Streams geprüft; ein OS-Socket ist dann **nicht** geprüft. CI verwendet den Standard ohne diese Variable.
- `node scripts/auth-integrity-test.mjs`: echte isolierte Datenbank, tatsächliche Upload-/Download-/Firmen-Handler, kontrollierte Scannerurteile, Rollback, Retry, Replay, sauberer/pending Status und Mandanten-/Zweckgrenzen. Ohne expliziten `BINSO_REAL_SCANNER_SOCKET` kein externer Scannerkontakt. Der verpflichtende `scanner-engine`-Job setzt diesen Socket für die tatsächliche Upload-/Datenbankintegration mit dem echten Engine-Dienst.
- `node scripts/auth-integrity-test.mjs --postgres`: zusätzliche physisch parallele PostgreSQL-Clients im bereits bestehenden CI-Dienst; verweigert andere Datenbankziele als die explizite lokale Wegwerf-Testdatenbank.
- Native Geräte, produktive Azure-Konfiguration und historische Dateibestände sind nicht durch diese Tests abgenommen.

Offizielle Grundlagen: [ClamAV-Protokoll](https://docs.clamav.net/manual/Usage/ClamdProtocol.html), [ClamAV-Betrieb](https://docs.clamav.net/manual/Usage/Scanning.html).

## Vorbereiteter Azure-Betrieb

Die bestehende Code-App und das exakt geprüfte ZIP bleiben erhalten. `scripts/start-scanner-production.mjs` startet `server.js` und bei `BINSO_SCANNER_SIDECAR=true` die lokale Bridge. `FILE_SCAN_SOCKET` muss dann `/tmp/binso-scanner/clamd.sock` sein. Verzeichnis 0700, Socket 0600, Eigentümerprüfung, begrenzte Verbindungen und ausschließlich VERSION/INSTREAM schützen den App-Zugang. Der ClamAV-Daemon nimmt ausschließlich Loopback-Verbindungen an. Der Sidecar-Einstieg entfernt geerbte App-Credentials aus dem Prozess-Environment. Die vertrauenswürdige Sidecar-Grenze ist keine separate VM-Sicherheitsgrenze.

Der bestehende S1-Plan reicht für App plus ClamAV nicht aus. ClamAV empfiehlt mindestens 3 GiB, bevorzugt 4 GiB allein für den Scanner. Vor Aktivierung sind ein angebotener Plan mit mindestens 8 GiB pro Worker, Kostenfreigabe, eine private Registry und Pull-Identität zu prüfen. Kein Plan-Upgrade, Registry-Bau oder Rollenzugriff wird durch dieses Commit vorgenommen. `sidecar.bicep` ändert nur den nicht öffentlichen Scanner, nicht die Linux-Code-App oder ihr Main-Image. Den Image-Parameter nur mit dem tatsächlich qualifizierten unveränderlichen Registry-Digest belegen.

`freshclam` prüft zwölfmal täglich. Signaturen werden separat unter `/var/lib/clamav` gespeichert und mit TestDatabases geprüft. Ein erster Start mit leerem Volume kann mehrere Minuten dauern; Uploads bleiben bis zum geladenen aktuellen Signatursatz gesperrt. Das Startup-Modul protokolliert den Wechsel von `file_scan_health` zwischen `ready` und `unavailable`. Live-Alarmierung, tatsächliche Zustellung, Last- und Speicherverhalten, Updates und ein Neustart müssen im Azure-Betrieb belegt werden. Ein CI-Speicherlimit ist kein Messnachweis für den produktiven Worker.

## Kontrollierter Altdatei-Rescan

Am 2026-10-12 wurden 209 `pending`-Dateien mit gespeicherten Inline-Inhalten und gültigen SHA-256-Werten nur lesend festgestellt. Sie wurden nicht freigegeben. Nach Migration 0048 und erfolgreich qualifiziertem Live-Scanner erstellt `node scripts/rescan-pending-files.mjs --organization UUID --manifest /privater/pfad.json` mit echter `binso_runtime`-Anmeldung einen schreibgeschützten Auswahlvorgang, begrenzt auf 500 Dateien eines expliziten Mandanten. Das Manifest muss neu angelegt, privat (0600) und dem Operator zugeordnet sein.

Erst der explizite zweite Aufruf mit `--apply` prüft genau die ausgewählten, unveränderten Bytes. Unter Row-Lock werden Manifest-Hash, gespeicherter Hash, Größe und tatsächlicher Byte-Hash verglichen. Status, Nachweis und Audit-Event werden atomar gespeichert; ein Scanner-, Integritäts- oder Auditfehler lässt die Datei `pending`. Drei aufeinanderfolgende Fehler stoppen den Lauf. Bereits entschiedene und nicht sichtbare Dateien werden übersprungen. Dateiinhalt, historische Rechnungen und Branding-Referenzen werden nicht geändert. Saubere Dateien werden anschließend über den bestehenden Downloadvertrag verfügbar; abgelehnte bleiben gesperrt. Es gibt keine automatische Veröffentlichung von Logos oder Profilbildern.

## Zusätzliche Prüfungen

- `scripts/file-rescan-test.mjs`: isoliertes PostgreSQL-kompatibles PGlite mit eingeschränkter RLS-Rolle; fremde Mandanten, Hashfehler, manipulierte Bytes, Wiederholung, Scanner-Ausfall und Audit-Rollback.
- `scripts/scanner-engine-test.mjs`: echte offizielle, digestgebundene ClamAV-Engine im isolierten Docker-Runner; aktueller Signatursatz, synthetische saubere Bytes, harmlose Antivirus-Testsignatur, Archivlimit, Parallelität, tatsächlicher Upload-Handler und Rescan, Ausfall/Neustart und Credential-Environment. Ergebnisartefakt gilt nur für den konkreten CI-Lauf. Solange dieser Job nicht erfolgreich ist, liegt kein Engine-Nachweis vor.
- Der ZIP-Smoke startet die tatsächlich verpackte Bridge und den Startup-Wrapper und prüft Socket-Rechte. Die übrigen Build-/Browser-Gates und Main-Release-Freigaben bleiben verpflichtend.

Offizielle Betriebsgrundlagen: [ClamAV-Docker und RAM](https://docs.clamav.net/manual/Installing/Docker.html), [Azure-Code-App-Sidecars](https://learn.microsoft.com/en-us/azure/app-service/configure-sidecar).

Der erste echte Engine-Lauf 38281573947 fand einen ZIP-Grenzfall: ClamAV 1.4.6 kürzt extrahierte Einträge am MaxFileSize-Limit, ohne zwingend FOUND zu melden. Die Konfiguration setzt deshalb MaxFileSize 20 MiB **oberhalb** des kumulativen MaxScanSize-Budgets von 10 MiB. So muss auch eine abgeschnittene große Extraktion die kumulative Grenze auslösen. Der verpflichtende echte Test verwendet eine 30-MiB-Extraktion; die negative Assertion bleibt erhalten. Ein erfolgreicher korrigierter CI-Lauf ist noch erforderlich.
