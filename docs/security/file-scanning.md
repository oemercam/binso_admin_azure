# Zentrale Datei-Quarantäne und Scanner-Anbindung

## Implementierter Vertrag

`lib/server/file-scan.ts` überträgt exakt die vor der Speicherung validierten Upload-Bytes über ClamAV `zINSTREAM` an einen lokalen Unix-Socket. Eine einzelne vollständige Antwort `stream: OK` mit NUL-Abschluss und anschliessendem Verbindungsende ergibt `clean`. Eine eindeutige `FOUND`-Antwort ergibt eine Ablehnung (HTTP 422); die abgelehnten Bytes werden nicht gespeichert. Fehler, widersprüchliche oder zu grosse Antworten, fehlender Verbindungsabschluss und eine Gesamtdauer über 15 Sekunden ergeben HTTP 503. Es werden keine Signaturnamen, Socket-Pfade oder Provider-Antworten an Nutzer ausgegeben.

`FILE_SCAN_SOCKET` ist optional. Ohne Konfiguration wird die Datei als `pending` gespeichert und ihr Download bleibt HTTP 423. Fehlende Konfiguration ist **kein** erfolgreicher Scan. Bei konfiguriertem, aber unerreichbarem Scanner wird der gesamte Upload abgebrochen. Ein TCP-Scanner ohne Authentifizierung wird nicht angebunden.

Die Prüfung findet innerhalb des vorhandenen Idempotenz- und Datenbankvertrags vor den Datei-Inserts statt. Bereits erfolgreich gespeicherte Wiederholungen benötigen keinen weiteren Scan; veränderte Nutzlasten mit gleichem Schlüssel ergeben weiterhin HTTP 409. Scannerfehler verbrauchen den Wiederholungsschlüssel nicht. Die zusätzliche Netzwerkzeit innerhalb der Transaktion ist auf 15 Sekunden begrenzt; Poolauslastung und `idle_in_transaction_session_timeout` müssen beim Betriebsnachweis berücksichtigt werden.

Nur `clean`-Uploads ersetzen `organizations.logo_url` oder `app_users.avatar_url`. Bei `pending`, Ablehnung oder Ausfall bleibt die bisherige Referenz erhalten. Die Einstellungen zeigen keinen Erfolg und kein neues gespeichertes Bild für einen ungeprüften Upload an. Ein gewähltes lokales Vorschau-Bild ist noch keine gespeicherte Referenz.

Die Firmen-API erlaubt neue Logo-Referenzen ausschliesslich auf lokal gespeicherte, saubere Bilder mit Zweck `company_logo` im aktuellen Mandanten. Fremde Mandanten, Profilbilder, ungeprüfte Dateien und externe URLs werden abgewiesen. Explizites Entfernen eines Logos bleibt möglich. Der PDF-Logo-Leser und der Download-Endpunkt prüfen den sauberen Status unabhängig davon weiterhin.

## Noch erforderlicher Betriebsnachweis – keine automatische Azure-Aktivierung

1. Einen gepflegten ClamAV-Dienst auf derselben vertrauenswürdigen Linux-Laufzeit bereitstellen. Der lokale Socket muss ausschliesslich der Anwendung und dem Scanner zugänglich sein. Die bestehende Azure-Topologie bietet bisher keinen nachgewiesenen solchen Dienst; eine Container-/Sidecar- oder andere freigegebene Infrastrukturentscheidung ist erforderlich. Dieses Commit stellt keinen Dienst bereit.
2. `freshclam` und Alarmierung für Signaturalter und Updatefehler einrichten. Ein `OK` von einem Dienst mit veralteten oder unvollständigen Regeln ist kein ausreichender Betriebsnachweis.
3. PDF-/Bildprüfung aktivieren und die Scanner-Limits nachweisen: `StreamMaxLength` und `MaxFileSize` mindestens 10 MiB; `MaxScanSize`, Rekursion, Laufzeit und Dateianzahl auf erlaubte Inhalte abstimmen. `AlertExceedsMax yes` und eine abgestimmte Behandlung verschlüsselter/nicht prüfbarer Inhalte (etwa `AlertEncrypted yes`) vorsehen. Überschrittene Scanlimits dürfen nicht still als erfolgreich geprüft gelten.
4. Mit **synthetischen** sauberen Dateien und einer offiziellen Antivirus-Testdatei den tatsächlichen Dienst prüfen: Annahme, Ablehnung, aktualisierte Signaturen, Limits, Scanner-Neustart, Ausfall, Zeitlimit, parallele Uploads und unveränderte Branding-Referenzen. Keine produktiven Dateien verwenden.
5. Erst danach `FILE_SCAN_SOCKET` konfigurieren und die echte Anwendung auf einem isolierten Testmandanten prüfen. Diese Änderung erfolgt separat und benötigt die Freigabe für den Betrieb.

Bestehende `pending`-Dateien werden nicht nachträglich als sauber markiert. Für Altbestände ist ein gesonderter, mandantenisolierter Rescan mit Prüfung derselben gespeicherten Bytes und anschliessender kontrollierter Veröffentlichung nötig. Ein Wiederholungsschlüssel liefert weiterhin seine ursprüngliche Antwort; er löst keinen Rescan aus. Kein SQL-Massenupdate auf `clean` durchführen. Historische Rechnungen, Branding-Referenzen und produktive Daten werden mit diesem Commit nicht migriert.

## Testnachweise und Grenzen

- `node scripts/file-scan-test.mjs`: echter Unix-Socket mit einem kontrollierten **Protokollgegenüber**, fragmentierten Antworten, Chunk-Grenzen, Ablehnung, Fehlern, Widersprüchen, Abbruch und Zeitlimit. Kein Antivirus-Engine-Nachweis.
- Wenn eine isolierte Entwicklungsumgebung Unix-Sockets verweigert, kann ausdrücklich `BINSO_FILE_SCAN_PROTOCOL_TEST_TRANSPORT=memory` verwendet werden. Dabei wird derselbe Client gegen verbundene Duplex-Streams geprüft; ein OS-Socket ist dann **nicht** geprüft. CI verwendet den Standard ohne diese Variable.
- `node scripts/auth-integrity-test.mjs`: echte isolierte Datenbank, tatsächliche Upload-/Download-/Firmen-Handler, kontrollierte Scannerurteile, Rollback, Retry, Replay, sauberer/pending Status und Mandanten-/Zweckgrenzen. Kein externer Scannerkontakt.
- `node scripts/auth-integrity-test.mjs --postgres`: zusätzliche physisch parallele PostgreSQL-Clients im bereits bestehenden CI-Dienst; verweigert andere Datenbankziele als die explizite lokale Wegwerf-Testdatenbank.
- Native Geräte, produktive Azure-Konfiguration und historische Dateibestände sind nicht durch diese Tests abgenommen.

Offizielle Grundlagen: [ClamAV-Protokoll](https://docs.clamav.net/manual/Usage/ClamdProtocol.html), [ClamAV-Betrieb](https://docs.clamav.net/manual/Usage/Scanning.html).
