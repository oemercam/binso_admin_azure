# BINSO ONE – Vollständiges Plattform-Gesamtkonzept V25.5

**Stand:** 20.10.2026 · **Art:** fachliches Soll-/Lebenszykluskonzept, noch keine Codefreigabe · **Adressaten:** Produkt, UX, Security, Engineering, QA, Legal, One Admin und spätere App-Store-Teams.  
**Verhältnis zum laufenden Auftrag:** Dieses Dokument erweitert V25.3/V25.4 und den UX-Masterstandard V1. Der frühere Codex-Auftrag läuft unabhängig weiter. Diese Datei ist **kein** Codex-Prompt, kein Implementierungsnachweis und keine Freigabe für PR, Merge, produktive Migration oder Deployment.

## 0. Verbindlichkeit, Versionierung und Leseschlüssel

- **[B] Bestätigt:** ausdrücklich vom Auftraggeber bestätigte Produkt- oder UX-Entscheidung.
- **[V] Verbindlicher bestehender UX-Vertrag:** bereits freigegebene Regeln in `AGENTS.md`, `docs/architecture/ux-current-approval.md`, der Microsoft-Originalreferenz und dem Design-System-Manifest.
- **[S] Vollständig definierter Standardvorschlag:** von uns zur fachlichen Vollständigkeit spezifiziert, aber **noch nicht ausdrücklich als Änderungsfreigabe bestätigt**; sicherer Default, keine riskante automatische Aktion.
- **[G] Entscheidungs-/Freigabegate:** Recht, Sicherheit, Provider, Tarifvertrag, Ermessensentscheidung oder technische Evidenz nötig. Bis Freigabe sicheren bestehenden Zustand bewahren.
- **[I] Ist-Code-Befund:** nur auf den in der Unterhaltung überprüften Codestand bezogen. Nicht gleichbedeutend mit erfolgreicher End-to-End-Abnahme oder aktuell laufender Codex-Implementierung.
- **[Q] Abnahme:** erforderlicher prüfbarer Akzeptanzfall, nicht allein ein statischer Quelltext-Test.

**Rangfolge:** Jüngste ausdrückliche Nutzerentscheidung > aktive UX-Genehmigung und AGENTS > dieses Ergänzungskonzept für neue fachliche Lücken > V25.4 > V25.3 > ältere historische Konzepte. Bei Widerspruch zwischen sicherheitskritischem Betrieb und Bedienungswunsch muss der Konflikt transparent entschieden werden, nicht stillschweigend umgangen. Das neue Konzept ersetzt weder geprüfte Buchhaltungsregeln noch bestehende funktionierende Endpunkte durch Designentwürfe.

**Ablage:** Später als zusätzliches kanonisches Dokument in `docs/architecture/` einordnen, zurzeit lokal erstellt; es wird **nicht** automatisch im GitHub-Repository gespeichert. Vor der tatsächlichen Codex-Nutzung Iststand und parallel integrierte PRs neu ermitteln.

**Explizit abgelöste ältere Annahme:** UX-042 sowie ältere Texte zu einem Wechsel zwischen mehreren Unternehmen werden für V25.5 in ihrem Mehrmandanten-Aspekt ersetzt: **ein Benutzerkonto gehört genau einem Unternehmen**. Ein vorhandenes technisches Mandantenmodell/RLS wird nicht abgebaut; bestehende Beziehungen müssen vor einer späteren Migration geprüft werden.

## 1. Produktidentität, Kundengruppen, Umfang

**[B]** Binso One ist eine ausschliesslich auf den Schweizer Markt ausgerichtete B2B-SaaS-Anwendung für Einzelunternehmen und KMU, mit öffentlicher Website, selbstbedienbarer Kunden-App, getrenntem One Admin und optional künftig nativen Apps. Keine öffentliche Registrierung für Verbraucher als primäres Produktziel. Schweizer Sprache, CHF, Schweizer QR-Rechnung und rechtliche Geschäftspflichten sind Teil des Kernprodukts.

- **Öffentliche Website:** erklären, Vertrauen schaffen, Preise vergleichen, kostenlose Testphase beginnen, rechtliche Informationen und Support bieten.
- **Kunden-App:** Arbeitsoberfläche für Unternehmensinhaber, Team und berechtigte Externe; Rechte und Freigaben strikt durchsetzen.
- **One Admin:** eigener Betreiber-/Governance-Bereich; Plattform-Support, Infrastruktur, Verträge, Auditoren und Sicherheitsgovernance ohne pauschales Lesen privater Firmeninhalte.
- **PWA/Mobile:** vollwertiges, touchgerechtes App-Erlebnis; auf Desktop browsergerecht. Spätere native iOS-/Android-Clients nutzen denselben Backend-Berechtigungsvertrag, nicht unabhängige Geschäftslogik.

**Nicht behaupten:** rechtskonforme Lohnabrechnung, automatische Bankanbindung, automatische Mahnzustellung, Web Push, SSO oder native App-Verfügbarkeit, solange nicht nachweislich implementiert, vertraglich geklärt und abgenommen. Keine erfundenen Produktversprechen auf Landingpage, Pricing oder E-Mails.

## 2. Lebenszyklus-Überblick und übergreifende Invarianten

```
Öffentlich → Registrierung beantragt → E-Mail bestätigt → Konto gesichert
  → Firma grundlegend eingerichtet → Trial aktiv → Team / Module / Geschäftsvorgänge
  → kostenpflichtiger Abschluss optional → Abonnement aktiv
  → normal / Rechnung ausstehend / eingeschränkt / gekündigt / reaktiviert
  → Datenexport → Archivierung → geprüfte Löschung
```

Ein getrenntes System von Zuständen gilt für **persönliche Identität**, **Firmenmitgliedschaft**, **Firmenkonto**, **Abonnement**, **Fachobjekt**, **Gerät/Sitzung**, **Sicherheitsrisiko** und **Liefer-/Zahlungsversand**. Ein Wort wie „gesperrt“ darf nicht verschiedene Ursachen vermischen. Zustandswechsel sind atomar, idempotent, rollenbegrenzt und auditierbar. Weder ein visueller Klick noch ein Timeout allein stellt eine bestätigte externe Zustellung oder Zahlung dar.

Globale Regeln:
1. Ohne aktive Identität, gültige Mitgliedschaft, passende Rolle, individuelle Modulerlaubnis, Tarifberechtigung und Datenscope keine Aktion. **Default deny** bei unbekannter Berechtigung; bestehende Nutzerrechte bei Migration explizit und nachvollziehbar abbilden statt pauschal neue Rechte zu vergeben.
2. Eine Person kann nur eine aktive Firmenmitgliedschaft pro Binso-One-Benutzeridentität besitzen [B]. Keine Firmenauswahl und keine zweite Firmenmitgliedschaft über Einladung; separate E-Mail/Konto für anderes Unternehmen. Das physische Datenmodell muss trotzdem Mandantentrennung und RLS erzwingen.
3. Jede kritische Änderung benötigt Berechtigung, bei Bedarf frische starke Authentifizierung, Begründung, Revision/Konflikterkennung und unveränderliches Audit.
4. Persönliches Konto, Benutzer-Mitgliedschaft, Mitarbeiterakte, Kundenkontakt, Kunde, Firmenkonto, Abonnement und One-Admin-Betreiberidentität sind eigenständige Entitäten.
5. Angelegte Belege, Genehmigungen, verrechnete Stunden, Buchungs- und Dokument-Snapshots werden nicht heimlich überschrieben. Korrektur über versionierte Anpassung, Storno/Gutschrift oder nachvollziehbare Berichtigung.
6. Jede automatisierte Aktion besitzt Trigger, Rolle/Policy, Schutzbedingungen, Wiederholschutz, Zustellnachweis, Konfliktbehandlung, Eskalation und Stoppbedingung.

## 3. Öffentliche Website, Landingpage und Conversion

**[B/V]** Öffentliches Marketing verwendet Original-Binso-Branding, Microsoft-inspirierte freigegebene Oberfläche; kein zweites Designsystem. Gleiche fachliche Quelle für Landingpage, Produkt, Preise, Test-/Registrierungsbedingungen und Abonnement-UI. Sichtbar stets „Auftrag“ statt gemischtem „Projekt“ (technische `/projekte`-Routen dürfen intern bleiben).

**Informationsarchitektur:** Start, Produkt, Funktionen, Preise und Tarifvergleich, Sicherheit/Datenschutz, Hilfecenter/Kontakt, Anmelden, Kostenlos testen, Impressum/AGB/Datenschutz/DPA/Unterauftragsbearbeiter. Keine Scheinfunktionen, falschen Bewertungen, nicht belegte Gütesiegel oder falschen Rabatt-/Verfügbarkeitsdruck.

**Startseiten-Reihenfolge [S]:** Nutzenversprechen für Schweizer KMU → primäre CTA „14 Tage kostenlos testen“ → echte Produktbilder/Interaktion mit klarer Demo-Datenkennzeichnung → 3–5 Kernprobleme/Kernnutzen → „Kunde → Angebot → Auftrag → Leistung → Rechnung → Zahlung“ → die drei Tarife und Vergleichslink → Web/Desktop/Mobile/PWA → Sicherheit und Standortinformationen ohne nicht belegte Garantien → häufige Fragen/Support → Abschluss-CTA → Footer mit Rechtsseiten.

**[B] Öffentliche Demo entfernen:** Keine frei zugängliche `/demo`-Session als Conversion-Hauptweg; keine toten Links mehr in Login, Landingpage oder Marketing. Interne isolierte Testfixtures, QA-Zugänge und App-Review-Konten bleiben erhalten, strikt ohne produktive Kundendaten. Kein kostenloses Konto verlangt Kreditkarte. Tests/Nutzung mit eigenen Daten beginnen nach Registrierung.

**CTA/Preise:** Auf jeder öffentlichen Seite nur wirklich benötigte Primäraktion; keine manipulativen Opt-ins. Sprachvarianten `de-CH`, `fr-CH`, `it-CH`, `en` und `tr` nur so weit gepflegt wie tatsächlich unterstützt; fehlende Übersetzungen nicht durch falsche Inhalte ersetzen. SEO, semantische Überschriften, strukturierte Daten, Consent-Management und OpenGraph aus einer zentralen Quelle. Keine öffentliche Indexierung privater Bereiche.

**Lead-/Supportfälle:** Testanmeldung abgebrochen; E-Mail nicht zugestellt; Preis aus Link übernommen und später geändert; Registration auf Mobile begonnen und am Desktop abgeschlossen; mehrfacher Klick; Cookie-Einwilligung widerrufen; Marketing ohne Tracking muss weiter funktionieren; Nutzer hat Leseschwierigkeiten/Zoom 200 %.

## 4. Firmenregistrierung und zulässige Identitäten

**[B]** Private E-Mail-Adressen sind zugelassen, aber **E-Mail-Besitz belegt nicht Firmenvertretung**. Schweizer Unternehmens- oder selbstständige Erwerbstätigkeit ist Produktziel; UID optional je Rechtsform, soweit nicht für bestimmte Funktionen zwingend. Kein hartes „nur geschäftliche Domains“ und keine automatische Firmenverifikation nur durch Firmenname.

### 4.1 Registrierungsschritte [S]

1. Tarif/Laufzeit nur als **unverbindliche Vorauswahl**; Testphase und spätere Bezahlung eindeutig erklären.
2. Firma: Name, Rechtsform nur soweit sinnvoll, Vor- und Nachname des primären Kontakts (strukturierte Felder), E-Mail, Passwort oder unterstützter Passkey-First-Flow; Vertragszustimmungen für die tatsächlich geltenden Vertragsversionen separat nachvollziehen.
3. Serverseitiger eindeutiger Registrierungsauftrag; selbst nach Timeout oder Mehrfachklick kein zweites Unternehmen. Generische Fehlermeldung bei E-Mail-Konflikt zum Schutz der Kontoprivatsphäre; klarer Rückweg Login/Passwort-Reset.
4. Pending-Screen mit sechsstelliger E-Mail-OTP und Link als gleichwertige Wege, Timeout, resend mit Cooldown, zurück zur E-Mail-Anzeige und Korrektur nur über sichere Neuverifikation. Link auf anderem Gerät darf **keine Session im ursprünglichen Gerät ohne Prüfung** erstellen; dort Status aktualisieren und bei Bedarf neu anmelden.
5. Trial beginnt verbindlich nach erfolgreich abgeschlossener E-Mail-Verifikation, **einmalig je zulässigem Testfall**; keine rückwirkenden Kurzschlüsse durch mehrfaches OTP oder Einladungen. Sicherheits- und Abbruchzustände auditieren.
6. Owner-Sicherheit: obligatorische starke Anmeldung (Passkey gemäss geprüfter Policy oder Passwort+TOTP); Recovery-Wege anbieten. Ohne abgeschlossene Pflichtprüfung sind normale Arbeits-APIs gesperrt.
7. Firmen-Minimal-Onboarding, anschließend rollenbezogene Übersicht; weitergehende Daten werden progressiv erhoben, Rechnungs-/Versandfunktionen besitzen fachliche Readiness-Prüfungen.

**Gates:** Selbstständige ohne Handelsregistereintrag [S] zulassen; Missbrauchs-/Dublettenheuristik und Betreibereskalation [G]; Anforderung an vertretungsberechtigte Person und Identitätsprüfung bei risikoreichen Vorgängen [G]. Unbekannte Sicherheitsrisiken dürfen keine Kontoübernahme verursachen.

### 4.2 Bestehende E-Mail / Einladungsfall

Der Versuch, ein zweites Unternehmen mit schon bestehender Login-E-Mail zu registrieren, erzeugt **keinen** zweiten Unternehmenszugang [B]. Optional getrennte Konten nur mit anderer E-Mail. Einladungen an eine bereits fremd gebundene E-Mail werden vertraulich und nachvollziehbar abgelehnt, nicht still an fremde Firma gebunden. Eine neue Firmenidentität darf einen bestehenden User nicht durch opportunistisches „Upsert“ ersetzen.

## 5. Unternehmens-Onboarding und erstes erfolgreiches Nutzungserlebnis

**[S]** Ein kurzer Wizard/Checkliste mit belastbaren Statuswerten statt einmaliger grosser Pflichtdatensammlung:

| Schritt | Wer | Pflicht für Fortschritt | Kann später ergänzt werden |
|---|---|---|---|
| 1. Konto/E-Mail | Inhaber | Verifiziert, Bedingungen | Profilfoto |
| 2. Konto sichern | Inhaber | starke MFA gemäss Rolle, Recovery-Hinweis | zusätzlicher Passkey, soweit Policy erfüllt |
| 3. Unternehmensprofil | Inhaber | Firmenidentität, Schweizer Land und erforderliche Basisdaten | Logo, Website, optionale UID |
| 4. Module & Arbeitsweise | Inhaber | gewählte Tarifberechtigung, sinnvolle Defaults | Anpassung von Stundensätzen, Freigaben |
| 5. Erste reale Aufgabe | Inhaber | eine passende Aktion, z. B. Kundenkontakt | alle anderen Module |
| 6. Rechnungsfähigkeit | Inhaber/Finanzen | valide Geschäftsdaten, Zahlungs-/QR-Daten, MWST-Klärung vor Ausstellung | nicht benötigte Zusatzfelder |

Kein unnötiger Onboarding-Neustart nach Reload, Gerätewechsel oder späterem Rollenwechsel. Fortschritt auf Server und mit Revisionsschutz speichern. Eine später nachzutragende Einstellung erzeugt einen kleinen kontextuellen Hinweis **nur beim betroffenen Vorgang** und keinen irreführend „erfolgreichen“ Rechnungsversand. Testbenutzer können ohne vollständig eingerichtete Bankverbindung beispielsweise Kunden anlegen und eigene Stunden erfassen, aber keine ungültige QR-Rechnung ausstellen.

Abbrüche, ungültige Formulare, Serverfehler, zu langsame E-Mails, ungültige IBAN/QR-IBAN, inaktive Rechnungsnummernkreise, geänderte Vertragsversionen und vorübergehend fehlende externe Dienste sind eigenständig definiert. Ein Wizard-Schritt erhält **ein** Formular-/Save-Owner; keine parallelen Speicherwege.

## 6. Identität, Login, Passkeys, Passwort, MFA

**[B]** Bevorzugte moderne Anmeldung über WebAuthn/Passkeys und gerätelokale Bestätigung (Face ID/Touch ID/Windows Hello/Android). Private Biometriedaten verlassen das Gerät nicht. Serverseitig signierte Herausforderungen prüfen, gültige RP-ID, Origin, User Verification, Challenge-Freshness, Replay-Schutz, eindeutige Credentials und Credential-Revoke. Eine „Face ID“-Beschriftung nur anzeigen, wenn das Gerät diese konkrete Fähigkeit tatsächlich bietet; sonst neutral „Mit Passkey anmelden“.

**Fallback:** Passwort (mindestens bestehende Sicherheitsanforderungen) + authentifizierter zweiter Faktor; bei Owner/Admin/Finance Pflicht unabhängig von Opt-in. TOTP-Enrollment mit QR-Code, auf demselben Telefon Schlüssel kopieren oder `otpauth://` öffnen, 6-stelligem Bestätigungscode, geheimem befristetem Setup und einmalig sichtbaren Recovery-Codes. Secret niemals in Logs, Analysen oder externen QR-Bildgeneratoren; QR vollständig lokal bzw. auf eigenem Server generieren. Abbruch, Resend und invalid code ohne Exposure.

**Sicherheitsregel [S/G]:** Verifizierte Passkeys mit User Verification sind phishingresistent und können nach expliziter Freigabe in der privilegierten Policy eine starke Anmeldemethode bilden. Bis dahin bestehende MFA-Serverkontrollen nicht still lockern. Neue Passkeys nur nach frischer starker Authentifizierung, Sicherheitsmail und Audit. Authenticator kann nicht per trivialem Toggle entfernt werden.

**Login-Zustände:** unbekannte Identität; Passwort falsch; E-Mail nicht bestätigt; TOTP erforderlich; Passkey verfügbar/nicht verfügbar; Recovery-Code; Konto deaktiviert; Sicherheitsprüfung; Firma read-only; Provider-/Netzausfall; ältere App-Version nicht kompatibel. Keine Kontenaufzählung. Rate limiting gestaffelt pro Login-/IP-/Signal, keine einfache Sperrmöglichkeit für Angreifer durch absichtlich falsche Passwörter.

**Passwort-Rücksetzung:** generische Antwort; kurzlebiger One-Time-Link; Passwort neu wählen; Sicherheitsmail; vorhandene Sessions widerrufen; privilegierte Recovery darf nicht durch Kontrolle nur der E-Mail den zweiten Faktor vollständig ersetzen. Verknüpfte Passkeys bleiben als separate Credentials bis zu gesondert geprüfter Rotation/Revocation gültig; Schutz vor Session-Fixation.

**Login-E-Mail ändern [S]:** nur mit frisch bestätigtem starken Faktor, Eigentumsnachweis für **neue** Adresse, Benachrichtigung an alte Adresse, Konfliktprüfung (ein User/eine Firma), gegebenenfalls Sicherheitsverzögerung und Möglichkeit des Widerrufs eines unautorisierten Antrags. Keine Änderung über gewöhnliches Profil-PATCH.

## 7. Konto-Wiederherstellung und Firmeninhaber-Notfallzugang

Reihenfolge: anderer Passkey/Sicherheitsschlüssel → alternativer vertrauenswürdiger Authenticator → Recovery-Code + verbleibender unabhängiger Nachweis → dokumentierter Hochrisiko-Recovery-Prozess. Mindestens zwei unterschiedliche Wiederherstellungswege beim Inhaber-Onboarding empfohlen; bei Privilegierten abgenommene Recovery-Policy erforderlich. Keine biometrischen Daten im Binso-Server.

**Vollständiger Verlust:** Annahme des Antrags mit generischer Rückmeldung, zusätzliche Unternehmensvertretungsnachweise, Prüfung der tatsächlichen Situation, Betrugs-/Duplikatprüfung, unabhängig von Einreichenden durch **zwei berechtigte Betreiberprüfpersonen** bei Owner-Recovery, Out-of-band-Benachrichtigung an bestehende vertrauenswürdige Kanäle, risikobasierte Wartefrist als Vorschlag (z. B. 48 h, **kein still freigegebener Produktwert**), befristete Sperre sensibler Aktivitäten, evidenzbasierte Entscheidung, frische Session und Erneuerung betroffener Faktoren, Audit und Widerruf alter kompromittierter Tokens. Kein Einzel-Supporter setzt MFA/Owner auf Zuruf zurück. Notfall falls nur ein Platform Owner verfügbar: Prozess **blockiert** und dokumentierte unabhängige zweite Kontrollinstanz organisieren, kein Self-Approval.

## 8. Sitzung, Gerät, Logout und Sicherheitsüberwachung

- Authentifizierte Sessions als serverseitig prüfbare, widerrufbare Tokens; HttpOnly/Secure/SameSite; Ablauf und Rotation nach Sicherheitsereignis; CSRF-, Reauth-, Origin-, XSS- und Session-Fixation-Schutz. Sessionaktualisierung nie mit fremdem Mandantenkontext.
- „Abmelden“ beendet die aktuelle Sitzung; „Alle anderen Geräte abmelden“ widerruft alle fremden aktiven Sessions; „Konto sperren“ serverseitig alle Sessions + neue Anmeldungen blockieren; „Benutzer deaktivieren“ schliesst Firmendatenzugriff sofort.
- Mobile PWA/native Offline-Abmeldung schützt lokale Daten sofort, bei nächster Verbindung Serverrevocation prüfen; sensible Kundendaten nicht unnötig lokal persistieren. Neue Firmen-/Nutzeridentität invalidiert alle Cache-Keys, Dateien, Suchergebnisse und Pending Requests.
- Geräteinventar: verständlicher Gerätename, letzter Aktivzeitpunkt, aktuelles Gerät, ungefähre Umgebung nur wenn zuverlässig; keine angebliche GPS-Position. Einzelne Session entfernen, keine Auslieferung vertraulicher IPs an alle Rollen.
- Sicherheitsereignisse: neue Passkeys, Passwort-Reset, MFA-Rotation, ungewöhnliche Anmeldung, Reauth-Fehler, Account Lock, unberechtigte Rollenänderung, Billing-Bank-Änderung, Owner-Transfer, Datenexport, Löschantrag. Gezielte E-Mail + In-App-Audit, Push nur nach implementierter Zustellung; kritische Security-Mails nicht über Marketing-Toggle deaktivierbar.
- Risiko: abgestuftes Rate-Limiting, Session-Revoke, Step-up-Auth und temporäre Aktionssperre. Keine pauschale dauerhafte Login-Sperre nach wenigen Fehlern. Höherrangige Aktionen erhalten frische starke Authentifizierung, Server-Autorisierung, Vier-Augen-Prüfung wo festgelegt.

## 9. Ein Benutzerkonto – ein Unternehmen: Datenmodell und Wechselregeln

**[B]** Für V1 gehört eine Login-Identität zu genau einem Unternehmen. **Keine** UI-Firmenauswahl, keine zweite aktive Mitgliedschaft, keine automatische Zusammenführung von Konten oder Cross-Tenant-Sessions. Firmenwechsel ist ein späterer **manuell geregelter Lebenszyklus**: bisherige Mitgliedschaft beenden und prüfen, welche geschäftlichen Daten erhalten bleiben; neue Einladung auf neuer E-Mail/Konto oder später separat entworfenes Migrationstool. Die technische Datenbank darf dennoch die jetzigen Mehrmandantengrenzen, `organization_id` und RLS besitzen. Migration vorhandener mehrfirmenfähiger Identitäten erfordert Vorabdatenanalyse, Kundenkommunikation und separate Freigabe; niemals pauschal Einträge löschen.

## 10. Benutzer, Einladung und personalbezogener Lebenszyklus

**Unterscheidungen:** Benutzerkonto (Login + Profilsicherheit), Unternehmensmitgliedschaft (Rolle und Modulerlaubnis), Mitarbeiterakte (Beschäftigungsdaten, HR/Lohn), fachliche Zuweisung (Kunde/Auftrag/Zeiten), Supportfall (nicht automatisch Vollzugriff).

**Einladung:** Owner oder berechtigte Teamverwaltung wählt E-Mail, Rolle, Modulgrants und Datenbereich; sofern Personalakte existiert, Verknüpfung eindeutig prüfen; nur innerhalb der Tarifgrenzen und Rollenobergrenzen. Einladung hat Status `pending → accepted/expired/revoked`; aktive Einladung bei Wiederholung idempotent. Neu-User bestätigt E-Mail via signiertes Einmal-Token und setzt Passwort/Passkey; bestehendes Konto derselben Firma meldet sich stark an und bestätigt; fremde Firmen-E-Mail wird ohne Kontenzuordnung zurückgewiesen. Versendete Einladung darf nicht fälschlich „angenommen“ heissen, wenn erst Zustellung bestätigt ist.

**Mitarbeiter-Onboarding:** nur Profil, Passkey/MFA soweit erforderlich, Datenschutz-/Arbeitsanweisungen, zugewiesene Funktionen; **keine** Unternehmensabrechnungs-/IBAN-Onboarding-Schritte. Nach Login direkt in berechtigtes Dashboard. Zeiterfassung-only: persönlicher Timer, eigene Einträge, Einreichen, Status, zugewiesene Kunden-/Auftragsnamen nur als minimale Picker-Daten, eigenes Profil/Sicherheit/Support; keine allgemeinen Kunden-/Auftrags-Dossiers, fremde Zeiten, Finanzen oder HR.

**Austritt:** `geplant → Übergaben offen → effektiv deaktiviert → historisch gesichert`; geplantes Datum/sofortige Sicherheitssperre; laufenden Timer sichern, ungeklärte Stunden und Spesen zuordnen; Delegationen und Genehmigungsschlangen übertragen; Sessions, API-Schlüssel, Passkeys/entsprechende Firmensessions und Gerätezugriffe entziehen; Unternehmensdaten und buchungspflichtige Geschichte erhalten; Mitarbeiterakte nach separatem Aufbewahrungsplan. Wiederanstellung als **neue aktive Beschäftigungsperiode** statt stille Überschreibung alter Historie.

**Rollenwechsel:** nur autorisiert, keine Selbstbeförderung; zeitlich atomar mit Token-/Cache-Effekt; Betroffenen und ggf. Owner informieren. Neue Rolle darf nicht implizit mehr individuelle Rechte als im definierten Grant-Profil geben; bei Herabstufung sofortiger Rechteentzug inklusive direkten URLs/Download-Links. Ein deaktivierter Benutzer darf nicht über alte QR-, Upload- oder Such-Endpunkte zugreifen.

## 11. Eigentümerschaft, Inhabertransfer und Firmenauflösung

**[S]** Jeder aktive Firmenmandant hat mindestens **einen** gültigen verantwortlichen Inhaber. Der letzte Owner kann weder sich selbst herabstufen noch deaktiviert oder gelöscht werden, bevor ein sicherer Transfer oder vollständiger Schliessungsprozess erfolgt. Im Zielmodell pro Firma ein primärer Owner; ergänzende verwaltende Personen können delegierte Rollen besitzen, aber keine unkontrollierte Eigentümerschaft.

**Transfer:** Initiierender Owner mit frischer starker Authentifizierung → bereits aktiven, geprüften Empfänger derselben Firma auswählen → Empfänger bestätigt separat → Änderungen an Zugriff, Billing-Kontakt und Sicherheit prüfen → atomar transferieren, mindestens einen aktiven Owner garantieren → bisherige Privilegien anpassen → beide und Security-Kontakt benachrichtigen → Audit (alter/neuer Verantwortlicher, Datum, Grund) → erneutes Login. Kein Admin darf Ownerrechte durch normales Rollenmenü vergeben. Notfall/Erbschaft/Nichterreichbarkeit: getrennte hochsichere Recovery-Policy [G], juristische und betriebliche Prüfung, Vier-Augen und Audit.

**Schliessung:** Firmenkündigung, Firmenarchiv und Datenlöschung sind unterschiedliche Aktionen. Keine vollständige Löschung bei Kündigung des Saas-Abos oder beim Ausscheiden eines Mitarbeiters. Firmenarchivierung sperrt neue Geschäftsvorgänge und bereitet Export/Löschfristen vor; gültige rechtliche Aufbewahrung und offene Abrechnung bleiben berücksichtigt.

## 12. Rollen-/Berechtigungs-/Delegationsmodell

| Rolle | Primärer Arbeitsbereich | Darf grundsätzlich | Dürfen nicht pauschal |
|---|---|---|---|
| Inhaber (`owner`) | Firmen-Dashboard, Finanzen, Handlungsbedarf | Unternehmen, Team, Abo, Prozesse innerhalb Tarif und Schutzrichtlinien | Self-Approval, Vier-Augen-Gates umgehen |
| Administrator (`admin`) | Geschäftsverwaltung | ausdrücklich delegierte Administration/Module | Owner wechseln, Billing schreiben ohne gesonderte Freigabe, Self-Privilege |
| Finanzen (`finance`) | Rechnungen, Zahlungen, Finanzkontrolle | buchhalterisch/fachlich erlaubte Zahlungen/Abrechnungen | automatisch HR-/Zeitfreigabe ohne extra Recht |
| Personal (`hr`) | Mitarbeiter/Abwesenheiten | HR-Dossier, erlaubte Abwesenheits-/Lohnfunktionen | Kundenzahlungen, globale Finanzdaten ohne Recht |
| Auftragsleitung (`project_manager`) | eigene Aufträge, Freigabeschlange | zugewiesene Aufgaben, unabhängige Prüfungen | unzugeordnete Teams, eigene Freigabe, gesamte Bankdaten |
| Mitarbeiter (`member`) | persönliche Arbeit | erlaubte Module und eigene/zugewiesene Datensätze | fremde Mitarbeiter/Finanzen/Teamverwaltung |
| Lesen (`reader`) | freigegebene Übersichten | explizit erteilte Leserechte | Schreib- oder Exportrechte ohne separate Freigabe |
| One Admin Rollen | getrennte Betreiber-App | Governance, Support, Billing, Auditor-Scopes | pauschalen Tenant-Inhalt oder ungeprüfte Owner-Übernahme |

**Effektives Recht:** `session_active ∧ user_active ∧ exactly_one_membership_active ∧ org_status_allows ∧ plan_module_enabled ∧ role_ceiling ∧ individual_grant ∧ record_scope ∧ object_state ∧ step_up_policy`. Jeder dieser Terme wird serverseitig geprüft; rollenfreundliche UI ist nie alleiniger Zugangsschutz. Rechte separat für `read`, `create`, `update`, `submit`, `approve`, `send`, `pay`, `export`, `archive`, `delete`, `manage`. Kontextscopes `own`, `assigned`, `team`, `organization`. Privileged Actions mit konkreter fachlicher Berechtigung. Rechteentzug mid-request/Session/Tab/Download mit negativen Tests.

**Grant-Migration [G]:** Rollentypen behalten ihren bestehenden maximalen Rechtebereich. Neue granulare Profile erteilen nicht versehentlich mehr Rechte. Bisherige aktive Nutzer werden nach ermitteltem Ist auf ein **explizites kompatibles** Profil gemappt, niemals mit breitflächigem Wildcard-Grant „für alle“. Administrierbare Rechte sind durch Tarif und Rollendelegation begrenzt.

## 13. Profile, Firmen-, Team- und Moduleinstellungen

**Profil (selbst):** angezeigter Name, Profilbild, persönliche Telefonnummer, Sprache, Theme, Benachrichtigungen, Passwort, Passkeys/MFA, registrierte Geräte, persönliche Datenanfragen. Login-E-Mail nur durch verifizierten Sicherheitsablauf. HR-offizieller Funktionsname/Anstellung/Lohn werden nicht durch freies Profil-PATCH geändert. Besitzer und Team-Admins sehen keine persönlichen Passwörter, Recovery-Secrets, Biometriedaten.

**Unternehmen (berechtigte Rollen):** rechtliche Identität, CH-UID/Adresse/Kontakt, Logo, Sprache/Branding, Bank-/QR-IBAN, MWST, Nummernkreise, Dokument- und E-Mail-Texte, Zahlungsbedingungen, Kunden-/Auftragsdefaults, Zeit/Spesen-/Freigaberegeln, Team und Rollen, Modulkonfiguration, API/Integrationen, Abo/Zahlung, Security/Berechtigung/Governance. **Firmensichtbarkeit ≠ Bearbeitungsrecht**. Sensible Bank-/Billing-Änderungen verlangen frischen starken Faktor, alte/neue Werte im Audit redigiert, geeignete Vier-Augen-Prüfung [G].

**Bedienung:** Boolesche Optionen als zugängliche Toggles, die tatsächlichen Status darstellen; Aktionen/Senden/Bestätigen als Buttons; Mehrfachoptionen als Select/Radio. Für risikoreiche Toggles separater Bestätigungsdialog mit Konsequenzen. Nur funktionierende Kanäle/Module als aktiv anbieten. Änderungen erhalten einheitliches Lade-, Fehler-, Erfolgs- und Wiederherstellungsverhalten.

## 14. Drei SaaS-Tarife und zentrale Entitlements

**[B]** Bestehende Preisstruktur unverändert: Start CHF 29/Monat, CHF 290/Jahr; Business CHF 69/Monat, CHF 690/Jahr; Pro CHF 129/Monat, CHF 1290/Jahr. Preise ohne Änderung, Schweizer MWST nach tatsächlicher Rechtslage und Checkout-Konfiguration. Tarife als **eine** verlässliche Produktquelle für Marketing, Registrierung, Datenbank-Entitlements, Server-APIs, Navigation, Up-/Downgrade und One Admin; vorhandene konkurrierende Preis-/Limitquellen gezielt konsolidieren.

| Paket | Benutzerzahl | Kernfunktion / Abgrenzung |
|---|---:|---|
| Start | höchstens 3 | Kunde, Kontakt, Angebot, **Auftrag**, Zeit, Spesen-Grundlagen, Rechnung, Zahlung, Basisberichte |
| Business | höchstens 15 | alles aus Start plus Mitarbeiter/Abwesenheiten, Lieferanten, Einkauf, Produkte, erweiterte Finanz-/MWST-Funktionen entsprechend tatsächlich vorhandenen Modulen |
| Pro | keine feste Benutzerobergrenze | alles aus Business plus **eigenständige Dokumentenverwaltung**, Verträge und weitere einzeln geprüfte Features |

**[B] Pro-„unbegrenzt“:** keine aus Marketing verschleierte Grenze 10'000 Benutzer. Technische Missbrauchs-/Sicherheitslimits bleiben getrennt und dürfen kein widersprüchliches verstecktes Tarifmaximum werden. **Start-Aufträge** vollständig verfügbar; **Pro-Dokumente** betrifft nur allgemeine Dokumentenverwaltung, nicht notwendige Anhänge, Belege, Rechnungs-/Angebots-PDFs in Start/Business. Keine bestehenden Kundendaten oder Belege bei Downgrade entfernen. Planlimits anderer Dimensionen (Speicher, Dokumentenzahl, API usw.) gesondert überprüfen und klar ausweisen [G], nicht als bereits freigegebenes neues Preisprodukt ausgeben.

**Tarif-/Moduleigenschaften** wie „vollautomatischer Bankabgleich“, „Lohn-Demo“, „API“, „erweiterter Audit“, „priorisierter Support“ erst versprechen, wenn tatsächlich funktional, lizenziert, abgesichert, kostenmässig und in allen betroffenen Kanälen verfügbar. Pro unterliegt derselben Mandantenisolation, Audit und Security wie Start.


## 15. Trial, kostenpflichtiger Abschluss, Verlängerung, Kündigung und Zahlungen an Binso

**Zwei streng getrennte Zahlungen:** (A) der Kunde bezahlt sein **Binso-One-SaaS-Abo** an Binso via Stripe; (B) dessen Endkunden bezahlen **Geschäftsrechnungen des Unternehmens** via Schweizer QR-/Bankzahlung. Niemals Provider-Zahlungszustände oder Datenbanktabellen beider Prozesse still vermischen. Ein SaaS-Abo-Webhook macht keine Kundenrechnung bezahlt und umgekehrt.

### 15.1 Trial-Lebenszyklus [B/S]

`registration_pending → email_verified → trial_active → converted_to_paid | trial_expired_read_only | trial_ended_early`.  
**[B]** 14 Tage kostenlos, keine Kreditkarte erforderlich, keine automatische Kostenfolge nur durch Registrierung. **[S]** Exaktes Startdatum ist das erste erfolgreiche E-Mail-Verifikationsevent; Dauer 14 × 24 Stunden, UTC speichern und in `Europe/Zurich` lesbar anzeigen. Retry/OTP-Reuse darf Startzeit nicht verschieben. Wer eingeladen wird, beginnt keine neue Unternehmens-Testphase.

**Trial Tag 1:** funktionierende App, klarer Status, nur notwendige Onboarding-Schritte.  
**Tag 7 [S]:** sachlicher Halbzeit-/Nutzungshinweis optional, kein aufdringlicher Modal-Zwang.  
**Tag 11 [S]:** Hinweis „noch 3 Tage“, nur einmal pro relevanter Stufe und zugestellten Kanal.  
**Tag 13 [S]:** klare Fristinformation und jederzeit sichtbarer Abo-Einstieg.  
**Tag 14:** Ende exakt bei `trial_end_at` unabhängig von E-Mail-Zustellung; abgelaufene unbezahlte Testkonten wechseln serverseitig zu `read_only`, können aber zulässige persönliche Sicherheit, Support, Billing und rechtlich/fachlich freigegebenen Export verwenden. Keine falsche Resttage-Anzeige.

**Test vorzeitig beenden [S]:** eigener Menüpunkt „Testphase beenden“ mit Bestätigung. Keine „Kündigung“ eines nicht abgeschlossenen entgeltlichen Vertrags behaupten. Zugang wechselt zur vereinbarten eingeschränkten Ansicht; Firmenlöschung/Export sind gesonderte Vorgänge. Bei abgelaufener Testphase ist keine Zahlung fällig, solange niemand ausdrücklich einen kostenpflichtigen Vertrag abgeschlossen hat.

### 15.2 Trial → Abo, vor / am / nach Ende

| Auslöser | Zielregel |
|---|---|
| Während Trial Plan wählen | Plan/Laufzeit, Preis, MWST, Beginn und allfälligen zukünftigen Zahlungstermin transparent zeigen |
| Kunde verpflichtet sich während Trial | **[S/G]** restliche kostenlose Tage erhalten; erstes kostenpflichtiges Leistungs-/Belastungsdatum nach Trialende, sofern Stripe-Konfiguration und Vertragsgestaltung das verifiziert abbilden. Keine stillschweigende sofortige Belastung; wenn nicht implementierbar, **Checkout blockieren und vorab Freigabe verlangen**, nicht heimlich anders abrechnen |
| Nach Trialende Checkout starten | Sofortiger bezahlter Start nach explizitem Abschluss und Providerbestätigung |
| Checkout abgebrochen | Trial/read-only unverändert; keine Behauptung „Abo aktiv“ |
| Stripe-Zahlung fehlgeschlagen | `payment_pending` oder `past_due` mit sachlichen nächsten Schritten und gültiger Grace-Policy; kein erfundener Erfolg |
| Stripe bestätigt verzögert | Status `activation_pending`, signierten Event/Provider-Datensatz reconciliieren; keine doppelte Belastung, kein ewiger Spinner |
| Mehrfacher Checkout-Klick | Idempotency-Key, genau ein gültiger Abostart |
| Provider-Event doppelt/verspätet | atomare idempotente Verarbeitung, älteres Event darf gültigen neuen Zustand nicht zurückrollen |

**[G]** Konkrete Stripe-Testphasen-/Billing-Zeitplanung, frühzeitige Pre-Authorization, Steuer-/Preisverhalten und AGB-Fristklausel müssen mit Live-/Test-Provider, Produkt und Legal geprüft werden. Erst danach Aktivierung/Anrechnung produktiv freigeben.

### 15.3 Bezahltes Abo

`active → period_renewing → active | past_due → grace/read_only → resumed | cancelled_at_period_end → expired`. `suspended` (Sicherheits-/Governancesperre) getrennt von `past_due` und `read_only`. Vertragslaufzeit Monat/Jahr, Rechnungen/MWST aus Stripe; Zahlungssignal nur von verifiziertem Provider und externem Event. Zahlungsmittel auf Stripe, keine Kartendaten in Binso DB.

- Kündigung: Owner oder explizit Billing-berechtigter User startet sie über korrekt zugeordnetes Stripe-Kundenportal; vor Bestätigung Ende der bezahlten Periode und Konsequenzen zeigen. Kein vorzeitiger Verlust bereits bezahlter Leistung ohne rechtlichen Grund. Status `cancel_at_period_end` sichtbar, Rücknahme falls Stripe unterstützt.
- Wechsel/Upgrade: Preis-/Restlaufzeit-/Proration vor Bestätigung, Vertragssnapshot; bei Downgrade Module read-only, Daten bleiben erhalten. Nutzer über betroffene Grenzen vorab informieren; keine implizite Benutzerdeaktivierung oder Dateilöschung.
- Zahlung fehlgeschlagen: Provider Retry/Grace-Regeln und Benachrichtigungen, belastbare Restfristen, deduplizierte Meldungen, manuelle Klärung und Reaktivierung. Keine automatische, nicht bestätigte Provider-Mahnung erfinden.
- Rechnungsdownload für Binso SaaS: aus Stripe, niemals mit B2B-Endkunden-Rechnungen des Mandanten verwechseln.
- Eigentümer-/Firmenlöschung bei laufendem Vertrag: Billing separat beenden oder freigegebenen Kündigungspfad anbieten; niemals Konto löschen und Stripe-Autoabbuchung unbeabsichtigt weiterlaufen lassen.

### 15.4 Billing-Zuständigkeitsmatrix

Owner: Planwahl, Abschluss, Änderungen und Kündigung; Admin: lesen, Änderungen nur explizit delegiert und nicht über eigenen Autorisierungsrahmen; Finance: Rechnungsinformationen lesen, zahlen/ändern nur bei ausdrücklicher Billing-Verwaltungsberechtigung; Personal/Member: keine Rechnungs- oder Zahlungsdetails der Binso-Gesellschaft. One Admin Billing: Support/Abgleich und Ausnahmeprüfung ohne eigenmächtige ungeprüfte Vertragsänderung.

## 16. Ende der Nutzung, Export, Archiv, Reaktivierung, Löschung

Drei voneinander unabhängige Datenkontexte: **Person** (Login/Security), **Unternehmen** (Tenant-Fachdaten), **Betreiber** (Binso-Compliance, SaaS-Forderungen/Audits). Ein deaktivierter Mitarbeiter oder gekündigter SaaS-Vertrag löscht keine Geschäftshistorie.

| Phase | Anzeige und Zugriff | Datenhandlung |
|---|---|---|
| Test aktiv | alle tariflich erlaubten Funktionen | normal |
| Test beendet/abgelaufen | lesend + Support/Billing/Sicherheit/Export gemäss Policy | keine neue belastende Geschäftsbuchung |
| Abo aktiv | normale Rechte | normal |
| Abo gekündigt, bezahlte Zeit verbleibt | bis Periodenende weiterarbeiten | normal, wenn sonst keine Sperre |
| Nach Vertragsende | lesend/Export innerhalb kommunizierter Übergangsfrist [G] | Neuanlage gesperrt |
| Archivierung | eingeschränkter Zugriff/Export | gesonderte Archivmarkierung |
| Löschprüfung | kein automatischer Verkauf/Versand | offene Gesetze/Belege/Provider/Blobs/Backups prüfen |
| Endgültige Löschung | nur bestätigte Löschquittung | personenbezogene und tenantgebundene Daten gemäss Rechtslage, abgekoppelt von Bereitstellungs- und Betriebs-Snapshots |

**[G] Zeitrahmen:** Kein fiktiver automatisch gültiger 30-/90-Tage-Löschzeitpunkt. Produktvorschlag für abgelaufene unbezahlte Trialkonten: **90 Tage lesender Export-/Reaktivierungszeitraum**, davor nachweisliche Vorabhinweise; für bezahlte Kündigungen **90 Tage ab Vertragsende** als separat zu vereinbarender Standard. Das ist **keine bereits freigegebene SLA oder juristische Löschfrist**. Rechtsabteilung/AGB/DPA, gesetzliche Belege, Schweizer DSG und Backupzyklen müssen vor Produktivschaltung bestätigt werden. **10 Jahre** Aufbewahrung können auf Geschäftsbücher/Belege anwendbar sein und dürfen nicht mit pauschaler Speicherung aller SaaS-Tenantdaten gleichgesetzt werden. Verantwortlichkeiten zwischen Kunde und Binso vertraglich prüfen.

**Export [S]:** Owner/berechtigter Exportverantwortlicher fordert überprüfbare Voll- oder Modul-Exporte an: Firma, Kunden/Kontakte, Angebote, Aufträge, Zeiten, Spesen, Rechnungen, Zahlungen, Anhänge, Mitarbeiterdaten nur gemäss HR-/Datenschutzrechten, Audit-Auszug soweit zulässig; standardisierte CSV/JSON und Original-PDF/Dateien, Versions-/Schema-Manifest, Beziehungen und referenzierbare IDs, Prüfsummen. Downloads befristet, verschlüsselt und nicht per öffentlichem Link; beim Export auf unzulässige Daten anderer Personen/Unternehmen prüfen. Sehr grosse Exporte als sichere asynchrone Jobs mit Status, Wiederholschutz und Aufräumen.

**Löschung:** separates Recht und unmissverständliche Bestätigung; Exportangebot, Billing-/Rechts-Holds, Aufbewahrungspflichten, Blob-/DB-/Cache-/Backups, Recovery- und Audit-Protokoll berücksichtigen. Geschäftsakten verbleiben nur soweit nötig, andernfalls löschen/anonymisieren. Persönliches Konto kann getrennt gelöscht werden; bei letztem Inhaber vorher wirksame Übertragung oder Firmenabschluss. App-Store-Anforderung „Account deletion“ später auch **in** der nativen App einleitbar machen; nicht nur „deaktivieren“.

**Reaktivierung:** erhaltener Datenstand + serverseitig bestätigtes Abo + aktive Owner-Sicherheit; keine zweite Organisation/neue Nummernkreise durch Reaktivierung. Nach finaler physischer Löschung keine Wiederherstellung behaupten. Im Zustand `read_only` trotzdem berechtigte Datenexport-/Sicherheits-/Supportaktionen zulassen.

## 17. Kunden, Kontakte und 360°-Geschäftsdossier

**[V]** Zwei-Schritt-Kundenerfassung: 1. Pflicht-Firmenname und **Vor-/Nachname** Hauptkontakt, gegebenenfalls kundentypgerecht; 2. optionale Daten. Idempotentes Anlegen beider Datensätze in einer Transaktion. Personen- und Firmenkunden korrekt differenzieren. Dublettenprüfung mit Hinweisen, keine ungeprüfte Zusammenführung; Kontaktaufgaben und Audit. Bestehende historisch unstrukturierte Datensätze dürfen ohne erfundene Kontaktpersonen bearbeitet werden.

**Dossier:** Stammdaten, Kontakte, Angebote, Aufträge, Zeiten nur bei Berechtigung, Rechnungen, Forderungen, Zahlungen, Dateien, Aktivitäten, Kommunikation und Supportverknüpfungen. Jeder Tab nach demselben RLS-/Filter-/Pagination-Vertrag, unberechtigte Felder **nicht** mitschicken. Reale, aktuelle IDs statt Namenssuche für Verknüpfungen. Kunden-inaktiv blockiert neue Geschäfte gemäss Policy, nicht gesetzliche Belege/Historie. Löschung/Anonymisierung nur mit offenen Forderungen, Verträgen, Buchungspflichten und Datenrechten in sauberer Prüfung. Kontakt-E-Mails und Telefonnummern dürfen nicht durch zufällige Freitextzuordnung vermischt werden.

**Negativfälle:** Firmenname doppelt, Kunde in anderem Tenant, archivierter Kunde, Kontakt anonymisiert, Kundensprache fehlt, Kundenansatz weicht von Firmendefault ab, Kunde ohne Kontaktemail (kein unbestätigter Versand), Test-Modul ohne Rechnungsrecht.

## 18. Angebot, Annahme, Auftrag, Aufgaben, Verträge

**Angebot:** `draft → issued/sent → accepted | declined | expired | revised`; nachvollziehbarer Versand und Annahmenachweis, Angebotsrevision statt Überschreibung. Preis, Steuersatz, Konditionen und Positionen beim Ausstellen als Snapshot speichern; keine spätere rückwirkende Änderung durch neue Stammdaten-Defaults. Angenommenes Angebot erzeugt über idempotenten Workflow genau **einen** verknüpften Auftrag; wiederholtes Klicken/fehlgeschlagener Redirect nicht doppelt erzeugen. Endkundenportal für elektronische Annahme erst nach eigenem Sicherheits-/Beweis-Konzept [G]; bis dahin manuelle dokumentierte Annahme möglich.

**Auftrag:** sichtbares Wording **„Auftrag“**, intern `projects`/`/projekte` erlaubt. Auftragstyp als primäre Abrechnungslogik: `time_material`, `fixed_price`, `retainer/maintenance`, `milestone`, `internal`. Zuständige Auftragsleitung, Vertretung, Kunde, Status, Budget, abrechenbare Leistungen, Rechnungsintervall, vertraglicher Stundensatz, Auftragsnummer und Kosten-/Kapazitätsdaten strukturiert. Überschreitung der Vertragsobergrenze führt zu Warn-/Freigabeprozess, **nicht** automatischer Mehrberechnung ohne Vereinbarung.

**Preispriorität [S/G D08]:** zum Zeitpunkt bestätigter Kondition dokumentierter Angebots-/Vertragssnapshot → vereinbarter Auftragssatz → gültige Kundenkondition → Firmenstandard. Keine geheime Null-Preis-Übernahme und keine Änderung alter Rechnungspositionen durch Tarifupdate. Vor produktiver Preiskalkulationsumstellung Fachfreigabe [G].

**Auftragsstatus:** `draft → planned → active/in_progress → blocked | completed | cancelled`. Abschluss blockiert bei offenen nicht eingereichten/prüfpflichtigen Zeiten, nicht abgegoltenen Auslagen und unklarer Fakturierbarkeit. Bei Stilllegung oder Storno mit Zeit/Spesen/Vertragsbindung erforderliche Rückabwicklung kontrolliert. Aufgaben inkl. Verantwortlichem, Frist, Status, Erinnerung, Wiederkehr und klaren delegierten Rollen. Nur zugeordnete Mitarbeiter dürfen Projektkontext im Zeitpicker sehen; kein allgemeines Kundendossier dadurch freischalten.

**Wiederkehrende Verträge [S/G]:** Frequenz/Start/Ende, Kündigungsfrist, Preissnapshot, Pausen/Unterbrechungen, Änderungsbeginn, nicht doppelt erzeugte Rechnungsentwürfe; niemals automatische Rechnung ohne bestätigte Vertragsregeln. Vertrag und Kunde unterscheiden interne Verlängerung von Abo-Subscription des Binso-Betreibers.

## 19. Zeiterfassung, Arbeitszeit und Freigaben

**Zeitdatenmodell:** Mitarbeiter (oder Solo-Owner), Kunde/Auftrag wenn billable, Arbeitsdatum, Start/Ende/Zeitdauer, Pausen, Tätigkeit, interne vs. extern abrechenbare Kategorie, Satzsnapshot wo zulässig, Notiz, Freigaberoute, Audit, Rechnungsverknüpfung.

**Zeitstatus:** `draft → submitted → approved/rejected → corrected+resubmitted → billable_ready → invoiced`. Eigene eingereichte Zeit nicht still ändern. Nur berechtigter **anderer** Freigeber darf `submitted` genehmigen; kein „approved“ aus einfachem Draft heraus, ausser **[B] alleiniger Inhaber ohne Mitarbeiter** in gesondertem serverseitig geprüftem Solo-Fall. Freigeber-Auswahl: zugewiesene Auftragsleitung → explizite Vertretung → unabhängiger Owner/Admin; fehlt ein unabhängiger Prüfer, Vorgang bleibt `approval_blocked`, mit Eskalation, ohne Selbstfreigabe.

**Zwei Dimensionen:** Arbeitszeitprüfung (für Arbeitgeber/Arbeitszeitkonto) und Abrechnungsfreigabe (für Kundenrechnung) müssen fachlich getrennt werden. Interne Zeit nie automatisch verrechenbar, aber ggf. arbeitszeitrelevant. Freigegebene Stunden können in Abrechnungsstapel übernommen werden, ohne dieselben Stunden doppelt in mehreren Rechnungen zu verwenden. Bei Pauschalen die Arbeitszeit nur für Aufwand/Budget nutzen, nicht automatisch fakturieren.

**Timer:** Start/Stop/Pause, mobile grosse Zeitanzeige **oberhalb** Kunden-/Auftragszuordnung, dann eigene heutige Einträge und manuelle Erfassung; Pflichtzuordnungen vor Start oder gültigen Default. Bei PWA-Hintergrund/Navigation/Offline Zeit nicht verlieren; lokales unbestätigtes Ereignis eindeutig als pending anzeigen, Serverzeit/Clock-Drift korrekt reconciliieren, verlorene Zuordnung oder stillgelegter Auftrag lösen Konflikt statt stille Falschbuchung aus. Überlappung, Mitternacht, Zeitzone, DST, Null-/Negativzeit und Pausen validieren.

**Sonderfälle:** Mitarbeiter krank/abwesend, Zuordnung widerrufen, Monat mit unterschriebenem Rapport, rückwirkende Korrektur, mehrfacher Einreichungsversuch, verrechnete Stunde nachträglich falsch, Auftragsende, Ratenwechsel, Rundung, Teilfreigabe. Bereits verrechnete Zeit bleibt gesperrt; Korrektur über dokumentierte Rechnungskorrektur/Gutschrift und neue Buchungsreferenz. Monatliche Rapportanforderung und qualifizierter Datei-/Scanstatus bleiben erhalten.

**Abrechnung:** Auftragsverantwortliche markieren abrechenbare Leistungen; Finanzen erstellt Entwurf mit Stunden, Material und genehmigten weiterverrechenbaren Spesen, auf Basis zulässiger Kundensprache/Währung/Steuern. Zahlungsfluss zum Mitarbeiter und Rechnungsfluss zum Kunden sind unabhängig.

## 20. Spesen, Auslagen und Erstattung

`draft → submitted → approved/rejected → reimbursed`, zusätzlich unabhängiger Status `billable → invoiced` für die Weiterbelastung an Kunden. Belegfoto/-PDF, Währung, Datum, Kostenstelle/Auftrag, Spesentyp, betroffener Mitarbeiter, Entscheidung, erstatteter Betrag und Zahlungsnachweis. Mitarbeitende können eigene Spesen einreichen, nicht selbst genehmigen oder Auszahlungsstatus ungeprüft setzen. Finanzverantwortliche dürfen eine Erstattung als bezahlt erst nach bestätigtem tatsächlichem Zahlungsvorgang markieren. Stornierung einer Erstattung löst nachvollziehbare Gegenbuchung aus. Kundensammelrechnung dupliziert keine bereits zugeordnete Spese.

## 21. Verkauf, Rechnungen, Schweizer QR, Zahlungseingang und Mahnung

### 21.1 Rechnung

`draft → approved_for_issue (falls Policy) → issued/sent → partially_paid | paid | overdue | disputed | cancelled/credited`, wobei Zahlungs- und Versandzustände fachlich separat modelliert bleiben. Rechnung aus Angebot/Vertrag/abrechenbaren Belegen; Positionen, CHF-/Währung, Steuer-/Netto-/Bruttobeträge, Zahlziel und Firmen-/Kundensnapshots. Pflichtdaten/Bank-/QR-IBAN vor Ausstellung validieren. Schweizer QR-Rechnung/PDF nach aktueller gültiger Spezifikation ausstellen. Vorschau ist **keine** Ausstellung; Sendefehler ist **nicht** „gesendet“. Rechnungsnummern bleiben eindeutig, idempotent und revisionsgeeignet. PDF öffnen/herunterladen und Anhänge über kontextbezogenes `…` bzw. bestehendes Aktionssystem [V].

### 21.2 Zahlung

Manuell gesicherte Zahlung zunächst möglich; automatische CAMT/ISO-20022-/Bankanbindung nur bei geprüfter Integration [G]. `unallocated/unclear → matched → verified/reversed/refunded` mit exakter Rechnung/Referenz, Betrag, Währung, Bank-/Valutadatum und Quelle. Teilzahlung, Überzahlung, Falschzuordnung, doppelte QR-Referenz, Rückbuchung, Rückerstattung, Gutschrift und zeitversetzte Bankdatei widerspruchsfrei behandeln. Bankkontostand **nicht** aus Summe erfasster Zahlungseingänge vortäuschen. Kunden-Rechnung gilt erst bei bestätigtem Saldo = 0 nach Zahlungen und anrechenbaren Gutschriften als bezahlt.

### 21.3 Mahnung

**[S]** ab Fälligkeit prüft System täglich Vorschläge; **standardmässig menschliche Freigabe** vor dem Versand. Es gelten bereits vorhandene Stufen „Zahlungserinnerung, 1. Mahnung, 2. Mahnung“, bisheriger 10-Tage-Abstand ist technischer Default und **keine unbestätigte juristische Regel**. Serienvorbereitung darf keinen direkten automatischen Versand auslösen. Vor jeder Mahnung: aktuellen Restbetrag, Zahlungsabgleichstatus, Gutschrift, Vertrag/Kundenzahlziel, letzte bestätigte Mahnung, Streitstatus, Pause/Verlängerung, Zustellkonflikt prüfen. Zahlungen und Mahnstufen atomar abgleichen. Automatikversand nur nach explizitem Opt-in, geprüftem Provider, vertraglichem/legalem Gate und strengen Stoppbedingungen. Kein autonomes Inkasso/Rechtsverfahren ohne neue fachliche Freigabe.

### 21.4 Reklamation und Mahnstop

Kunde reklamiert Rechnung: `disputed` mit Grund, Bearbeiter, Evidenz und Wiedervorlage; Mahnversand pausiert. Entscheidung: Rechnung korrekt → Frist fortsetzen; Fehler → Korrektur/Gutschrift/Neu-Rechnung unter klarer Historie; Teilstreit → unstrittigen Betrag nur nach rechts-/vertragskonformer Policy weiterbearbeiten [G]. Keine stillen rückdatierten Zahlungszustände. Freigabe-/Auditprotokoll.

## 22. Einkauf, Lieferanten, Produkte, Buchhaltung, MWST und Lohn

**Lieferanten/Einkauf:** Lieferantenstamm und Eingangsrechnung mit Lieferantenidentität, IBAN, Fälligkeitsdatum, Belegen, Mehrfach-Import-Schutz, Prüfung, Freigabe, Zahlung. Eigene Ausgangsrechnung und Lieferanten-Eingangsrechnung strikt trennen. Änderung der Empfängerbankverbindung erhält Hochrisiko-Step-up und ggf. Vier-Augen [G].

**Produkte/Dienstleistungen:** Preis-/Einheits-/Steuersatzversionen mit Gültigkeit; Archivieren ändert keine ausgestellte Rechnung; Preise in künftigen Angeboten über Defaultpriorität. Lager-/Bestandsführung nur versprechen, wenn tatsächlich implementiert [G].

**Buchhaltung/Finanzen:** Rechnungen ≠ Umsatz-Periodenbuchung ≠ Zahlungseingänge ≠ Liquidität ≠ Bankbestand. MWST nur nach korrekten Schweizer Steuersätzen, Leistungs- und Steuerperiode, Sonderfällen und wirksamen Änderungsdaten; Jahres-/Monatsperioden schliessen, später nur nachvollziehbar korrigieren. Exporte zur externen Buchhaltung eindeutig deklarieren, nicht unbestätigt als vollumfängliche Swiss-GAAP-Funktion bezeichnen.

**Personal/Lohn:** Mitarbeiterstammdaten, Abwesenheiten, Lohninformation mit sehr restriktivem HR-Recht; keine unkontrollierten Lohn- oder AHV-Berechnungsbehauptungen. Wenn im Code „Lohn-Demo“ steht, im öffentlichen Angebot nicht als produktive rechtssichere Payroll verkaufen. Schweizer arbeits-/sozialversicherungs-/steuerrechtliche Rechtsprüfung vor Lohnmodul-Go-Live [G].

## 23. Dokumente, Anhänge, Import/Export, PDF und Dateisicherheit

**Grundsatz:** Pro enthält eigenständiges Dokumentenmanagement [B]. Notwendige fachliche Anhänge (Rechnungs-/Angebots-PDF, Spesenbelege, Kunden-/Auftragsdokumente) bleiben in zulässigen Modulen der kleineren Tarife verfügbar. Datei/Blob besitzen Owner, Tenant, Fachrelation, Zugriffsregel, MIME-Typ, Prüfsumme, Malware-Prüfstatus, Aufbewahrungspolitik und Audit.

**UX:** Original-PDF oder Bild direkt in Preview; auf Desktop passenden Dokumentbetrachter, auf Mobile sicher nutzbare Viewer und System-Dateifreigabe. Keine toten, verstreuten Download-Buttons; Kontextmenü `…` bzw. bekannte Erstellungsaktion. Unscannbare/verdächtige Anhänge nicht als sicher verfügbar ausgeben. Dateien beim Löschen eines Benutzers nicht automatisch aus Firmenakten entfernen, nur Verknüpfung/Berechtigung anpassen. Vertrauliche Daten in PDFs, Druckbildern und Browser-Caches schützen. Kein offener Content-Proxy/öffentlich vorhersehbarer Dateipfad.

**Import:** fachliche Validierung, Zeitzone/Locale, erlaubte Grössen, CSV-/Dateiformat, Mehrfachimport, Duplikate, fehlerhafte Spalten, Undo/Vorschau vor Massenänderung, sichere Import-Quittung und im Hintergrund verarbeitete Jobs mit Status.

## 24. Reporting, KPI, Unternehmens- und Mitarbeiter-Dashboards

**Rollenbezogene Startseiten [B]:** Zeit-only: persönliche Zeit/Einreichen/Ausstehend. Projektleitung: eigene Aufträge, offene Fremdfreigaben und fällige Aufgaben. Finanzen: Rechnungen, Forderungen, Zahlungseingänge/Restbeträge; keine Freigaben nur wegen Finanzrolle. HR: Mitarbeiter-/Abwesenheitsvorgänge. Owner/Admin: Firmengesamtübersicht mit berechtigtem Handlungsbedarf. Reader nur erlaubte Lesesichten. One Admin eigene Plattformkennzahlen. Keine Kennzahl aus fremdem Tenant/aus Dokumentrechten abgeleitet fälschlich freigeben.

**Finanzkennzahlen:** Fakturiertes Volumen nach Gutschriften, Zahlungen nach Rückerstattungen, offene/überfällige Forderungen, Bankbestand nur aus tatsächlicher Quelle. Abrechnungsperiode vs. aktueller Bestand klar. Fehlende Daten als „Nicht verfügbar“, nicht fälschlich CHF 0. Präzise Datum-/CHF-/MWST-/Fremdwährungsbehandlung. Charts brauchen nachvollziehbare Daten, Achsen, Interaktion und Detail-Drilldown, dürfen nicht dekorative Fake-Werte anzeigen.

**Mitarbeiterberichte:** eigene Wochen-/Monatsstunden; Teamreports nach Zuordnung und Genehmigungsrecht. Daten anderer Mitarbeiter nicht aus globaler Statistik oder Export ableitbar machen. Berichts-/Datei-Downloads sind separate Rechte.

## 25. Benachrichtigungen und Transaktions-E-Mail

**Zentrale Ereignisse:** Konto-/MFA-/Passkeyänderung, Einladungsstatus, Trial-/Abo-Fristen, Zahlungsfehler, Freigaben/Abweisungen, Rechnung/Versand/Mahnung, Datei-/Importjob fertig, Ticketantwort, Support-Eskalation, Sicherheitssperre, Backup-/Dienststörung wo relevant. Jede Nachricht besitzt `event_id`, tenant, Empfänger, Berechtigungsprüfung, Zustellkanal, deduplizierten Versandversuch, Status `queued/sending/sent/failed/unknown`, Zeitstempel und sichere Retry-Regeln. „Sent“ setzt bestätigten Providerresultat-Status voraus; fehlende Bestätigung bleibt unsicher, bis abgeglichen. Kein Versand an ehemalige Mitarbeiter oder falsche Tenant-Adressen.

**E-Mail-Design [B/S]:** ein gemeinsamer responsiver HTML-Template-Owner mit Binso-Brand, neutralen hellen/dunklen Flächen, gut sichtbarem CTA und verständlichem Footer; Apple Mail iOS Light/Dark, Gmail iOS/Android, Outlook prüfen. `prefers-color-scheme` nur mit Fallback; Inlining/Client-Invertierung beachten. Weder MFA-Secret noch Passwort/Recovery-Code im Mailtext. OTP sicher lesbar, copybar, nur notwendige Gültigkeit. Angemessener barrierearmer Plain-Text-Fallback. **Sicherheitsmeldungen** bleiben versendbar, wenn Marketingbenachrichtigungen deaktiviert sind. Kein fiktiver Web-Push-Status: laut überprüfter `config/notification-channels.ts` nicht derzeit als End-to-End-Kanal verfügbar [I].

**Richtlinien:** Eskalations-/Reminderhäufigkeiten konfigurieren und nicht zu Spam werden lassen, Versandpause bei Kündigung/deaktiviertem Empfänger, Sprache aus zulässigem Empfängerkontext. Keine Kundengeheimnisse in Betreffzeilen/Push-Previews.

## 26. Support, Hilfe, Tickets, Kunden-/One-Admin-Übergabe

**Kunden-App:** „Support-Anfrage erstellen“, kurze lesbare Ticketnummern, kompakte Titel, Status `open/in_progress/waiting_customer/resolved/closed/reopened`, Nachrichten und Anhänge, Berechtigung pro Tenant/Ersteller/Gruppenrecht. Chat auf iOS-Safari/PWA mit Header oben, scrollbarem Verlauf und Composer immer oberhalb der Tastatur; keine heimlichen Statuswechsel durch Antwort. Fehlgeschlagene Nachrichtendelegation mit Entwurfsretention und Replay-Schutz; Dateianhänge mit Scan und echten Downloadrechten.

**One Admin:** Support-Operator sieht ausdrücklich für Support freigegebene Daten. Interne Notizen bleiben strikt intern, niemals in Kunden-Schnittstelle, Dokumentdownloads, Push oder E-Mail. Tenant-übergreifende Suche nach Metadaten nur in berechtigtem Operatorrahmen. Vertretung, Eskalation, Prioritäten und eventuell SLA jeweils produkt- und vertraglich abgestimmt [G]. Kein verdecktes Einloggen als Kunde ohne ausdrücklichen temporären, auditierbaren Supportzugang nach strenger Policy [G].

## 27. One Admin – vollständiger Betreiberlebenszyklus

**Identity:** separate Plattformmitarbeiterkonten, Microsoft Entra-Authentifizierung und Betreiber-Session; niemals normale Kundensession für Betreiber-API akzeptieren, keine Freischaltung durch Nutzerrollen. Betreiberrollen: `platform_owner`, `platform_admin`, `platform_support`, `platform_billing`, `platform_auditor`, nach dem tatsächlichen Rollenvertrag.

| Betreiberfunktion | Zuständigkeit | Kontrolle |
|---|---|---|
| Tenant-Katalog, Status, technische Limits | berechtigter Plattformadmin | Audit, keine illegale Preiserhöhung |
| Billing-/Provider-Abgleich | Plattformbilling | Stripe ist führend, keine manuelle Scheinzahlung |
| Einschränkungen/Sperren | Admin/Governance | Grund, Zeitraum, Auswirkung, Widerruf, Audit |
| Support-Tickets | Support | nur supportrelevante Inhalte und interne Notizen getrennt |
| Sicherheitsalarme, Account-Recovery | Security/governance | unabhängige zweite Freigabe bei Hochrisiko |
| Operator-Benutzerverwaltung | Platform Owner/Admin je Delegation | MFA/SSO und kein Self-Privilege |
| Audit/Compliance | Auditor (read-only) | kein veränderbarer oder ungefiltert exportierbarer Personaldatenzugang |
| Monitoring, Dienststatus, Releases | Berechtigter Betrieb | reale Logs, Alarme, SLO, Incident-Dokumentation |
| Retention/Export/Löschjobs | Datenschutz-/Governanceverantwortliche | Legal Hold, Audit und gesicherter Prozess |

**One Admin ist keine Kunden-Operations-Backdoor:** reguläre Kundenprozesse laufen durch legitime berechtigte Kundenrollen. Unautorisierter Zugriff, passwortloser Tenant-Wechsel und breite Datenkopie verboten. Besonderer „Break Glass“-Zugang mit 2-Personen- und Zeitbegrenzung, starker Auth, Begründung, betroffenen Datenbereichen und Protokoll nur nach separater Policy [G]. Kein beliebiger Admin überschreibt Bank-/Firmendaten ohne Nachweis.

**Operator Sonderfälle:** gesperrter Operator, abgelaufene Entra-Session, Rolle wurde von Entra widerrufen, Anbieter ausgefallen, Supportjob pending, Auditservice ausgefallen, Provider-Webhook replay, Doppelbearbeitung einer Ausnahme – jedes davon mit fail-closed für kritische Aktionen und definiertem Wiederanlauf.

## 28. Datenschutz, Compliance, Geheimnisse, Lösch- und Exportrechte

**Schweiz:** Geltung des Schweizer DSG, Auftraggeber-/Auftragsbearbeiterpflichten, klare Datenkategorien und Zwecke, zulässige Unterauftragsbearbeiter, Speicherregionen, internationale Übermittlungen, TOMs, Reaktionswege für Auskunft/Ergänzung/Berichtigung/Löschung. Nicht annehmen, dass „Schweiz gehostet“ alle internationalen Verarbeitungen ausschliesst. Für EU-betroffene Kunden/Personen gegebenenfalls zusätzliche Prüfung [G]. Verantwortlicher für Kundendaten ist regelmässig das jeweilige Kundenunternehmen; für Binso-eigene Vertrags-/Sicherheitsdaten Binso selbst, jeweils konkret prüfen.

**Datenarten:** Firmenidentität, Kontakte, Mitarbeiter-/Personaldaten, Zeiterfassung/Spesen, Finanzbelege, Bankreferenzen, Dateien/Chatinhalte, Login-/Passkey-/MFA-Metadaten, Securitylogs, Billingdaten. Datenminimierung, Feldrechte, Zweckbindung, Schlüsselschutz, Retention je Kategorie. Log-/Fehlertexte dürfen keine Tokens, IBAN im Klartext ohne Zweck, Passwörter, Ausweiskopien oder fremde Mandantendaten enthalten. Sichere Redaktions- und Downloadkontrollen.

**Regulatorische Grenzen [G]:** Buchhaltungs- und Belegaufbewahrung in der Schweiz oft 10 Jahre ab Geschäftsjahresende nach Art. 958f OR; besondere steuerrechtliche Fristen und Personalunterlagen können abweichen. Rechtliche Verifikation und vertraglicher Prozess vor Produktivlöschung. Fachliche Steuer-/Rechnungsrechtsprüfungen durch zuständige Personen; keine pauschale Rechtsberatung im UI.

**Sicherheits-/Datenrechte:** Incident/Breach-Meldung an Verantwortliche nach konkreter Schwere und Rechtslage; personenbezogene Auskunftsrechte nur nach Identitätsprüfung, keine unbefugte Datenfreigabe an nominelle HR-Benutzer oder Kundenkontakte. Export- und Löschaktionen stehen nicht automatisch jedem `:read` offen. Audit-Daten gegen heimliche Änderungen schützen.

## 29. Integrationen und API-Ökosystem

Provider als **getrennte Adapter** mit technischen Capability Flags und sichtbaren Zuständen: Stripe Billing (separat von Mandantenforderungen), Microsoft Graph Transaktionsmail, Azure-Dateispeicher/Scan, optionale Banken/CAMT, Kalender, Buchhaltungsimporte, Web Push, spätere native Push-/Store-Abrechnung und API/SSO. Jede Anbindung besitzt klaren Inhaber, Scope, Rotation/Secretverwahrung, Datenschutz-/Kosten-/SLA-Bewertung, Webhook-Signatur, Replay-, Timeout-, Circuit-Breaker- und Retry-Verhalten. Unvollständig konfigurierte Integration wird nicht als „aktiv“ angezeigt. Fehlende Providerantwort -> `unknown/pending`, niemals gefälschter Erfolg.

Öffentliche/Partner-API nur mit eigenem Berechtigungs-, Token-, Quota-, Audit-/Versionierungs- und Tenant-Vertrag [G]. Kein neuer globaler Privileg-Token nur weil Pro API „verspricht“. Vertragliche SLA für externe Dienstleister vor Aktivierung prüfen.

## 30. Desktop, Tablet, Mobile, PWA, spätere native App

**[V] Microsoft-Foundation:** Originalreferenzen, zentralisierte CSS-/Komponenten-Owner aus `app/design-system/manifest.json`, kein Glass/Blur oder zweite Foundation. Navigation und blauer runder mobiler Floating-Plus-Button bleiben in freigegebener Gestaltung und Position unverändert; nur **berechtigte** Ziele/Aktionen zeigen [B]. Leere Zustände bevorzugt eine, maximal zwei kurze Textzeilen; kein Abschneiden notwendiger Fehlermeldungen bei Zoom. Mehr-Menü bleibt einfache Liste ohne zusätzliche Gruppen. Sekundäre Objektaktionen über `…`, Erstellung über vorhandene CreateAction. Ladebanner für PWA-Version darf weder Web noch Mobile sichtbar sein [B]; internes Update sicher, ohne Datenverlust und ohne unnötiges Reload.

**Responsive:** Hauptgrenze zurzeit bis **760 px Mobile**, ab **761 px Desktop-/Tablet-Sidebar**; bei Tablet-Split-Screen am echten Viewport orientieren. Bestehende CSS-Token unter anderem Desktop-H1 ~27 px, Mobile-H1 ~25 px, Body ~14 px, Mindesttouchziel 44 px, mobile Navigation 68 px plus Safe Area. Diese Werte sind **Ist-Referenz**, dürfen nur in kontrollierter schriftlicher UX-Freigabe geändert werden. Zulässige Gerätezoom-/Textvergrösserung ohne Abschneiden oder horizontale Gesamtseiten-Scrollbars.

**Desktop-Browser:** Sidebar links (zulässig einklappbar), globaler Header Suche/Konto/Benachrichtigungen, lokale Command-Bar neben Suche/Filter, geeignete Tabellen-/Mehrspaltendarstellung, zentrierte Modals, Browser-Back/Deep-Link, Tab/Fokus. Keine app-typischen Mini-Sheets auf Desktop.

**Tablet:** je Viewport sinnvolle Sidebar oder mobile Navigation; lesbare 1–2-Spalten-Layouts, große Touchziele und Tastatur/Pointer, iPad Split View 600/761/820/1024 testen. Kein „Desktop auf 820 px zusammendrücken“.

**Mobile Browser/PWA:** fixer, sichtbarer, beschrifteter vorhandener Dock unten, Safe Areas, contextual mobile Header; App-Verhalten bei Wischen/Back/Home/Sperrbildschirm, native Tastatur, Autofill, Content-Wiedereinstieg, FormSheet Bottom Sheets mit erreichbaren Actions und Scroll-Sperre. Timerbedienung wie genehmigt; Chat Composer keyboard-aware. PWA installierte Darstellung mit eigenen Icons/Manifest, keine unerwartete Browserleisten-Imitation. PWA-Splash ausschließlich bei initialer Sessionprüfung, nicht jedem Seitenwechsel.

**Native iOS/Android [G]:** echte App-Experience, Passkeys/Associated Domains und Universal Links, native Kamera/Dateisystem/Share, Benachrichtigungsberechtigungen, Geräteverlust/Logout, lokale Datenfreigabe, App-Review-Konten, Konto-Löschung und Store-kompatibles Billing-Konzept. Store-Publikation ist **separate** Sicherheits-, rechtliche, Produkt- und Anbieterfreigabe. Keine Behauptung, PWA sei automatisch App-Store-App. B2B-Stripe/IAP-Fall nach aktuellen App-Store-Regeln **vor** Apprelease [G].

**Status-/Feedbacksystem:** `idle → busy → succeeded | failed | uncertain`, mit Beschriftung statt nur Farbe, Doppelsubmit verhindern, sauberer Retry ohne Doppelaktion, Entwurf erhalten bei Fehler. Interne Navigation ohne dekorativen Fortschrittsbalken/Ladesatz, Screenreaderstatus bleibt. `AppStart` nur erstmaliger Sessionbootstrap. Speichern, Upload, Download, Importjob, Rechnungsversand und externe Zahlung erhalten fachlich korrekte getrennte Zustände. Animationswerte aus bestehenden Tokens, `prefers-reduced-motion` beachten. Dark/Light/systemweit, E-Mail-Clients separat testen.

**Barrierefreiheit [S]:** WCAG 2.2 AA als Prüfzielsatz, Labels, Fokus, Tastatur, 200%-Zoom, VoiceOver/TalkBack, Kontraste und Statushinweise mit realem Endgerät prüfen; nicht durch „automatisierte Checks grün“ als erfüllt markieren.

## 31. Betriebsarchitektur, Monitoring, Ausfälle, Incident und Backup

- **Betriebsumgebungen:** Development, isolierte Test-/Reviewumgebung, Staging/Preprod soweit vorhanden, Produktion; Daten, Zugangsschlüssel und Provider strikt getrennt. Keine produktiven Kundendaten in normalen Preview-/Demo-Fixtures.
- **CI/CD:** reproduzierbarer Build, Lint/Typecheck/Unit/API/PostgreSQL-RLS-/Securitytests; gezielte Browserprüfungen während Implementierung, vollständige Pflichtgates an Integration; Branch Protection und PR-Review, keine Gate-Umgehung. Deployment nach positiver Freigabe; atomare/migrationssichere Releases und Rückrollstrategie.
- **Migrationsstrategie:** Expand → Migrate → Contract, Backfill unter kontrollierter Last, Feature Flags für riskante Module, alte Clients/PWA temporär kompatibel, kein blindes Löschen von Tabellen/Dateien. Migrationsdryrun, Backup vor Datenänderung, idempotente Jobs.
- **Monitoring:** API-/DB-/Providerfehler, Laufzeitlatenzen, Queue-Backlog, Rechnungsversand/Abo-Webhooks, Securityalarme, Speicher/Datei-Scan, Trial-Expiry-Jobs und Fehl-/Doppeltransaktionen. Dashboards mit echten Daten und Rollenfilter; Benachrichtigungseskalation und Runbooks; keine PII in Logstreams.
- **Incident Management:** Erkennung → Klassifikation → Eindämmung → Wiederherstellung → Prüfung → Kommunikation → Postmortem. Kundeninformation bei relevanten datenschutzrechtlichen/vertraglichen Ereignissen [G]. Bereits begonnene Rechnungs-/Zahlungsvorgänge nach Fehler abgleichen statt blind neu auszuführen.
- **Backup/Restore:** Verschlüsselte, zugriffsbeschränkte Sicherungen der Datenbank, Dokumentblobs und benötigten Konfiguration; getesteter Restore inkl. verknüpften Dateien/Referenzen/Schlüsseln. Wiederherstellungsziel RPO/RTO, Frequenz, Aufbewahrung und Kosten **vor Freigabe messen** [G], keine erfundenen SLA. Point-in-time Recovery, Tenant-/Gesamtausfall, kompromittierte Backups und externe Providerabhängigkeiten testen.
- **Kapazität:** Pro ohne feste Userobergrenze ist kein Versprechen unendlicher Infrastruktur. Faire technische Resourcebudgets transparent, rate limiting, Queue-Backpressure, Lasttests unter Team-/Dokumentwachstum; Skalierungsstrategie und belastbare Kostenkontrolle.

## 32. Qualitätssicherung und Produktabnahme über alle Zustände

Bisherige Testregister **BP-001–BP-045** (Business), **UX-001–UX-079** (UX) und E01–E10 bleiben als **rückverfolgbare Basis** gültig; neue PL-Cases erweitern sie. Ausnahme: Mehrfirmenwechsel/UX-042 ist für Produkt V1 bewusst **negativ zu testen** (zweite Firma mit gleicher Identität wird nicht zugelassen), nicht als Produktfeature zu implementieren.

**Testachsen:**
- Rollen: Owner, Admin, Finance, HR, PM, Member/Time-only, Reader, Support, Billing, Operator Auditor, fremdes Konto.
- Tarife: Start, Business, Pro, Trial, nicht abonniert, `read_only`, `past_due`, gekündigt, gesperrt; Überschreitung von Benutzer- und Speicherkapazität.
- Zustände: leer, normale Daten, >1000 Zeilen, unerwartete Daten, lange Namen, fehlerhafte Zeit/CHF/MWST, Offline, langsame/fehlerhafte API, Serverkonflikt, Nutzerwechsel.
- Viewports: 320, 390, 600, 760, 761, 820, 1024, 1440, 1920, iPhone Safari/PWA, Android Chrome/PWA, iPad Split View, Desktop Edge/Chrome/Firefox/Safari, Light/Dark, Keyboard/VoiceOver/TalkBack.
- Sicherheit: unauthenticated, revoked, inactive member, wrong tenant, direct URL/API, expired token, reused OTP, late webhook, race, IDOR, CSRF, upload MIME spoofing, sensitive file, cache leak, role downgrade, post-logout local/offline state.
- Fachdaten: Duplicate invoice, double payment, partial refund, rejected times, applied credit, overpayments, monthly report overlap, company reset, owner transfer without second approval.

**Abnahme pro Case:** erwarteter fachlicher Zustand, negative Gegenfälle, Rollen-/Tarif-/Tenantgrenzen, Backendlogs mit redigierter Evidenz, Screenshot/Video bei visuellen Fällen, echte physische Geräte für native Tastatur/OS-Berechtigungen, klarer Pass-/Fail-/Blocked-Status, SHA und Releasezuordnung. Kein pauschaler „Bestanden“-Stempel nach statischem Source-Scan.

## 33. Neue verknüpfte Use Cases und festgelegte Ausnahmen

Das separat gelieferte CSV-Register `BINSO_ONE_V25_5_Plattform_UseCases.csv` enthält sämtliche neu konsolidierten PL-IDs, Zuständigkeit, erwartetes Verhalten, Gegenfälle, Priorität und Freigabestatus. Es ergänzt unverändert BP-001–045/UX-001–079, statt diese neu zu nummerieren. Folgende globale Ausnahmegruppen müssen für **jede** relevante Aktion geprüft werden:

1. Vorgang zweimal gestartet (Doppeltap, Browser-Back, Netzretry, Provider-Webhook-Replay).
2. Benutzer, Rolle, Mitgliedschaft, Firmen-/Tarifstatus wurde **während** des Vorgangs geändert.
3. Daten wurden zwischen Anzeigen und Speichern von anderem Verantwortlichen geändert.
4. Netzwerk-/Provider-/Datenbankfehler nach möglicher Annahme, aber ohne Zustellbestätigung.
5. Objekt, Bezug, Anhang, Firma oder Benutzer wurde inzwischen deaktiviert/archiviert/gelöscht.
6. Offline-Verwendung und spätere Synchronisierung mit Konflikt oder fehlenden Rechten.
7. Zahlungs-/Steuer-/Zeit-/Sprach-/Rundungs-/Währungs-/Datumsgrenzen.
8. Export/Download/Benachrichtigung mit sensiblen Daten und falschem Empfänger-/Tenantkontext.
9. Support-/One-Admin-Versuch, eine unbekannte Kundenberechtigung zu umgehen.
10. Rechtliche/vertragliche Pflicht widerspricht Lösch-/Reaktivierungswunsch: Hold und nachvollziehbarer Prüfprozess statt Datenverlust.

## 34. Fachentscheidungstore: was trotz Vollständigkeit nicht still ausgelöst wird

**Entscheidungsregister** im separaten CSV `BINSO_ONE_V25_5_Entscheidungstore.csv`. Die sichere Zielbehandlung ist hier definiert; ein benanntes Prüfgate bedeutet **kein konzeptionelles Loch**. Gate ist ausdrücklich eine Sperre für riskante technische/prod-seitige Umsetzung bis zur dokumentierten Freigabe.

- **Legal/Privacy:** verbindliche Export-/Lösch-/Aufbewahrungsfristen, DSG-/DPA-/AGB-Text und Zuständigkeiten; echte Schweizer QR-/Steuer-/Lohnlegalität.
- **Security:** zertifizierbare/abgenommene Passkey-Policy für privilegierte Konten, Recovery-Beweisverfahren, High-risk-Wartezeit, Break-Glass- und Owner-Transfer-Vier-Augen.
- **Commercial/Billing:** restliche Gratistage bei früher Checkout-Zusage, Stripe-Live-Tax und Billingzeitpunkte, Planänderungs-/Proration-, Zahlungsfehler-/Grace- und Store-IAP/B2B-Regeln.
- **Operations:** Lösch-/Backupfristen, Restore-RPO/RTO, betriebliche SLA und Eskalation, Auto-Mahnungs-/Bankprovider, Push, HR-Payroll, native Store-Veröffentlichung.
- **Data migration:** Ist-Datenanalyse zum „ein Konto/eine Firma“ und Granular-Permissions-Migration sowie eventuelle Änderungen an existierenden aktiven Rechnungen/Abos.

**Sicherer Default:** keine automatische externe Zahlung, keine unbestätigte Rechnung/Mahnung, keine irreversible Datenlöschung, keine Abkürzung der Authentifizierung, keine unbewiesene Featurefreischaltung, kein Produktions-Deploy.

## 35. Implementierungs-/Reifephasen (noch kein Codex-Auftrag)

**Bereits laufendes V25.4-Paket nicht neu starten.** Später auf dem tatsächlich neuesten integrierten Stand [G] den fachlichen Umsetzungsumfang pro PR neu abstimmen:

| Phase | Inhalt | Exit-Nachweis |
|---|---|---|
| P0 Sicherheitsbasis | Anmeldung, MFA, Ein Konto/eine Firma, Rechte, eigene Daten, session revoke, First Owner | positive/negative ID-/Role-/Tenant-/Recoverytests |
| P0 Conversion | Public → Trial → sichere Aktivierung → Abo, Grenzen und Preisquelle | echte Stripe-Testendpunkte + signierte Webhooks + abgebrochene Checkoutfälle |
| P0 Geschäftskern | Kunde → Angebot → Auftrag → Zeit/Spesen → Rechnung/QR → Zahlung | BP-End-to-End inkl. Gegenfälle |
| P0 UX-Basis | App-/Desktop-Geräte, FormSheet, Back, Loading, Save, Sicherheit, Dark Emails | UX-Matrix und Originalreferenzvergleich |
| P1 Arbeitsprozesse | Personal-/Austritt-/Vertretungen, Budgets, Wiederkehr, Reklamationen, Mahnvorschläge | Prozess-/RLS-/Zeit-/Zustelltests |
| P1 Datenschutz/Betrieb | Export, Löschantrag, App-Lebenszyklus, Monitoring/Restore | geprüfte rechtliche Gates + echte Recovery-/Gerätetests |
| P2 Integrationen | Bankimport, native Push, Partner-API, volle Payroll, Store-App | eigener Anbieter-, Security-, Kosten- und Rechtstest |

**Root-Cause-/Altlastenauftrag [B]:** In der späteren Umsetzung einmalig ganzen aktuellen Codebestand und offene PRs systematisch inventarisieren. Doppelte und überholte Views, APIs, Dokumentation, Styles, Auth-/Abo-Varianten nur nach Nutzungsbeweis/Tests entfernen; veraltete Referenzen als Archiv kennzeichnen, **keine** Blindlöschung von Migrations-, Steuer-, Security-/Providerlogik. Gemeinsame Design-System-Owner, eine Tarifquelle, eine Rollen-/Grant-Quelle, ein fachlicher Stateowner pro Entität, zentrale E-Mail-Templates und ein korrektes Lifecycle-Modell. Vor Merge vollständige relevante Prüfungen; vor Produktion getrennte ausdrückliche Freigabe.

## 36. Abschliessende Definition „100 % fachlich vollständig“

Ein Use Case ist **fachlich ausgearbeitet**, wenn Auslöser, Nutzerrolle, Tenant/Tarif/Datenscope, Vorbedingungen, Schritte, Zielzustand, Fehler-/Timeout-/Offline-/Race-/Wiederholfall, Benachrichtigung, Audit, Datenaufbewahrung, Rückweg, Sicherung und Prüfnachweis definiert sind. Dieses Konzept und die PL-Matrix bilden diese Fragen für die gesamten wesentlichen Lebenszyklen ab. 

**Das bedeutet nicht:** alle Funktionen implementiert; jede Rechtsfrage erledigt; jedes externe System angeschlossen; Store-App bereits genehmigt; iOS-PWA physisch getestet; jedes alte Dokument automatisch ersetzt. Ein dokumentiertes **Gate** ist ein bewusster, sicherer Stoppzustand. Ein Produkt-Releasestatus darf nur nach realer Umsetzung und konkreter Evidenz **„abgenommen“** tragen.

## 37. Quellen und Rückverfolgbarkeit

### Interne vorhandene Konzeptgrundlagen

- `AGENTS.md`, `docs/architecture/ux-current-approval.md`, `docs/architecture/reference-foundation.md`, `app/design-system/manifest.json` (aktuelle Referenzordnung aus Repository).
- V25.3 `BINSO_ONE_V25_3_Business_Process_Master_Implementation.md` + BP-001–BP-045 + Entscheidungsregister D01–D18 (historische IDs beibehalten, neu bestätigte Entscheidungen überschreiben ältere offene Marker).
- V25.4 `BINSO_ONE_V25_4_Konsolidiertes_Produkt_UX_Launch_Konzept.md` und `BINSO_ONE_UX_Masterstandard_V1.md` + UX-001–UX-079.
- Geprüfte Beispiele im Code: `lib/server/registration.ts`, `app/api/auth/{register,verify-email,login,invitation,recover,password,sessions,mfa}`, `components/registration/registration-sheet.tsx`, `components/security-settings-page.tsx`, `lib/server/repositories/stripe-billing.ts`, `lib/server/subscription-lifecycle.ts`, `lib/permissions.ts`, `app/api/settings/team`, `lib/server/email.ts`, `scripts/organization-data-lifecycle.mjs`. Es wurde **keine** reale produktive Testsession, Tarifänderung oder Geräteabnahme durchgeführt.

### Autoritative externe Prüfgrundlagen (Stand Oktober 2026)

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/ (u. a. Gebührenregeln, Konto-Löschung, Login-App-Review).
- Apple account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple passkeys/associated domains: https://developer.apple.com/documentation/AuthenticationServices/supporting-passkeys
- Schweizer KMU-Portal elektronische Aufbewahrung: https://www.kmu.admin.ch/de/elektronische-aufbewahrung-der-geschaeftsbuecher
- ESTV Aufbewahrung und MWST: https://www.estv.admin.ch/de/fragen-und-antworten

**Alle externen Rechts-/Storevorgaben vor Freigabe auf Gültigkeit, Geschäftsmodell und aktuelle Rechtslage prüfen.**
