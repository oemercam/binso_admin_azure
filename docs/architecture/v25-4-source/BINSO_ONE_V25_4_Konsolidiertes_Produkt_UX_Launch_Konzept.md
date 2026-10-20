# BINSO ONE – V25.4 KONSOLIDIERTES PRODUKT-, PUBLIC-WEBSITE-, UX- UND APP-READY-KONZEPT

**Stand:** 20.10.2026 · **Markt:** Schweiz · **Repository:** `oemercam/binso_admin_azure`

**Charakter:** Schriftlicher, fachlich verbindlicher Ergänzungsvertrag zu **V25.3 Business Process Master Implementation** und **UX-Masterstandard V1**, kein konkurrierendes Designsystem. Diese Version verarbeitet die ausdrücklich zur Umsetzung freigegebenen Ergänzungen betreffend öffentliche Demo, 14-Tage-Test, Tarife, Landingpage, native App-Perspektive, Settings/Toggles, Header/Footer/Logos/Icons, Splash/Loading und vollständige kontrollierte Altlastenprüfung. Der zugehörige Codex-Auftrag setzt den Code *erst nach Übergabe an Codex* um. Dieses Dokument behauptet weder bereits geänderten Code noch eine bestandene physische Geräteprüfung.

**Geprüfter Code-Ausgangspunkt bei Erarbeitung:** `main` `d2825134deb33cac67a05c6e703b945ff28066e6`; Draft-PR **#297** `d707edf0e0e6e4231e50059c45af117fb59fcda2` (Foundation). Vor Codex-Beginn **den dann aktuellen GitHub-Stand und alle offenen PRs erneut prüfen**. Alte SHAs sind Belege, keine Befehle zum Zurücksetzen.

## 0. Rangfolge, Schutzbereiche und Status

1. Zwingende Sicherheits-, Datenschutz-, Finanz- und rechtliche Anforderungen sowie zuletzt ausdrücklich vom Nutzer freigegebene Entscheidungen.
2. `AGENTS.md`, `docs/architecture/ux-current-approval.md`, `docs/architecture/reference-foundation.md`, originale Microsoft-HTML-Referenzen, `app/design-system/manifest.json`.
3. **V25.3** für Rollen, Mandanten, Geschäftsprozesse und 45 BP-IDs; **UX-Masterstandard V1** für Geräte-, Komponenten- und Interaktionsverträge; **dieses V25.4-Ergänzungskapitel** nur für die hier neu freigegebenen Änderungen. Die bestehende UX-Foundation und die konkret freigegebenen visuellen Elemente haben Vorrang vor generischen Designvorschlägen.
4. Bestehende Umsetzung nur gezielt verändern, wenn ein konkreter Ist-/Soll-Widerspruch oder eine nachgewiesene Altlast vorliegt. Historische Reports nicht als aktive Vorgaben zurückholen.

**Unverändert schützen:** Weiss-/Blau-Microsoft-Stil, Original-Binso-Logo/Assets, zentrale CSS-Owner, keine Glass-/Blur- oder zweite Foundation; **bestehende Bottom-Navigation und runder blauer Floating-Plus-Button unverändert in Gestaltung und Position**; einfache Liste «Mehr» ohne neue Rubriken; kontextspezifische `…`-Aktionen; leere Zustände maximal zwei *inhaltliche* Textzeilen (Textumbruch bei Zoom erlaubt); sichtbarer Begriff **«Auftrag»**, technische Namen `projects`/`/projekte` bleiben möglich.

**Code-/Betriebsgrenzen:** Bis zum ausdrücklich separaten Merge-/Deploy-Entscheid nur isolierte Codeänderungen, Tests und Draft-PR. Keine produktive Datenmigration, kein produktiver Massenversand, keine Aktivierung kostenpflichtiger Buchungen, keine Datenlöschung. Ein Konzeptziel ist kein bestandenes Testergebnis.

### 0.1 Entscheidungslegende

- **BESTÄTIGT:** Nutzer hat mit «umsetzen» die zuletzt vorgemerkten UX-/Marketing-/Bereinigungsziele zur Vorbereitung der Codeänderung freigegeben.
- **BESTEHENDE REGEL:** Aus V25.3 oder dem UX-Masterstandard bereits freigegeben.
- **SICHERER STANDARD:** Kann bis zur Fachfreigabe als konservatives bestehendes Verhalten bleiben, **keine** automatische externe Aktion.
- **FREIGABE-GATE:** Eine risikoreiche oder nicht geklärte Umsetzung muss an diesem Punkt stoppen und den konkreten Entscheid einholen; unabhängige Arbeiten dürfen weitergehen.

## 1. Öffentliche Demo, Registrierung und 14-tägige Testphase

### 1.1 Produktentscheidung PUB-01 – Öffentlichen Demo-Zugang entfernen [BESTÄTIGT]

- In der **öffentlich sichtbaren Produktreise** ist `/registrieren` mit «14 Tage kostenlos testen» der Haupt-CTA. Sekundär zulässig: «Tarife vergleichen», «Funktionen ansehen», «Anmelden» für Bestandskunden.
- Öffentliche Links und Texte «Demo starten», «Demo ansehen» oder «Demo ohne Registrierung» auf `/`, `/produkt`, `/preise`, Marketingmenü, Footer, SEO/Text, Social/Deep Links, falls vorhanden, konsequent aus der **Public Customer Journey** entfernen oder sachlich ersetzen.
- Route `/demo` in Produktion ist keine offen erreichbare Demo-Sitzung mehr. Vorhandene Verweise/Rückwärtskompatibilität prüfen und fachlich sicher auf Registrierung oder sachlich korrekte Fehlerseite führen; niemals unautorisierte Demo-Session durch Redirect oder Legacy-Endpunkt erlauben.
- **Nicht löschen:** interne synthetische Demo-/QA-Fixtures, isolierte E2E-Testkonten, Entwicklerumgebung und geschützten App-Store-Review-Zugang. Sie dürfen nicht auf Public-CTA, in echten Kundenmandanten oder öffentlich indexiert erscheinen.
- Keine stillschweigende Entfernung produktiver Benutzer-/Demo-Daten. Mit API-/Session-/Tenant-Regressionen sicherstellen, dass Demo- und echte Sitzungen getrennt bleiben.

### 1.2 Produktentscheidung PUB-02 – 14 Tage Testphase [BESTÄTIGT]

1. Besucher informiert sich auf öffentlicher Website, wählt bei Bedarf Start/Business/Pro, beginnt Registrierung und bestätigt E-Mail/Identität nach bestehenden Regeln.
2. Er richtet eigenes Unternehmen ein und sieht danach die **für seine Rolle und den tatsächlich gewählten Testplan berechtigten** Module; keine Schein-Freischaltung unbekannter Features.
3. 14 Tage ab verbindlich definiertem Aktivierungsereignis; den bereits vorhandenen Systemvertrag für Trial-Start und Ablauf übernehmen, kein zweiter Trial-Zeitmesser. Testbeginn, verbleibende Zeit, enthaltene Funktionen und Ablauf klar darstellen.
4. Teststart ohne erforderliche Kreditkarte gemäss aktueller Produkt-/Preiskommunikation. **Kein automatisches kostenpflichtiges Abo** ohne ausdrückliche, nachweisbare Zustimmung und bestätigte Provider-Transaktion.
5. Rechtzeitig und über verfügbare Kanäle sachliche Erinnerung an Testende; keine Behauptung versandter E-Mails, wenn der Transport nicht bestätigt ist.
6. Bei Ablauf ohne aktiviertes Abo: konsistenter **Read-only-Status**, geschäftliche Mutationen serverseitig verweigern, vorhandene Daten erhalten und eigenen Export bzw. zulässige Kontofunktionen nur gemäss Datenschutz-/Vertragsregel freigeben. Keine stillen Löschungen oder verlorenen Entwürfe; Zeitpunkt und Zugriffsrechte klar erklären.
7. Bei bestätigter Buchung: derselbe Mandant, dieselben Dokumente/Nummern, Funktionen gemäss gebuchtem Plan. Fehlgeschlagene/unklare Checkout-Rückmeldung nicht als «abonniert» ausgeben; idempotente Provider-Webhooks und Wiederholungslogik.
8. Kündigung, Rückstufung, Zahlungsverzug und Tarifwechsel behalten historische Geschäftsdaten; nur zulässige Neuanlagen/Funktionen nach dem geänderten Entitlement sperren. Keine automatische Löschung über dem neuen Limit.

**Freigabe-Gates:** Konkretes Startzeitereignis, Reminder-Kadenz, Sonderaktion beim Upgrade während einer Testphase und native iOS-Verkaufspolitik sind vor neuer Automatismus-Implementierung mit dem vorhandenen Vertrag zu vergleichen; keinen neuen Geschäftsautomatismus erfinden.

## 2. Drei SaaS-Modelle – Start, Business, Pro

### 2.1 Aktueller im Code beworbener Preisstand [IST, KEINE PREISÄNDERUNGSFREIGABE]

| Modell | Monat | Jahr | derzeit beworbene Zielgruppe |
|---|---:|---:|---|
| Start | CHF 29 | CHF 290 | Selbstständige/kleine Teams |
| Business | CHF 69 | CHF 690 | KMU mit Personal/Einkauf/Finanzen |
| Pro | CHF 129 | CHF 1'290 | Erweiterte Zusammenarbeit, Governance |

**Ausdrücklich keine neue Preisfestsetzung:** Bestehende `lib/plans.ts`, `config/plan-access.ts`, `lib/subscription-plans.ts`, Domain-/Billing-/Checkout-Konfigurationen und API-Entitlements sind teils parallel und können divergieren. Beispielsweise erlauben Pro-/Business-Textbeschreibungen Leistungen, deren technischer Reifegrad oder Plan-Freigabe anders ist; Benutzergrenzen haben unterschiedliche Darstellungen. **Nicht blind eine davon als korrekt annehmen.**

### 2.2 SaaS-01 – Verbindliche gemeinsame Tarif- und Featurequelle [BESTÄTIGT]

- **Ein kanonischer Tarif-/Entitlement-Vertrag** als Runtime-/Backend-Quelle; alle Preis-, Vergleichs-, Registrierungs-, Checkout-, Dashboard-, API-, Datenbank- und Planwechselansichten verwenden dessen fachlich richtige Projektion.
- Ein einzelnes Feature erhält: sichtbaren Namen, Modulkennung, technisches Entitlement, aktuellen Reifegrad (produktiv / eingeschränkt / intern / geplant), Limits, Preismodell und erlaubte Rolle/Aktion. **Plan ≠ Rolle ≠ individuelle Modulfreigabe**.
- Start/Business/Pro als aufeinander aufbauende, bewusst begrenzte Modelle; nur **tatsächlich funktionierende, getestete** Features kaufentscheidend bewerben. «Lohn-Demo», «Automationen», «API», «Audit» oder «priorisierter Support» nicht ohne nachgewiesenen Leistungsumfang als vollwertige Produktfunktion verkaufen.
- Landingpage, `/preise`, `/produkt`, Registrierung und In-App-Abo zeigen identische Leistungs-/Preis-/Laufzeitinfos. Jahrespreis transparent bezogen auf tatsächlich gebuchten Jahreszyklus; MWST, Kündigung, Kreditkarte und Testphase wahrheitsgemäss.
- Tariflimits bei serverseitiger Erstellung/Änderung durchsetzen; Tenant A/B und Role A/B testen. Read-only, Trials, planabhängige Begrenzungen und Checkout nicht aus reinen Frontend-Flags ableiten.
- **Keine Tarifpreise, Module, Nutzungsgrenzen oder rechtlichen Bedingungen stillschweigend verändern:** Bei Sachkonflikt V25.4-Gate öffnen; bis dahin reale bestehende Leistung ohne falsche Marketingbehauptung sicher erhalten.

### 2.3 Abnahme SaaS-02

Gleicher Tarif/Preis/Featureset vor Registrierung, im Signup, im Checkout und nach Login; Pro-Features in Start nicht per Direkt-URL/API erreichbar; Downgrade löscht keine historischen Daten; doppelte Provider-Webhooks erzeugen keinen zweiten Vertrag; Read-only ist lesbar und korrekt erklärt; Kunde wird nicht unerwartet belastet.

## 3. Landingpage und öffentliche Produktreise

### 3.1 Public-Website-Rollen [BESTÄTIGT]

- **Landingpage `/`:** Produkt in wenigen Sekunden erklären, klarer Nutzen für Schweizer KMU, drei bis fünf belegbare Hauptvorteile, visuelle Referenz zur echten App, verständlicher Workflow, entscheidungsrelevante Tarif-Einstiege, FAQ/Vertrauen und Registrierung.
- **Produkt `/produkt`:** Konkrete Module, beispielhafte verknüpfte Arbeitsprozesse, Grenzen und echte UI-Captures; ergänzt Landingpage statt Inhalt zu duplizieren.
- **Preise `/preise`:** drei Modelle, konkrete Grenzen, klare Jahres-/Monatsbedingungen und CTA zum passenden Testplan. Keine Phantomleistungen.
- **Registrieren `/registrieren`:** klare Schritte, Formularfeedback, E-Mail-Bestätigung, geeignete Onboarding-Rückkehr, nachvollziehbares Abbrechen und Wiederaufnehmen; Plan- und Firmeninformationen nicht verwechseln.
- **Login, Passwortreset, MFA, Einladung:** bestehende Auth-Prozesse, jeweils korrekte Weiterleitung/Rolle, verständliche Fehler und Recovery; keine Testdaten in Produktion.
- **Impressum/AGB/Datenschutz/DPA/Unterauftragsbearbeiter:** rechtlich aktuelle verlinkte Inhalte, Footer-Links und Einwilligung; keine unzutreffenden Behauptungen.

### 3.2 Empfohlene sichtbare Landingpage-Reihenfolge [ZIEL innerhalb bestehender Marketing-Foundation]

1. Marketingheader mit echtem Logo, `Produkt` / `Funktionen` / `Preise`, Login und **primärem CTA 14 Tage kostenlos testen**.
2. Hero: **Wertversprechen** in klaren ein bis zwei Sätzen, realistisches App-Produktbild; nicht mehrere konkurrierende CTAs.
3. Verdichtete Nutzenpunkte: Kunden und Kontakte, Angebote/Rechnungen, **Aufträge und Zeit**, Schweizer QR-Rechnung. Nur vorhandene Leistungsfähigkeit.
4. Prozesszusammenhang: Kontakt → Angebot → Auftrag → Zeit/Leistungen → Rechnung → Zahlung.
5. Plattformvergleich: Desktop-Arbeitsbereich vs mobile App/PWA als echte unterschiedliche Nutzungskontexte, ohne App-Store-Verfügbarkeit zu behaupten.
6. Verknappter Tarif-Einstieg: drei Modelle als Einführung mit nachvollziehbarem Link zum vollständigen Vergleich.
7. FAQ: Testphase, Kreditkarte, Daten nach Ablauf, App/PWA, Sicherheit, Rollen, Verfügbarkeit und Support – nur nachweislich richtige Antworten.
8. Schluss-CTA und Footer mit Legal/Unternehmen/Sprache/Datenschutz.

**UX-Details:** Mobile Marketingmenü mit Hintergrundsperre/Focus/Zurück/Schliessen, echte Touchziele; Hero-Bilder korrekt zugeschnitten und responsive; konsistente Bildbeschriftungen und Textlängen; keine verschobenen CTAs bei 320/390/760/761/1024/1440; keine abgeschnittenen Preise/Legaltexte; SSL, SEO-Metadaten, Canonicals, Sitemap, Robots je Public/Private korrekt; Third-party Cookies datenschutzkonform. Keine neuen Parallax-/Glass-/Animations-Effekte.

**Begriffe:** Über alle öffentlichen Texte sichtbares «Auftrag» statt wechselnd «Projekt»; keine pauschalen Source-Code-Umbenennungen von APIs.

## 4. Desktop, Tablet, mobile Web, PWA und künftige iOS-/Android-App

### 4.1 Bestehendes UX-Verhalten [BESTEHENDE REGEL]

- **<=760 CSS-px:** mobile Header-/Bottom-Nav-Architektur, kompakte Records, gemeinsame Bottom Sheets, Safe Area und Softkeyboard; bestehender blauer Plus-Button und Navigation in Design/Position unverändert.
- **>=761 CSS-px:** Seitenleiste, Desktop-Appbar, lokale Suche/Filter/Erstellen-Aktionen, Desktop-Dialoge; Tablet bei breiterem CSS-Viewport verwendet dieselbe responsive Umgebung; Split-View darf auf Mobile wechseln.
- **Schrift-/Grössen-Vertrag:** vorhandene zentrale Tokens statt neue pro-Seite-Werte, u. a. `--type-desktop-heading:27px`, `--type-mobile-heading:25px`, `--type-section:18px`, `--type-body:14px`, `--type-label:13px`, `--type-metadata:12px`, `--touch:44px`, `--mobile-nav-h:68px` **plus tatsächliche Safe Area**. Keine Werte pauschal aus Demo-HTML übernehmen. Bei grossen Textgrössen darf Inhalt umbrechen, nicht clippen.
- **Browser:** natürliche History, Standard-Zurück, Download und Tastaturkürzel; **PWA:** Standalone-Modus, Deep Link/Share/Dateien/Offline/Session-Restore, systemische Safe Area; **One Admin:** eigenes Login, eigenes Manifest/Scope, getrennte Session/Sicherheitsgrenze.
- **iPad/Tablet:** tatsächliche Breite, Portrait/Landscape/Split-View, Touchziele/Popups, Scroll und Form-Footer; keine pauschal neue Tablet-Foundation.

### 4.2 APP-01 – Mobile muss ein echtes App-Erlebnis sein [BESTÄTIGT]

- Binso One soll **app-tauglich bedienbar** sein: systemische Tastatur, Fokus, native Datei-/Kameraauswahl, PDF-Share/Öffnen, Hintergrund-/Resume-Verhalten, Netzwerkabbrüche, Sessionkontinuität, Zurück/Deep Links, zugängliche Statusmeldungen.
- **PWA ist keine eingereichte App-Store-App.** Native iOS-App (später ggf. Android) ist **ein separates Lieferziel** mit eigenem Build, Signierung, Store-Metadaten, Review-Zugang, Datenschutzangaben, TestFlight/echten Geräten und App-Store-Review. Kein schnell «eingepackter Website-Wrapper» als vermeintlich sichere Freigabe.
- Im jetzigen Codeauftrag **mobile Architektur und Portabilität vorbereiten**: Browser-/PWA-spezifische APIs zentral kapseln, Form-/Datei- und Auth-Flows plattformgerecht, keine Backend-Geschäftslogik duplizieren, keine neue Native-App-Veröffentlichung versprechen oder ungeprüft durchführen.
- Plattform-Billing ist ein **Freigabe-Gate**: App Store Review Guidelines 3.1.3, 4.2 und 2.1 verlangen unterschiedliche Behandlung je Zielgruppe/Vertrieb; insbesondere Enterprise Services sind konditioniert. Vor In-App-Kauf, externen Kauf-CTAs oder Store-Einreichung gesondert rechtlich und technisch prüfen. Web-Stripe nicht ungeprüft in iOS-App kopieren.
- Für spätere App-Store-Prüfung einen **isolierten, sicheren Reviewer-Testaccount** mit funktionsfähigem Backend, Dokumentation und echten Testdaten bereitstellen, ohne öffentliches Demo-CTA. Keine Apple-Review-Geheimnisse in Source-Code oder Tickets ablegen.

**Offizielle Quellen (Stand 20.10.2026):** https://developer.apple.com/app-store/review/guidelines/ und https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review. Vor Store-Einreichung erneut aktualisieren.

## 5. Globale Einstellungs- und Aktionsstandards

### 5.1 UX-SET-01 – Boolesche Konfiguration als Toggle [BESTÄTIGT]

- Eine **binäre, persistente Einstellung** (`aktiv/inaktiv`, `ein/aus`, `zulassen/sperren`) erhält einen gemeinsamen klar beschrifteten **Switch/Toggle**, vorzugsweise vorhandenen `Toggle`-/`FormField`-Owner, nicht einen beliebigen Button, grosse Kachel oder ein zweideutiges Auswahlfeld.
- Tooltip/Hilfstext optional, sichtbarer aktueller Zustand, Tastatur/Screenreader (`role=switch`, `aria-checked`), Disabled/Read-only-Erklärung, Mindest-Touchziel.
- **Kein Toggle** für Aktionen (Speichern, Einladen, Löschen, Zahlung erfassen, Rechnungsversand, Logout), irreversible Vorgänge, einzelne Bestätigung, mehrwertige Auswahl. Mehrere Optionen = Radio/Select/Segment, nicht künstliche Schalter.
- **Persistenz eindeutig:** einfacher, ungefährlicher Toggle darf unmittelbar speichern, muss aber Running/Error/Rollback nachvollziehbar zeigen. Gruppierte/sensible Unternehmenskonfiguration bleibt als Entwurf bis «Speichern»; kritische Security-/Billing-Toggles benötigen separate Bestätigung, Audit und ggf. unabhängige Berechtigung. Nicht «aktiviert» zeigen, wenn Backend nicht bestätigt hat.
- Nicht implementierte Funktionen (etwa Push ohne Transport, vollautomatischer Bankimport, automatischer Mahnversand) **nicht als bedienbaren Toggle anbieten**. Sie dürfen nur eindeutig als nicht verfügbar/noch nicht unterstützt markiert werden, ohne falsches Versprechen.

### 5.2 UX-ACT-01 – Keine verteilten Objektaktionsbuttons [BESTEHENDE REGEL]

- Bestehendes Aktionssystem: neue Datensätze über vorhandenen CreateAction-/Floating-Plus-Kontext; sekundäre Dokument/PDF/Download/Anhang/Bearbeiten/Duplizieren/Storno-Aktionen im kontextabhängigen `…`-Menü; Formularsubmit, Timer, Navigation, Such-/Filteraktionen bleiben direkt erreichbar.
- Rollen-/Tarif-/Objektstatus steuern `sichtbar/ausführbar`; ein versteckter UI-Befehl ersetzt keine API-/RLS-Prüfung.
- Einfache Liste «Mehr» bleibt unverändert strukturiert und bekommt keine neuen Gruppierungen.

## 6. Header, Footer, Logo, Icons, Layout und responsive Größen

### 6.1 UX-VIS-01 – Gesamt-Audit mit Referenzbindung [BESTÄTIGT]

- **Alle** Marketing-, Auth-, Kunden- und One-Admin-Header/Footer inklusive Logo/Icons/Aktionsleisten prüfen. Kein pauschales gleiches Headerlayout für unterschiedlich funktionierende Bereiche.
- Original-Binso-Assets, tatsächliche im Repo vorhandene Brand-Varianten, gleiche Icon-Familie/Strichstärke und konsistente visuelle Grössen verwenden. Keine Textlogos, Emoji-/Placeholder-Icons in produktiven Kopf-/Fussbereichen; keine neuen Fontdateien.
- Bestehende Logo-Grössen **als Ist-Werte** messen statt blind ändern: Marketing-CSS verwendet u. a. `96×31px` Desktop und `88×28px` Mobile im Nav-Link; Seitenlogo/App-Icon/Splash/Apple-Touch-Icon haben jeweils eigene Rollen.
- Prüfung bei 320/360/390/430/760/761/768/1024/1100/1440/1920 CSS-px; Browser und PWA; 200%-Zoom und grosse Systemschrift; Touch/Hover/Focus; ohne abgeschnittenes Logo, kollidierende Iconflächen oder springende Menüzeilen.
- Änderungsregel: vorhandene Microsoft-Referenz und bestehende Tokens sind verbindlich; nur **belegte** Unstimmigkeit zentral beim CSS-Owner korrigieren, nicht nach subjektivem «best practice»-Redesign. Bestehende Mobile-Bottom-Nav und Floating-Plus in Gestaltung/Position **nicht anrühren**.
- Website-Footer: rechtliche Links, Binso GmbH, Schweiz/Contact, Datenschutz/Consent, responsiver Umbruch und Links; App benötigt **keinen** grossen Website-Footer.

## 7. Start/Splash, interne Navigation, Lade- und Speicherfeedbacks

### 7.1 UX-LOAD-01 – Zustandsvertrag [BESTEHENDE REGEL / BESTÄTIGT]

| Kontext | Sollverhalten | UI-Vertrag |
|---|---|---|
| Initiales App-Starten/Sitzungsbootstrap | Einmalig geeigneter Original-Binso-Icon-Startzustand (`AppStart`) bis tatsächlicher Bereitschaft; keinen Fake-Timer | Screenreader: zugänglicher Status; keine endlose Warteanzeige |
| Interner Seitenwechsel / Zurück | Bestehende Shell bleibt stehen, leise Datenladung ohne dekorativen Balken/Spinner; keine Splash-Wiederholung | Scroll, Filter, Tab-/Rückkehrkontext bei Rücknavigation erhalten |
| Lokale Datenabfrage | Je Abschnitt LoadingState, kein falscher «leer»- oder «0»-Status während Fetch; Hintergrund-Refresh ohne unberechtigte Zwischenanzeige | Fehler sichtbar mit `Erneut versuchen` |
| Speichern/Einreichen/Versenden | `idle → validating → saving/sending → confirmed` oder `failed/uncertain` | Doppelaktion sperren, Fortschritt verständlich, Daten/Entwurf erhalten, keine vorzeitige Erfolgsmeldung |
| Ungespeicherter Entwurf/Zurück | Vor tatsächlichem Datenverlust Bestätigungsdialog, bei Cancel weiterbearbeiten | Browser-History und mobile Hardware-/Swipe-Zurück schützen |
| Offline/App-Resume | Bestehenden Entwurf/Timer sicher wiederherstellen; fehlende Serverbestätigung kenntlich machen | Keine doppelten Einträge oder verlorene Zeiterfassung |
| Berechtigungs-/Sessionwechsel | Persönliche und vertrauliche Caches leeren, neue Datenrechte neu laden | Keine fremden Zwischeninhalte |

**UX-LOAD-02 – Sichtbares PWA-Update-Banner entfernen [BESTÄTIGT]:** `components/app-version-notice.tsx` liefert am geprüften Main noch eine sichtbare Meldung «Neue Version verfügbar» samt Button. Im freigegebenen Ziel darf diese **weder auf Browser noch Mobile/PWA noch in Rechnungsassistenten erscheinen**. Internes, sicheres Update-Lifecycle-Management und Datenverlustschutz erhalten; niemals mitten in aktiver Arbeit automatisch reloaden; keine versteckten, unbestätigten Erfolgszustände. Verwaiste UI-Komponente nach Import-/Testbeleg sauber entfernen, falls keine sonstige Verwendung.

**UX-LOAD-03 – Nicht überall mehr Ladeicons:** Kein neuer globaler Spinner, keine sichtbaren Lade-Balken bei jeder Navigation. Bei wirklich langen **fachlichen Aktionen** darf die bestehende Aktion einen eindeutigen Busy-Zustand bekommen; Statusmeldungen sind zurückhaltend, nicht doppelt, barrierefrei und nach tatsächlichem Ergebnis.

## 8. Rollen-/Tarif-/App-Ausrichtung (Schnittstelle zu V25.3)

- Benutzer meldet sich an und sieht nur den jeweiligen berechtigten Arbeitsbereich. Zeit-only `member` sieht eigene Zeit, minimale Auftragspicker, eigenes Profil/Sicherheit und Support – nicht beliebige Kunden-, Finanz- oder HR-Daten.
- Rolle definiert Obergrenze; Modulfreigabe begrenzt; konkrete Zuordnung, Tenant, Plan, Objektzustand und Read-only schränken zusätzlich ein. Ein API-Direktaufruf ist keine Berechtigung.
- Gleiche Rechte in Navigation, Menü «Mehr», `QuickCreate`, Suche, Deep Links, Datei-Download, SSR und Backend/RLS. Keine leeren Arbeitsplätze und keine «Keine Berechtigung»-Sackgasse durch sichtbare Tabs.
- **Geometrie-Konflikt:** Die bestehende mobile Navigation mit fünf Positionen wird **nicht** aus Designgründen geändert. Für Zeit-only ausschliesslich berechtigte Geschäftszugriffe; falls dies die feste Slot-Verteilung verändert, vor jeder visuellen Nav-Anpassung separaten Freigabevorschlag mit Referenzvergleich vorlegen. Nicht neue Ersatzseiten oder falsche Links erfinden.
- Selbstständiger Inhaber ohne Mitarbeiter kann eigene Zeiten direkt abrechnungsreif machen; Mitarbeitende können ihre Zeiten nicht selbst genehmigen; freigegebene/bezahlte/gesendete Dokumentvorgänge sind nachweisbar voneinander getrennt.

## 9. Vollständige sichere Repository-Altlastenbereinigung [BESTÄTIGT]

### 9.1 CLEAN-01 – Einmaliges vollständiges Ist-Audit, keine Blindlöschung

Ein Inventarlauf im tatsächlichen Repository, inklusive statischer und dynamischer Verwendungen, für:

- Alle Routen (inklusive öffentliche Seiten, 76 bestehende App-Routen, 13 Operator-Varianten, Auth, PWA/offline/error), Branches/PRs, Navigation/Deep Links, Site Maps, Redirects.
- `app/design-system/manifest.json` + alle CSS-Owner, Tokens, responsive Cascade, tote Selektoren, `!important`, lokale Workarounds, verwechslte Themes, auslaufende historische Verträge.
- Komponenten, Hooks, Utils, Typen, Form/Wizard/Records/Sheets, Story-/QA-Hilfen, statische/dynamische Imports/Exports, indirekte Seiteneinstiege.
- Geteilte Geschäftslogik für Permissions, Module/Plans, Einladungen, Zeit/Freigaben, Dokumentstatus, Rechnungs-/Zahlungs-/Mahnlogik, PDF/QR, Dateiverknüpfungen.
- Server-API, SQL-RLS, Datenmodelle, unveränderliche Migrationen, File Storage, Sessions/Cache, Stripe/Email/Notifications/PWA/Service Worker, GitHub Actions und Tests.
- Package-/Dependency-/Security-Status, nicht mehr benötigte Pakete/Assets/Bilder, alte Demo-Links, SEO, Build-/Deploy-Artefakte und Dokumentation.

**Beweis pro Kandidat:** Fundort, tatsächlicher Owner, Imports/Verwendungsgraph, dynamische/konfigurationsgetriebene Referenzen, Laufzeit-/Migrations-/Public-API-Kompatibilität, Grund für Entfernung, Risiko, negative Gegenfälle, Vorher-/Nachher-Test. Ein nicht importiertes Modul ist nicht automatisch sicher löschbar.

### 9.2 CLEAN-02 – Was zu entfernen ist

Nur nachgewiesen veraltete/doppelte/fehlerhafte und **nicht mehr benötigte** Laufzeitbestandteile entfernen: tote Legacy-Demo-Public-Flows; doppelte aktive Komponenten/Validatoren/Tokens; CSS-Overrides ohne Wirkung; verwaiste UI-Update-Banner; irreführende Marketingtexte; überholte ungenutzte Module und Imports. Alte vertraglich relevante API-/DB-/SQL-Migrationen, legitime PWA-Kompatibilität, Evidenzarchive und Testfixtures **nicht** pauschal löschen. Historische Unterlagen als «historisch» kennzeichnen, statt als aktuelle Quelle gelten zu lassen.

**Prohibitions:** Keine pauschale Git-/History-Löschung, kein `DROP TABLE` ohne eigenständigen autorisierten Migrationsauftrag, kein Deaktivieren von Security-/QA-Gates, keine künstlichen grünen Baselines, kein Entfernen von Businessfunktionen wegen CSS-Redesign, keine neue Foundation, keine stillen Produktionsdatenänderungen.

### 9.3 CLEAN-03 – Phasen-/Effizienzmodell

1. Einmal die relevanten Owner und Importgraphen auditieren, nach P0/P1/P2 mit konkreten Auswirkungen priorisieren.
2. Separates Korrekturpaket für Marketing/Tarife/Demo; anschliessend Rollen-/UX-Shell-Komponenten und Serverrechte; danach CSS-/Codekonsolidierung nur bei nachgewiesenem Nutzen.
3. Während Entwicklung fokussierte Tests (`pnpm qa:plan --files ...`, `pnpm qa:fast --files ...`, Lint/Typecheck für relevante TS-Änderungen). Keine Browser-Vollmatrix nach jedem Commit.
4. Am Integrationspunkt GitHub-Quality, Security/CodeQL, relevante PostgreSQL-/Workflow-/Migrationstests, vollständige Browsermatrix und Screenshot-Vergleich auf demselben finalen SHA; reale Hardware/Nativbuild-/Provider-Nachweise getrennt offen lassen.
5. Alle Abweichungen im Änderungs- und Abnahmebericht mit Dateien, Test, alten/neu verbindlichen Regeln und offenem Risiko dokumentieren.

## 10. Plattformspezifische Sicherheits- und Store-Freigabegates

| Gate | Umsetzung jetzt | Nicht stillschweigend freigeben |
|---|---|---|
| STORE-01 iOS-App | Architektur/PWA-Ausrichtung, echte Gerätetests planen | Native Build, Apple-Signierung, TestFlight/App-Store-Submit |
| STORE-02 iOS-Billing | Web-Stripe bestehen lassen und nur intern korrekt darstellen | Checkout-/externen Kauf-CTA im App-Store-Client ohne Store-Regelprüfung |
| STORE-03 Review | Isolierte Reviewer-Login-Spezifikation, kein Public-Demo-CTA | Echte Reviewer-Zugangsdaten im Repository, Public-Demo-/Tenantsitzungen |
| MAIL-01 Zustellung | Bestehenden bestätigten E-Mail-Pfad und Fehler erhalten | Automatische Versand-/Mahnaktivierung ohne verbindlichen Sender und Opt-in |
| SECURITY-01 Dependencies | Security-Advisories aus PR #297/Fix erneut prüfen | Blindes Upgrade, Erfinden einer gepatchten Version oder Verlängern ungeprüfter Ausnahmen |
| FIN-01 Geld/Verträge | Bestehende Preise/Status/Freigaben bewahren | Ungenehmigte Preis-/Plan-/Mahnstufen-/Abrechnungsänderung |
| NAV-01 Mobile | Bestehenden Nav-Owner/Plus unverändert; nur Berechtigungskonsistenz | Umbau oder Austausch bestehender fünf Navigationspositionen ohne ausdrückliche visuelle Freigabe |

## 11. Konkrete Abnahmefälle (kein Falsch-Grün)

**Public:** kein öffentlicher Demo-Einstieg, kein unerlaubtes `/demo`-/Demo-API-Login; Landing-/Produkt-/Preise-CTA führen zu existierendem 14-Tage-Signup; E-Mail-/Fehler-/Onboarding-Flow erhalten; Newsletter/SEO nur falls real; Legal Footer erreichbar; responsive ohne Scrollbruch.

**SaaS:** exakt drei nachweislich konsistente Planprojektionen; Feature-Vergleich entspricht Entitlements und tatsächlich verfügbarer Funktion; Trial läuft ohne automatische Gebühren; Ablauf Read-only inkl. Datenerhalt; gebuchter Status nur mit bestätigter Providerantwort; Up-/Downgrade idempotent und Mandanten-sicher; App-Store-Billing als späteres Gate.

**UI:** jeder persistente binäre Einstellungszustand hat korrekte Toggle-Semantik, andere Aktionen Buttons; Eingabefehler, Read-only, Fokus, keyboard, Originaltokens; Header/Footer/Icon-Grössen an echten Viewports vergleichen; EmptyState höchstens zwei inhaltliche Absätze; keine Glasoptik, keine zweite Foundation; Navigation/Plus nicht redesignen.

**Loading:** Initialsplash einmal bei tatsächlichem Bootstrap; interner Wechsel ohne Splash/Spinner; keine sichtbare Update-Anzeige in allen Appbereichen; Busy/Success/Failure nur bei bestätigter Aktion; Browser/PWA/Chat/Dateien/Offline/Reload/Back schützen.

**Sicherheit:** Owner/Admin/Finance/HR/Project Manager/Member/Reader, time-only und getrennte One-Admin-Rollen; Tenant A/B, entzugene Zuordnung, Direkt-URL, API, File, cache/session, Planlimit und Read-only negativ testen.

**Geräte:** automatisiert 76 bestehende App-Routen und 13 Operator-Varianten plus Public/Marketing/Auth; gezielt 320/390/760/761/768/1024/1440 px und abgeleitete Themes/Zustände. iPhone Safari + iOS-PWA, Android Chrome/PWA, Tablet, Keyboard, realer Screenreader, echte Store-App separat und **niemals** als durch Browseremulation bestanden deklarieren.

**Dokumentation:** bestehende IDs BP-001…045, UX-001…079, E01…E10 erhalten; zusätzliche Marketing-/SaaS-/Store-Akzeptanzfälle ergänzen, ohne alte offen gebliebene Fälle künstlich grün zu setzen.

## 12. Lieferergebnisse für Codex

1. Ein konsolidierter aktueller Dokumentationsindex mit V25.3 + UX-Master V1 + V25.4; `AGENTS.md` nur bei begründeter Quellverknüpfung ändern, ältere Verträge nicht überspielen.
2. Vergleich IST/SOLL je öffentlichem/privatem Modul mit Root Cause, Reviewer-Status, Risikoklasse, konkretem Owner, Codeänderung, entfernten Altlasten und Testbelegen.
3. Implementierte Public-Demo-Entfernung, konsistente Trial-/SaaS-/Landingpage-Flows; berechtigungs- und statusgerechte UX-/Einstellungsanpassungen; sichere mobile PWA-/Native-Readiness ohne native Auslieferungsbehauptung.
4. Alle relevanten Seitenänderungen an der vorhandenen Foundation mit vorher/nachher Screenshots, ohne neue visuelle Baselines eigenmächtig zu akzeptieren.
5. Nachgewiesener Sicherheits-/Entitlement-/Multi-Tenant-Schutz und E2E-Gates auf finalem SHA. Offene Geräte-, Store-/Billing- und externe Provider-Gates explizit offen.
6. Vollständiges Änderungs- und Bereinigungsregister; sauberer **Draft-Pull-Request**, keine Integration/kein Deploy ohne gesonderte Freigabe.

---

**Versionspolitik:** V25.4 ergänzt V25.3 und UX V1 nur in den oben freigegebenen Bereichen. Im Konfliktfall gewinnt die ausdrücklich jüngere Entscheidung; nicht verwandte offene Produktfragen aus `BINSO_ONE_V25_3_Entscheidungsregister.csv` bleiben bis zur Entscheidung offen. Bei Sicherheits-/Finanz-/Vertragsunsicherheiten nicht spekulieren; sichere vorhandene Funktion beibehalten und dokumentieren.
