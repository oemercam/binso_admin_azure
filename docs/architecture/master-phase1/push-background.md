# Web Push: Hintergrundversand und Konfiguration

Stand: 24.10.2026. Der zeitbegrenzte Codeauftrag erfolgte ohne Prüfläufe. Auf anschliessenden ausdrücklichen Wunsch zur produktiven Aktivierung wurden in einer getrennten Releasevorbereitung lokale Prüfungen und echte PostgreSQL-Migrationstests ausgeführt; die aktuellen Ergebnisse und Windows-/CI-Grenzen stehen in implementation.md. Produktive Aktivierung und Geräteabnahme bleiben bis zur Freigabe offen.

## Zentrale Anbindung

- `instrumentation.ts` startet den Worker beim Start einer produktiven Node-Serverinstanz. Edge, Entwicklungsserver und der deklarierte Produktions-Build sind ausgenommen. Es wird kein öffentlicher Cron-/Versand-Endpunkt eingerichtet.
- `lib/server/push-worker.ts` besitzt einen Timer je Prozess, startet verzögert, führt keine parallelen eigenen Durchläufe aus und hält den Serverstart von Datenbank-/Providerzugriffen frei. Nach Fehlern steigt die Wartezeit bis höchstens 15 Minuten; ein kleiner Zufallsversatz verteilt mehrere Instanzen.
- `lib/server/push-config.ts` ist der zentrale Besitzer der Konfiguration. Es prüft auch, ob öffentlicher und privater VAPID-Schlüssel dasselbe P-256-Paar bilden. Fehlende oder ungültige Schlüssel deaktivieren den Versand.
- `lib/server/push.ts` ist der gemeinsame Versandpfad für Worker und den bereits geschützten Operator-Aufruf. Die bisherigen Sitzungs-, Organisations-, Benutzer-, Rollen-, MFA- und Modulprüfungen bleiben Grundlage. Keine Änderung an Finanzberechnungen oder Rollenrechten.

## Aktivierung bei einem später freigegebenen Release

1. Migrationen 0106 und anschliessend 0107 mit dem vorhandenen Migrationsverfahren anwenden. 0107 erweitert die Geräte-Tabelle und den Versandstatus. In diesem Auftrag wurde keine Datenbank migriert.
2. Ein dauerhaftes zusammengehöriges VAPID-Schlüsselpaar als `WEB_PUSH_PUBLIC_KEY` und `WEB_PUSH_PRIVATE_KEY` hinterlegen. Als `WEB_PUSH_SUBJECT` eine gültige `mailto:`-Kontaktadresse verwenden. Keine privaten Schlüssel ins Repository, in Ausgaben oder in Client-Konfigurationen übernehmen. Es wurden hier keine Schlüssel erzeugt oder extern hinterlegt.
3. Den vorhandenen stabilen `APP_ENCRYPTION_KEY` und `DATABASE_URL` beibehalten. Den Verschlüsselungsschlüssel nicht bei Neustarts ersetzen.
4. `WEB_PUSH_WORKER_ENABLED=true` aktiviert den automatischen Versand. Der Standard bleibt `false`, insbesondere für Vorschau/QA. `WEB_PUSH_INTERVAL_SECONDS` erlaubt 30–900 Sekunden, Standard und Ersatzwert bei ungültiger Angabe: 60.
5. Einen dauerhaft laufenden Node/App-Service-Prozess verwenden. Für Azure App Service Always On einschalten, damit der Prozess ohne eingehende Benutzeranfragen geladen bleibt. Diese externe Einstellung wurde nicht verändert. App-Einstellungen werden beim Serverstart übernommen; Änderungen erfordern den vorgesehenen Neustart.
6. Anwender aktivieren Push ausdrücklich auf ihrem Gerät und wählen die gewünschten Themen. Ohne persönliche Push-Präferenz erfolgt kein Versand. Bei geänderten VAPID-Schlüsseln ist eine erneute Geräteaktivierung erforderlich; der Client ersetzt eine veraltete Browser-Anmeldung erst nach ausdrücklicher Aktion.

Die Geräteanmeldung und die Schlüsselkonfiguration sind unabhängig vom automatischen Worker-Schalter: Bei ausgeschaltetem Worker kann der berechtigte Operator weiterhin den vorhandenen manuellen Versandpfad verwenden. Eine gespeicherte Gerätefreigabe allein ist kein laufender Hintergrundversand und kein Zustellnachweis.

## Zustellablauf und Grenzen

Der Worker verarbeitet vorhandene `in_app_notifications`; er erfindet keine zusätzlichen Ereignisse und ersetzt keine fachlichen Ereigniserzeuger. Neue bisher nicht erzeugte Ereignisarten sind nicht Teil dieser Anbindung.

Ein Lauf betrachtet bis zu 20 Geräte und führt höchstens fünf Provider-Versuche durch. Pro Gerät wird eine berechtigte Nachricht je Lauf gewählt. Die Reihenfolge ist älteste unberücksichtigte Nachricht zuerst, unabhängig vom auf 100 Einträge begrenzten Glocken-UI. Es werden nur Meldungen nach der jeweiligen Geräteanmeldung und innerhalb der letzten 24 Stunden berücksichtigt. Ältere Nachrichten bleiben in der vorhandenen In-App-Ansicht. Versandverzögerung hängt auch von Warteschlange, Fehlerabstand und aktiven Geräten ab.

Der eindeutige Datensatz für Gerät/Nachricht wird **vor** dem Provider-Aufruf festgeschrieben. Konkurrierende Instanzen können dieselbe Kombination nicht gleichzeitig beanspruchen. Ein nachfolgender Prozessabbruch führt dadurch nicht zu einem automatischen erneuten Versand. Diese Entscheidung kann nach einem Abbruch vor dem tatsächlichen Versand auch eine nicht versendete Nachricht als unklar hinterlassen; es wird keine Exactly-once-Zustellung behauptet.

- `processing`: dauerhaft beansprucht, Ergebnis noch nicht gespeichert.
- `accepted`: Anbieter hat angenommen; kein Beweis für Anzeige, Geräteempfang oder Lesen.
- `failed`: definitive Ablehnung, einschliesslich 429; kein automatischer Wiederholungsversuch.
- `uncertain`: Netzwerkfehler, 5xx oder nach fünf Minuten unterbrochener Auftrag; kein automatischer Wiederholungsversuch.
- `gone`: Anbieter meldet 404/410; Gerät wird deaktiviert.
- `skipped`: keine Berechtigung/Präferenz oder zwischenzeitlich widerrufene Geräteanmeldung. Späteres Einschalten einer Präferenz sendet diese alten Meldungen nicht nachträglich.

Ein Neustart setzt dauerhaft gespeicherte Zustellmarkierungen nicht zurück. Die Beanspruchung sperrt das Gerät nur während kurzer Datenbankarbeit, nicht während des Provider-Aufrufs. Unmittelbar vor Versand wird die aktive Geräte-/Sitzungsbindung nochmals geprüft. Das Sperrbildschirm-Payload bleibt allgemein und führt nur zur geschützten Benachrichtigungsseite.

## Betriebssicht

`GET /api/operator/notifications/push` erfordert die bestehende Operator-Anmeldung und `security:manage`. Es zeigt Konfigurationszustand ohne Schlüssel, den Workerzustand des antwortenden Prozesses und aggregierte Versandzustände der letzten 24 Stunden. `not_started`/`unavailable` sind keine funktionierende Zustellung. Die Übersicht ist kein flottenweiter Heartbeat und kein Provider-Empfangsnachweis. `deviceDeliveryConfirmed` bleibt ausdrücklich `false`.

Der bestehende `POST` bleibt rollen-, origin- und ratenbegrenzt; ein manueller Aufruf wird im bestehenden Plattform-Audit festgehalten. Logs enthalten Zustandswechsel und aggregierte Mengen, keine Geräteendpunkte, Auth-Schlüssel, privaten Inhalte oder rohen Providerfehler.

## Offene Freigaben

Keine Tests oder Abnahme ausgeführt; insbesondere Parallelität, Migration unter PostgreSQL, Standalone-Instrumentierung, Schlüsselrotation, iPhone/iPad-Berechtigung und tatsächlicher Empfang bleiben zu prüfen. Die laufende Vorschau wurde weder neu gebaut noch als Nachweis dieses Codes ausgegeben. Übersetzungen blieben unverändert. Es gab keine GitHub-Aktion, keinen Deployment-Aufruf und keine produktive Konfigurationsänderung.

Quellen: installierte Next.js-Dokumentation `node_modules/next/dist/docs/01-app/02-guides/instrumentation.md`; [Microsoft: App Service-Einstellungen und Always On](https://learn.microsoft.com/en-us/azure/app-service/configure-common); [web-push: VAPID und Versandoptionen](https://github.com/web-push-libs/web-push).
