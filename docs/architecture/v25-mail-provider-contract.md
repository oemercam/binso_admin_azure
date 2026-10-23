# V25 — verifizierter Mail-Providervertrag

Lesender Nachweis vom 22.10.2026; Pakete7–9 des Fast-Track. Grundlage ist
`38754fad7b2c1922653b725ad61d14de47cd6577`, keine produktive Änderung.

## Tatsächlicher Transport und vorhandene Rechte

`lib/server/email.ts` verwendet OAuth2 Client Credentials mit Graph `.default`,
danach genau einen MIME-Aufruf an Graph v1.0
`POST /users/{GRAPH_SENDER_USER_ID}/sendMail`. Kein alternativer Provider,
keine automatische Transportwiederholung; Token und Versand jeweils20s Timeout.
`mail-message.ts` erzeugt einen einzelnen MIME-Umschlag mit In-Memory-Anhängen.

Lesend in Azure/Entra bestätigt, ohne Mailversand oder Secret-Ausgabe:

- App Service `binso-admin-prod`, Gruppe `rg-binso-admin-prod`, im bereits
  zugänglichen Sponsorship-Abonnement `57c41f8a-69de-4655-bea5-fad30de6921a`.
  Das unveränderte CLI-Standardabonnement enthält diese App nicht.
- Alle vier `GRAPH_*`-Einstellungen sind vorhanden; Werte von Secret/Tenant
  wurden nicht protokolliert. Vorhandensein ist kein erfolgreicher Token-Test.
- Sender `one@binso.ch`, Client-ID `1f239d2f-363a-47a8-a564-f6cf4609f4e1`.
- Aktivierter Service Principal `Binso One Mail Service`; tatsächlich zugewiesen
  ist ausschliesslich Microsoft Graph Application `Mail.Send`. Auch die
  App-Registrierung fordert nur diese Rolle an. Keine neue Zustimmung erteilt.
- Exchange Application-RBAC-/Mailbox-Scope und Conditional Access wurden nicht
  verifiziert. Die alte Least-Privilege-Anleitung ist kein aktueller Scope-Nachweis.

## Kennungen, Annahme und Beweisgrenzen

| Nachweis | Tatsächlicher Vertrag |
| --- | --- |
| Graph202 | Anfrage angenommen, Verarbeitung/Zustellung noch nicht bestätigt; kein Response-Body mit Nachrichten-ID |
| Lokale Kennungen | `document_deliveries.id/request_key`, `mail_outbox.id/deduplication_key`, Mandant und Akteur binden den lokalen Auftrag |
| MIME Message-ID | Der MIME-Composer erstellt Nachrichtenheader; der Transport persistiert keine daraus abgeleitete Providerkorrelation im Auftrag |
| Graph request-id | Transportantwortheader werden derzeit nicht persistiert; eine Request-ID wäre ohnehin keine Zustellbestätigung |
| Archiv/PDF-Hash | Belegt den versendeten Dokumentstand, keine Postfachzustellung |
| `sendMail().delivered` | Historischer interner Transportname für Graph202; fachliche Aufrufer bilden auf `accepted`/`sent` ab. Dieser Boolean beweist keine Zustellung |

Referenz: [Graph sendMail v1.0](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0).
202 und leere Antwort sind ausdrücklich dokumentiert. Keine echte Annahme oder
Zustellung wurde in diesem Auftrag durch eine Testmail erzeugt.

## Ereignisse und nachträgliche Klärung

Graph unterstützt Mailbox-Änderungsbenachrichtigungen für Nachrichten, keine aus
dem bestehenden `sendMail`-Aufruf ableitbare generische Zustell-Webhook-Signatur.
Eine Subscription benötigt Leserechte, die vorhandene App besitzt nur `Mail.Send`.
Mailboxänderung oder Sent-Items-Kopie allein beweisen keine Empfängerzustellung.

Bei geeigneter Subscription wird die Empfänger-URL validiert; Basisereignisse
erfordern die Prüfung des geheimen `clientState`. Rich Notifications benötigen
zusätzlich validierte JWTs und entschlüsselte Ressourcendaten mit passender
App-/Tenant-Bindung. Keine dieser Voraussetzungen ist als bestehender
Binso-Ereignisvertrag nachgewiesen. Eine frei gepostete JSON-Meldung ist kein Beleg.

Exchange kann Nichtzustellberichte im Senderpostfach ablegen. Deren Abruf,
Interpretation und eindeutige Bindung an lokalen Auftrag und Empfänger fehlen.
Exchange Message Trace V2 ist eine mögliche separate Betreiberquelle, benötigt
jedoch entsprechende Rechte und belegbare Kennungs-/Empfänger-/Zeitkorrelation.
Keine vorhandene autorisierte Trace-Sitzung oder automatisierte Anbindung belegt.
NDR, Sent Items, Lesebestätigung und menschliches Lesen sind verschiedene Signale.

Primärquellen, am22.10.2026 gelesen:

- [Graph-Versandprozess und NDR](https://learn.microsoft.com/en-us/graph/outlook-things-to-know-about-send-mail)
- [Outlook Change Notifications und Rechte](https://learn.microsoft.com/en-us/graph/outlook-change-notifications-overview)
- [Authentizität von Rich Notifications](https://learn.microsoft.com/en-us/graph/change-notifications-with-resource-data)
- [Exchange Get-MessageTraceV2](https://learn.microsoft.com/en-us/powershell/module/exchangepowershell/get-messagetracev2?view=exchange-ps)

## Verbindliche Zustände und Paketentscheidung

| Persistierter Zustand | Zulässige Interpretation / Aktion |
| --- | --- |
| Outbox `queued` | Noch nicht beansprucht; nur der vorhandene autorisierte Ablauf darf fortsetzen |
| Outbox `failed` | Bestehender Vertrag für definitiv nicht erfolgten Transport; erneuter autorisierter Versuch möglich |
| Outbox `accepted`, Dokument `sent` | Providerannahme; keine behauptete Zustellung |
| `sending` | Reservierter Versuch, Ergebnis noch nicht sicher verbucht; kein Resend |
| `uncertain` | Providerergebnis unbekannt; auch neue Kennung umgeht die Sperre nicht |
| Dokument historisch `failed` | Konservativ ungeklärt; keine nachträgliche Behauptung eines sicheren Nichtversands |
| Dokument `not_attempted` | Nachweislich nicht versendet; bewusster neuer Versuch nach Behebung zulässig |

Paket8 ist **extern blockiert**: kein aktuell nutzbarer, authentifizierbarer und
korrelierbarer Zustell-/Bounce-Ereignisvertrag. Kein neuer Endpoint, keine
erfundenen Providerfunktionen, keine neuen Rechte und kein Scheduler.

Paket9: bestehende No-Resend-Sperren, Rollen/RLS, Audit und atomare Reservierung
beibehalten. Ohne echten Providerbeleg bleibt der Zustand unbekannt. Kein
manueller Schalter nach `delivered`, keine SQL-Freigabe, kein automatischer Retry.
Technische Negativnachweise stehen im bestehenden `migration-test.mjs`,
`offer-response-mail-contract.mjs` und den nativen Quality-Gates. Der grüne
Quality-Lauf39765711852 am unveränderten Ausgangsstand wird wiederverwendet.

Kleinster externer Folgeschritt: Betreiber liefert einen datensparsam redigierten,
verifizierbaren Trace-/NDR-Beleg samt vorhandener autorisierter Lesequelle.
Erst danach separater Vertrag für Korrelation, Evidenzaufbewahrung, Rolle,
Fresh Authentication, Idempotenz/Reihenfolge, Audit und Rollback; keine
automatische Erweiterung von `Mail.Send` in diesem Paket.
