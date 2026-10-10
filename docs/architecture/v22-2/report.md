# V22.2 – Registrierungsanalyse und Implementierungsnachweis

**Zwischenstand, keine Gesamtfreigabe und kein produktiver Versandnachweis.** V22.1 und V22.2 gehören zum selben Gesamtauftrag. Offene V22.1-Anforderungen bleiben offen. Ausgang: main `cf1a98a6e783ca4f7a2c06199002d5398fd5edd4`; Arbeitsbranch `feat/v22-1-customer-standard-enforcement`, Draft-PR #234. Zwischenzeitliche eigene Test-/Dokumentationsbasis `4ab87b57ee79637621a4f28dd5567d4ea0daaed7`.

## Tatsächliche alte Architektur und Root Causes

| ID | Rendering-/Datenpfad | Nachgewiesene Ursache | Zentrale Änderung | Abnahme |
|---|---|---|---|---|
| REG-RC-01 | Hero/Marketing/Preisplan → `/registrieren` → `app/registrieren/page.tsx` | Lange eigenständige Auth-Card mit eigenem Draft-/Abbruchzustand; kein gemeinsames Sheet/Wizard | Route rendert allein `RegistrationSheet`; bestehende `FormSheet`, `FormWizard`, `Field`, `Button` | Browser: Schritte, Footer, Rücknavigation, schmale Viewports |
| REG-RC-02 | Registrierungs-POST → Graph → `email-bestaetigen` | Versand erzeugte nur OTP; Bestätigungsseite schickte Token an einen ausschliesslich OTP akzeptierenden Endpunkt | Link und OTP am selben bestehenden Endpunkt; vorhandene `auth_tokens` wiederverwendet | Isolierte Datenbank: Link, Code, Replay, Ablauf, Browserwechsel |
| REG-RC-03 | `sendMail` → Register/Resend | `{delivered:false}` wurde ignoriert; Oberfläche behauptete eine Zustellung | Register berücksichtigt Versandresultat; Resend meldet nur eine angeforderte Zustellung ohne Account-Offenlegung | Provider-Adapter liefert false; kein fiktiver Versandzustand |
| REG-RC-04 | Client-URL → lokale `plans` → POST | Client bestimmte Standardplan und Zusammenfassung; fehlende serverseitige Kontextantwort | Autoritativer GET-Kontext am vorhandenen Register-Endpunkt; IDs/Intervalle/Versionen beim POST geprüft | Gefälschter Tarif abgewiesen; konkrete Tarif-/Intervallübernahme |
| REG-RC-05 | Verifikation → Abo-Aktivierung | Übergabe führte direkt in eine Abo-Aktivierung, unabhängig vom Onboarding; produktiver Onboarding-Meilenstein wurde nicht gesetzt | Server-Handoff prüft vorhandenen Meilenstein, MFA und Rolle; bestehende Firmenoberfläche wird als FormSheet benutzt, expliziter Abschluss schreibt Meilenstein | Datenbank: Abschluss → Dashboard; Reader abgewiesen; anderer Mandant unverändert |
| REG-RC-06 | Registrierung → Profil/Audit | DPA-Version wurde nicht als angenommene Vertragsfassung festgehalten | Bestehendes Audit-Event erhält Vertragsfassungen; Datenschutzhinweis bleibt vom Vertrag getrennt | Veraltete DPA abgewiesen; Audit enthält Version und Datenbank-Zeitpunkt |
| REG-RC-07 | `mail-i18n` und Registrierungsroute | UI ausschliesslich Deutsch; Mailkörper teilweise unübersetzt | Ein gemeinsamer Katalog `lib/i18n.ts`, bisherige Mail-Schnittstelle bleibt Re-export | Fünf vollständige Katalogeinträge je Text; Fünf Sprach-Workflows in Chromium bestanden |

## Ownership und Datenverträge

- Einstieg/Schritte: `components/registration/registration-sheet.tsx`.
- Sheet/Fokus/Viewport/Scroll-Lock/Dirty-State: vorhandene zentrale `components/binso-ux.tsx`, `use-dialog-focus.ts`, `use-browser-back-guard.ts`, `confirm-dialog.tsx`.
- Schrittnavigation/Validierung sichtbarer Felder/Footer: vorhandener `components/form-wizard.tsx`; übersetzbare Labels ergänzen den bisherigen Vertrag.
- Tarif, Trial, Legal-Kontext, Pending-Receipt, atomare Verifikationsaktivierung für Link/OTP/Login und Handoff: `lib/server/registration.ts`; Konten-/Mandantenanlage bleibt `provisionOrganization`.
- Passwort-Policy und Hashing bleiben bestehen: mindestens zwölf Zeichen, Scrypt. Keine Passwörter in Browser-Storage oder Entwurfsdaten.
- Auth-Sitzung bleibt `lib/server/session.ts`; kein unbestätigtes Konto erhält eine Sitzung durch Wiederaufnahme.
- Verifikation bleibt `/api/auth/verify-email`; bestehende OTP-Verbraucher wie Login funktionieren weiter. Token-Replay erzeugt keine neue Sitzung.
- Öffentliche Fehler für vorhandene Identitäten und Resend werden nicht als Account-Auskunft angeboten. Gleichnamige Unternehmen werden nicht zusammengeführt.
- Registrierung löst keinen Stripe-Checkout aus. Die Testphase wird nach erster Bestätigung gestartet. Kostenpflichtiger Abschluss bleibt ein expliziter späterer Prozess.
- Minimaldaten: Firmenname (2–180 Zeichen), gültige E-Mail, Passwort, ausdrückliche AGB-/DPA-Annahme; Datenschutzhinweis verlinkt. Adresse, UID, Bank, Telefon nicht bei Erstanlage erforderlich.
- Keine Schema-Migration, kein historischer Datensatzumbau, kein zweites Auth-System. `organizations`, `organization_memberships`, `organization_subscriptions`, `app_users`, `auth_tokens`, `auth_email_codes`, `audit_events`, `organization_milestones` bleiben die Owner.

## Prüfstand

`registration-test.mjs` führt reale Handler und Provisionierung gegen alle aktuellen Migrationen in einer isolierten PGlite-Datenbank aus. Adapter ersetzen nur Next-Request-Kontext, Provider, Session-Cookie-Speicher und externe Rate-Limit-Infrastruktur. Damit sind keine produktive Graph-Zustellung, echten parallelen PostgreSQL-Prozesse oder physischen Mobilgeräte nachgewiesen.

Bestanden im gezielten Lauf: serverseitiger Tarif-/Legal-Kontext, echte Mandantenanlage, ausbleibender Versand, geschütztes Receipt, Wiederholungsanfrage ohne zusätzliche Anlage, gleiche Firmennamen als getrennte Mandanten, Sprachkataloge, Link in anderem Browser, verbrauchter/abgelaufener Link, keine Trial-Verlängerung, OTP, MFA-Handoff, Onboarding-Abschluss, Reader-Ablehnung, unveränderter fremder Mandant, generische Resend-Antwort sowie bestehender Login mit fehlgeschlagener OTP-Zustellung (503, keine Sitzung), erfolgreichem OTP und weiterhin verpflichtender MFA-Einrichtung.

Der erneute lokale vollständige CI-Lauf nach Konsolidierung der Login-Verifikation (Lint, Typecheck, Produktionsbuild, Unit-/Integrationstests) ist mit Exit-Code 0 bestanden; vollständiger Nachweis: `docs/assets/v22-2/ci.txt`. Die zwischenzeitlich fehlgeschlagene Dokumentationsprüfung verlangte eine exakte Bezeichnung des E-Mail-Bestätigungscodes. Die Beschreibung wurde präzisiert; das Gate blieb aktiv. Registrierung: 22 Kombinationen aus den elf geforderten Breiten und Light/Dark sowie fünf Sprach-Workflows bestanden, einschliesslich Pflicht-/Passwortprüfung, Browser-Zurück, rechtlichen Links, Abbruchschutz, fehlgeschlagenem POST, Doppeltap, Receipt-Wiederaufnahme als Fixture und angeforderter erneuter Zustellung. Zusätzlich 16 Statistik-Kombinationen mit Axe sowie Finance-/Settings-Interaktionen bestanden. Diese gezielten Nachweise ersetzen keine breiten abschliessenden GitHub- oder Geräteprüfungen. Der vorherige V22.1-Stand bestand lokal 1’760 Fixture-Kombinationen; GitHub fand zusätzlich einen Definitionslistenfehler bei KPI-Hilfetexten. Dieser ist zentral korrigiert, gezielter erneuter Axe-Nachweis auf den vier Statistikseiten in 375/1440 px und beiden Themes bestanden.

## Offene/blockierte Abnahme

Aktualisierung nach Commit `e0d97e3`: GitHub-Run `38049876342` bestand Checks, Build, Plan und den Chromium-Job. WebKit bestand die allgemeinen Routen-/Prozessprüfungen, scheiterte im Registrierungs-Resend-Test an einer bereits vorher sichtbaren Statusmeldung. Der Test wartet nun auf den tatsächlichen POST-Abschluss und prüft weiterhin genau einen Request. Der erneute lokale Chromium-Lauf bestand 27 Fälle; das beweist noch keinen grünen neuen GitHub-WebKit-Lauf. Auth-Rücksprünge in Registrierung, Login und MFA verwenden jetzt gemeinsam `lib/navigation.ts`, inklusive Regression gegen URL-Normalisierungsangriffe.

- Echte Graph-Zustellung, produktiver Link in realem Postfach, SPF/DKIM/DMARC und aktueller Provider-Konfigurationsnachweis.
- Fachliche/juristische Freigabe der vorhandenen AGB/DPA/Datenschutzerklärung. Texte werden nicht stillschweigend als freigegeben erklärt.
- Physisches iPhone Safari, Android Chrome, installierte PWA, echtes Password-Autofill und virtuelle Tastatur. Browseremulation ersetzt diese Nachweise nicht.
- Korrektur einer bereits angelegten unbestätigten E-Mail wird nicht unsicher angeboten; aktuell über bestehenden Login/Recovery/Support fortsetzen. Kein Konto wird durch Sheet-Abbruch gelöscht.
- Alle noch offenen V22.1-Phasen; insbesondere Listen-/Filtermigration, Schweizer Stammdaten, alle Kunden-App-Wizards und übrige Statistikbereiche.
- Kein Merge, kein Deployment dieses Zwischenstands, keine Live-Abnahme.
