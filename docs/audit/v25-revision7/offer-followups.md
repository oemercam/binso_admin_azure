# Persönliche Angebots-Nachfass-Erinnerung

Die bisher fehlende persönliche In-App-Erinnerung ist als vertikales Paket
vorbereitet: bestehendes Angebotsdossier → Drei-Punkte-Menü → «Erinnerung» → gemeinsames FormSheet mit
Datum, Vorschau und ausdrücklicher Bestätigungscheckbox. Standard aus; keine neue
Navigation, kein zusätzlicher Plus-Button, kein CSS- oder Formular-Parallelstandard.
Beschriftung und Fehlermeldungen besitzen DE/EN/FR/IT-Katalogeinträge.

## Tatsächliches Verhalten

- Erinnerung gehört genau einem Benutzer, Mandanten und unveränderlichen
  Angebotsstand. Eine Wiederholung aktualisiert dieselbe Planung statt eine zweite
  anzulegen. Nach erfolgtem Hinweis ist diese Version nicht erneut aktivierbar.
- Nur berechtigte, schreibende Angebotsrollen und ein tatsächlich freigegebenes
  Fachmodul dürfen konfigurieren; kein Demo-, Read-only- oder time-only-Schreibweg.
- Gültiges Datum innerhalb365 Tagen, nicht vor heute und nicht nach Angebotsablauf.
  Aktuelle ausgestellte Version erforderlich; kein Entwurf oder akzeptierter,
  abgelehnter, abgelaufener, ersetzter oder archivierter Angebotsstand.
- Fällige eigene Hinweise werden beim Öffnen des Benachrichtigungspanels oder der
  Benachrichtigungsseite über einen authentifizierten, CSRF-/Rate-limit-geschützten
  POST geprüft. GET liest ausschliesslich. Maximal50 Einträge pro Prüfung.
- Prüfung und Konfiguration sperren zuerst das Angebot, dann den Erinnerungseintrag.
  Batchreihenfolge folgt global der Angebots-ID, um entgegengesetzte Sperrfolgen
  verschiedener Benutzer zu vermeiden. Entscheidung und Versionsstand werden unter
  Sperre erneut geprüft. Unique Constraint und atomarer Status verhindern Dubletten.
- Deaktivierte In-App-Angebotsbenachrichtigungen werden beachtet. Nicht mehr gültige
  Hinweise werden ohne Benachrichtigung abgeschlossen. Keine Meldung an Kunden.
- Hinweis, Status und Audit sind eine Transaktion. Fehler rollen alle drei zurück.
  FORCE RLS begrenzt selbst direkte Laufzeit-SQL-Zugriffe auf den eigenen Benutzer
  im eigenen Mandanten; Composite-FK bindet die Version an denselben Mandanten.
- Die Oberfläche zeigt Planung, Hinweis erstellt, Abbruch beziehungsweise nicht mehr
  erforderlich und die betreffende Version. Fehlgeschlagene Speicherung behält die
  Eingabe; eine unlesbare Erfolgsantwort gilt nicht als bestätigte Speicherung.

## Nachweise und ausdrückliche Grenzen

Der echte Repository-Code wurde im bestehenden Migrationstest gegen das gesamte
isolierte Schema und die eingeschränkte Laufzeitrolle ausgeführt: gültiges Opt-in,
ungültige/fehlende Bestätigung und Daten, künftige Fälligkeit, Rechte und RLS,
Abbruch/Reaktivierung, Replay, Entscheidung/Ablauf/Archiv/Versionswechsel,
Benachrichtigungspräferenz und vollständiger Rollback bei Auditfehler bestanden.
Der unveränderte Benachrichtigungs-Lesebestätigungsweg bleibt erhalten.

Zusätzliche Regressionen sind für die gebündelte aktuelle CI vorbereitet:
sechs physische PostgreSQL-Verbindungen, Browserformular mit Standard-aus,
synthetischem Speicherfehler, erneutem Speichern und Abbruch. Diese Prüfungen
werden erst nach tatsächlichem erfolgreichem Lauf als bestanden ausgewiesen.

Es gibt **keinen garantierten Hintergrundlauf bei geschlossener App**, keine
automatische Kunden-E-Mail, keinen echten Versandversuch, keinen neuen Scheduler,
Provider, Secret oder Push-Zugang. Diese Grenze steht auch vor der Aktivierung in
der Oberfläche. Ein späterer Hintergrund-Mailweg benötigt den verifizierten
Provider-/Betriebsvertrag und eigene Idempotenz-/Zustellnachweise. Er ist damit
ausdrücklich noch nicht als umgesetzt oder abgenommen erklärt.

Migration0077 ist additiv und bisher ausschliesslich im isolierten Test ausgeführt.
Ihre produktive Ausführung erfordert die separate exakte Commit-Freigabe.

## Aktueller CI-Befund und gezielte Testkorrekturen

Am Stand `d11a847b` bestanden der gesamte Migrationstest, der echte native
HTTP-/Rollen-Test und Build samt Paket-Smoke. Zwei neue Testvorbereitungen waren
fehlerhaft: Die isolierte native Testrolle konnte die bestehenden INVOKER-RLS-
Resolver nicht lesen; der Browserdatensatz enthielt kein Angebots-Gültigkeitsdatum.
Zusätzlich wurde dadurch ein echter Darstellungsfehler sichtbar: Die Detailabbildung
ersetzte ein fehlendes Gültigkeitsdatum durch das Ausstellungsdatum und konnte
dadurch im Gegensatz zu API/Liste fälschlich Ablauf anzeigen. Dieser Ersatz wurde
entfernt; der echte Mapper und die echte Statusprojektion werden positiv/negativ
mit fehlendem, zukünftigem und abgelaufenem Datum verglichen.
Die Testkorrektur ergänzt ausschliesslich SELECT auf die drei Resolver-Abhängigkeiten
in der temporären Testrolle und ein ausdrücklich gültiges synthetisches Angebot.
Ein zusätzlicher Browser-Gegenfall prüft das abgelaufene Angebot. Der Testvertrag
weist Nicht-Superuser und fehlenden RLS-Bypass ausdrücklich nach. Ein isolierter
Resolver-Test reproduzierte erst den Rechtefehler und danach den Erfolg mit genau
diesen drei Leserechten. Keine produktive Rolle oder Policy wurde geändert.
Die native Parallel- und Browserabnahme ist erst nach neuem erfolgreichem CI-Lauf
für den korrigierten Quellstand belegt.

Dieser Folge-Lauf ist für `d052a3be539a0cf358f550a54eecb33e7c0451f2`
jetzt erfolgreich: [Full Development39715830625](https://github.com/oemercam/binso_admin_azure/actions/runs/39715830625),
einschliesslich sechs physischer PostgreSQL-Verarbeiter und aller acht Browserjobs.
Der Erinnerungsfall besteht in Chromium und WebKit mit Standard-aus, erhaltenem
Opt-in nach Fehler, erneutem Speichern, Verlauf, Entfernung und abgelaufenem
Gegenfall. Das ist funktionale synthetische Browserabnahme, keine Originalscreen-,
physische Geräte-, echte Versand- oder vollständige Klauselfreigabe.
