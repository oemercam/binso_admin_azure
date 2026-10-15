# Weisse Arbeitsbereiche – Implementierungsphase

Ausgangsstand: `116ad260d98123b433449f5d53f47f64b09827c5` (Main, PR #255). Arbeitsbaum vor Beginn sauber. Branch: `ux/v24-white-workspaces`. Keine erneute ZIP-Sicherung als Voraussetzung. Git-Bundle der Ausgangshistorie war bereits geprüft; kein produktiver Datenbank-/Infrastruktureingriff in dieser Phase.

## Verbindlicher Auftrag

[Neuer Auftrag](white-workspaces-request.md), vom Nutzer am 15.10.2026 beigefügt. Seine konkreten Designentscheidungen haben Vorrang vor älteren widersprüchlichen Gestaltungsanforderungen. Weisse Grund-/Header-/Inhaltsflächen im Light Mode; dezente blaue Aktionen und Zustände; separate konsistente Dark-Variante; eigenständige Desktop- und mobile Bedienung. Die bestehende mobile Bottom-Navigation bleibt geschützt.

Die Referenzen wurden nach dem ersten Foundation-Paket im Gesprächskontext und anschliessend als aktuelle Datei `binso-one-ux-referenzpaket.zip` gefunden (15.10.2026, 19:35 UTC). `reference/IMPLEMENTIERUNG.md` wurde zuerst gelesen; die vier zugehörigen HTML-Ansichten liegen unverändert unter `reference/`. Microsoft-Variante ist verbindlich. Dark Mode und vollständige Adminansichten sind laut Paket noch nicht visuell freigegeben. Exakte Referenzparität wird ohne Browservergleich nicht behauptet. Anforderungen des gesamten V24 bleiben offen, bis sie individuell nachgewiesen sind.

## Ursachen und zentrale Korrekturen

| ID | Ursache | Korrektur | Status |
| --- | --- | --- | --- |
| WHITE-001 | Mobile gruppierte Flächen beziehen Grau aus `--app-surface` und `--app-chrome` | Bestehende Light-Tokenwerte weiss; Dark-Werte und Navigation/Glass-Token unverändert | implementiert; Browser offen |
| WHITE-002 | Desktop-Linkzustände verwenden Schwarz/Invers bzw. Unterstreichung | Gemeinsame blaue Akzentfläche und Akzenttext in vorhandenen Styles | implementiert; Browser offen |
| WHITE-003 | Desktop-Shell hat keinen Einklappzustand | Gemeinsamer Desktop-Navigationshook und Button; standardmässig offen, gespeicherte manuelle Auswahl, Speicherfehler toleriert, `aria-expanded`/`aria-controls`, zugängliche Iconleiste; nur ab 1101 px | implementiert; Browser offen |
| WHITE-004 | Benachrichtigungen bieten weiterhin eine separate Massen-Leseaktion | Aus Headerpanel und Übersichtsseite entfernt; Öffnen markiert den einzelnen Eintrag weiterhin gelesen | implementiert; Browser offen |
| WHITE-005 | Gemeinsamer Ring enthält keinen zentralen Wert-/Labelblock | Gemeinsamer geometrisch zentrierter Innenblock; Legende und Tastatur-/Detailinteraktionen erhalten | implementiert; Browser offen |
| WHITE-006 | Globale Desktop-Suche steht links | Suche zusammen mit Timer/Glocke/Profil rechts; Einklappsteuerung links | implementiert; Browser offen |

Die weissen Eingabeflächen benötigen eine sichtbare Abgrenzung: der gemeinsame mobile Suchfeld-Owner verwendet die bestehende Control-Border statt transparent. Gemeinsame Primärbuttons nutzen Akzent und kontrastierenden Theme-Text; die vorhandene runde Erstellen-Aktion behält ihren eigenen unveränderten Invers-Owner.

Entfernte Altlasten: zwei UI-Massen-Leseaktionen und ihre unbenutzten Handler/Props; keine API gelöscht. Keine neue Foundation, keine neue Bibliothek, keine lokalen Seiten-CSS-Dateien. Die vorhandene Seitenmatrix wurde aus dem AST aktualisiert; das ist kein Laufzeitnachweis.

## Prüfungen

- Frozen Install mit projektgebundenem pnpm 10.17.1 erfolgreich. Vorinstalliertes pnpm 11 verursachte einen Konfigurationskonflikt; Lockfile blieb unverändert.
- Fast-QA einschliesslich TypeScript, UX-Vertrag, Regression, Theme/Glass, Foundation, Navigations- und CSS-Architektur sowie QA-Plan auch nach der letzten Desktop-Suchpositionierung bestanden.
- Separater unveränderter Navigation-Contract bestanden: keine Referenzregeneration.
- Finaler Produktionsbuild, vollständiger ESLint, Statistiktests, Repository-/Dokumentations-/Releasechecks und Dependency-Audit bestanden; keine bekannten produktiven Dependency-Schwachstellen. Lokales HTTP-Gate ebenfalls bestanden: 57 Routen, fünf Stylesheets, Demo-Flow und Theme-/Storagezustände.
- Neues Browsergate prüft weisse Flächen, Desktop-Einklappen/Rückgewinnung der Breite/Storage und geometrische Ringzentrierung. Der bestehende Flächentest wurde wegen der expliziten neuen Weiss-Vorgabe von Grau auf Weiss geändert. Keine Screenshotreferenz erneuert.
- Lokaler vollständiger Testlauf der Ausgangsbasis scheitert unverändert im Scanner-Test an `listen EPERM`. Keine Prüfung deaktiviert.
- Lokale Browserinstallation scheitert am Download/Entpacken des Chromium-Archivs. Kein Browser-/Gerätenachweis dieser Phase.

Der Token-Snapshot und der zentrale UX-Vertrag enthalten die neue schriftliche Weiss-/Desktop-Vorgabe; ältere graue Snapshotwerte sind ersetzt. PR #256, Implementierungscommit `e480261b8088f67e5cb144982ac9b1b2939ccdf4`: GitHub Quality/CodeQL laufen. Browser werden für den Draft gemäss bestehendem Workflow zurückgestellt und nicht als bestanden gewertet.

## Verbleibender Umfang

Gesamtauftrag nicht abgeschlossen. Offen sind tatsächlicher visueller Referenzvergleich, vollständige Prüfung jeder Route/Zustands-/Rollen-/Sprachkombination, kontrollierter Desktop-Aktionsoverflow, aktuelle Firmen-/Arbeitsbereichsauswahl, Admin-Suche/Benachrichtigungen mit realen Daten, sämtliche Layout-/Overlayvarianten und vollständige Legacy-Nutzungsbereinigung. Das Repository unterstützt derzeit DE/FR/IT/EN; TR ist im neuen Auftrag gefordert, aber noch nicht implementiert. Keine funktionslosen zusätzlichen Schaltflächen dafür eingeführt.

Issue #238 und seine Scanner-/Ingress-/Betriebs-/Geräte-/Abnahmenachweise bleiben offen. Der aktuelle bereits ausgelieferte Stand ist ein dokumentierter Entwicklungsumfang; dieser Nachtrag erklärt ihn nicht zur vollständigen Produktionsabnahme. Kein Merge/Deploy dieses Pakets ohne bestandene Pflicht-Gates und zulässigen Review.

## Referenzgebundene Pilotansichten

`AuthWorkspace` bildet den gemeinsamen Desktop-Rahmen für Login, Codeprüfung und Passwortanforderung/-zurücksetzung. Bestehende Formular-, Fehler-, Doppelsubmit-, Reset- und Session-Handler bleiben erhalten. Auf Mobile/Tablet wird die Marketing-Einleitung ausgeblendet, Formular und echte Navigation bleiben erreichbar. Sprache und Rechtslinks sind funktional; Original-Logo statt Textlogo. Registrierung behält vorläufig den vorhandenen Wizard/Sheet-Prozess.

Die Ausgangswerte des Referenzpakets werden in bestehenden Tokens verwendet: Primäraktion `--app-action-accent:#2566bd`, weiche Fläche `#edf4ff`, Buttonradius 7 px, Feldradius Desktop 7 px/Mobile 8 px. `--app-accent` der eingefrorenen Navigation bleibt unverändert; nur Inhalts-/Overlay-/Desktop-Shell-Kontexte binden den freigegebenen Aktionsakzent ein. Native Dateiauswahl verwendet den gemeinsamen dezenten blauen `::file-selector-button`; Dateinamen, native Auswahl und Disabled-Verhalten bleiben erhalten.

Der bestehende Browser-Controltest erwartet aufgrund der neuen expliziten Referenz 8 statt 12 px. Keine Referenzbilder oder Gate-Entscheidungen angepasst. `ux-reference-capture.mjs` rendert die unveränderten Referenzdateien in einem separaten, netzwerkgesperrten Browserkontext mit bereits gebündeltem Lucide. Ein zusätzlicher Evidenzschritt im bestehenden Chromium-Job legt diese Bilder bei den tatsächlichen Produkt-Screenshots ab; keine automatische Baselinefreigabe. Keine Vorschau-Daten/Handler ins Produkt übernommen.

Vor der Referenz-Pilotänderung bestanden auf `4c39191da8c84ba83ea17b2ce995e7c768fc1010` GitHub Quality #38796209547 und CodeQL #38796209578. Der vollständige lokale Diagnoselauf bestand 41 von 42 Einzeltests; nur der Scanner-Unix-Socket scheiterte an EPERM. Dies ersetzt nicht das vollständige Pflichtgate. Neue Pilotänderungen benötigen eigene CI-/Browsernachweise.

## Kaskaden- und Browserkorrekturen des Pilotpakets

- Chromium #38797350820: Desktop `.page-container` hatte einen transparenten statt eigenen weissen Hintergrund. Weisser Parent allein erfüllte das explizite neue Surface-Gate nicht. Der vorhandene Container und Operator-Inhalt besitzen jetzt `--app-canvas` unabhängig vom Viewport; die redundante mobile Deklaration ist entfernt. Erwartung blieb unverändert.
- WebKit desselben Laufs: zweite historische Control-Geometrieprüfung erwartete noch 12/10 px. Die Implementierung lieferte 8 px entsprechend der neuen Referenz. Beide Controlprüfungen erwarten nun die ausdrücklich dokumentierten 7 px Desktop bzw. 8 px bis 1100 px; Höhen/Insets/Validierungs-/Keyboardgates unverändert.
- Vererbungsprüfung: der globale Fokus gehört auch zur eingefrorenen Navigation. `:focus-visible` bleibt deshalb bei `currentColor`; blau wird nur für die vorgesehenen gemeinsamen Button-/Iconbutton-Kontexte gesetzt. Das Navigationsgate prüft zusätzlich diesen geerbten Owner. Keine Navigationsreferenz regeneriert.
- Auswahlzustände von Tabs/Chips/Benachrichtigungen verwenden jetzt im bestehenden Basisowner die weiche blaue Fläche; die identische mobile Sonderdeklaration wurde entfernt. Dateiauswahl-Touchziel beträgt mindestens 44 px.

Die Pilot-Referenzbilder wurden im Chromium-Runner erfolgreich erzeugt und zur Prüfung geladen. Ein vollständiger visueller Vergleich mit den tatsächlichen Pilotseiten bleibt bis zum korrigierten Browserlauf offen; der fehlgeschlagene Lauf wird nicht als bestanden ausgewiesen.

### Frühes Inventar-Gate

Der Integrationsfingerprint umfasst auch `scripts/`. Nach Ergänzung der geerbten Navigations-Fokusprüfung war das gespeicherte Inventar erneut veraltet und blockierte Quality #38798735176 vor den Browserjobs. Das war ein fehlender Generatorschritt dieser Umsetzung. Die bestehende Fast-QA führt die Integrationsprüfung jetzt bei gemeinsamen oder Infrastruktur-/Skriptänderungen mit aus; sie generiert keine Freigabe und überspringt kein Gate. Inventar nach allen Änderungen neu erzeugt und anschliessend geprüft.

## Visueller Pilotvergleich und Folgebatch

Bilder aus Chromium #38799220066, 1440/390 px, mit den gebundenen HTML-Referenzen angesehen. Login besitzt bereits die richtige zweigeteilte Struktur und Original-Branding. Korrigiert: eindeutiger Zeilenumbruch der Einleitung, Titelgrösse, Checkbox-Abstand und gemeinsame Zeile für Remember-me/Reset; keine doppelte Desktop-Demoaktion. Auf Mobile bleibt der Demo-Zugang im Formular verfügbar.

Kundendetail: die sichtbare Umrandung stammt aus der gemeinsamen Surface-Gruppe und ist dort entfernt, statt durch eine Kunden-CSS-Ausnahme übermalt zu werden. Gemeinsame Detailüberschriften erhalten eine Desktop-Aktionsleiste unter Titel/Status/Untertitel; Mobile verwendet weiterhin seine eigenen Headeraktionen. Kunden haben dort eine berechtigte direkte Bearbeiten-Aktion. Die dauerhafte Spalte mit zwei Zählern ist entfernt; gemeinsame Detailraster reservieren ohne echtes Aside keine leere Spalte. Die gleiche Statistikkomponente kann den Verlauf initial einklappen; im Kundendossier sind echte KPIs zuerst sichtbar und der Zeitverlauf bleibt über seine zugängliche Aktion erreichbar. Keine Datenberechnung geändert.

Weitere Browserbefunde desselben Laufs:
- Chromium: neuer Einklapptest klickte hinter einem korrekt sperrenden Formular-Dialog. Keine Force-Clicks eingeführt. Bei Dialogen prüft das Gate jetzt Fokusbesitz und Pointer-Sperre, ausserhalb von Dialogen weiterhin das tatsächliche Einklappen und die Inhaltsbreite.
- WebKit: historischer Test verlangte dasselbe graue Glassmaterial für Header-Aktionsgruppe und Bottom-Navigation. Neue Vorgabe verlangt weisse Header und schützt gleichzeitig die bestehende Navigation. Das Gate prüft nun den opaken Header separat und die unveränderten expliziten Light-/Dark-Glasswerte der Navigation. Keine Navigationstokens/-referenzen geändert.

Der Vergleich zeigt auch noch offene Marketing-Abweichungen: der vorhandene `ProductPreview` baut Kennzahlen und Listen mit fest eingetragenen Beispieldaten nach; der grosse inverse Produktabschnitt entspricht nicht der weissen Referenz. Das ist kein echter Produkt-Screenshot und noch nicht als erledigt gewertet.

## Produktansichten und Header-Vertrag

Quality #38801108487 bestand beide vollständigen Browserjobs (Chromium/WebKit), Scanner, Build und statische Prüfungen. Die anschliessende Compliance-Auswertung war nicht erfolgreich: 180 Befunde ausschliesslich UX-LAY-003; die bisherige Regel untersagte die ausdrücklich neu beauftragte globale Suche rechts. Keine sonstigen Messbefunde und keine verworfene Evidenz in diesem Lauf. Die Regel erlaubt nun ausschliesslich Suche, optional den echten laufenden Zeittimer, Glocke und Profil in dieser Reihenfolge. Fehlende/duplizierte Suche, zusätzliche Geschäftsaktionen, falsches Timerziel und Aktionen ausserhalb der Gruppe bleiben blockierend; gezielte Browser-Gegenproben ergänzt. Referenz: neuer Auftrag Abschnitt 4 und gebundenes Desktop-Referenzpaket. Kein Gate deaktiviert, keine Screenshot-Baseline ersetzt. Der korrigierte Gesamtprüflauf steht noch aus.

Login, Kundenliste und Kundendetail aus diesem Lauf bei 1440/390 px angesehen: weisse gemeinsame Flächen, direkte Desktop-Bearbeitung und bestehende mobile Navigation vorhanden. Dies ist kein Nachweis sämtlicher Routen/Rollen/Sprachen oder eine pauschale visuelle Abnahme.

Marketing verwendet jetzt tatsächliche Chromium-Produktbilder statt nachgebauter Kennzahlen. Sechs Module sind über die gemeinsame Tab-Komponente und Desktop/Mobile umschaltbar. Alle zwölf Bilder stammen aus isolierten synthetischen Testdaten, ohne produktive Kundeninformationen; `public/product/captures.json` bindet Quellcommit, getesteten Merge, Lauf, Ausgangs-/Ausgabedigest und unveränderten oberen Viewport-Ausschnitt. Die Beispiele bleiben sichtbar als deutschsprachige Beispieldaten bezeichnet. Der grosse inverse Abschnitt ist weiss; Hero, Inhaltsbreite und Aktionen folgen dem Referenzpaket. Bestehende Preis-, Registrierungs-, Demo-, Rechts- und FAQ-Zugänge bleiben erreichbar. Nicht mehr verwendete nachgebaute Vorschau-CSS-Owner entfernt. Browser-Galerietest prüft echten Modul-/Gerätewechsel und geladene Bildquelle. Neue Marketing-Browserprüfung und abschliessende Release-Prüfungen bleiben erforderlich.

## Security-Triage vor Release

GitHub-Security-Ansicht am 15.10.2026 gelesen (Connector unterstützt diese Alert-API nicht): 10 offene Code-Scanning-Befunde auf Main, ein Dependabot-Alert, keine offenen Secret-Scanning-Befunde. Ein erfolgreicher CodeQL-Job wird nicht mit einer leeren Alertliste gleichgesetzt.

- #11/#12/#15/#26: Test-/QA-Berichte schrieben unmittelbar auf vorhersehbare Zielnamen. Die vier bestehenden Werkzeuge verwenden jetzt den bereits eingeführten privaten atomaren `writeTestOutput`-Owner. Eine Symlink-Gegenprobe bestätigte: Originalziel bleibt unverändert, Ergebnis ist eine reguläre Datei mit 0600. Browser-/QA-Funktionen und Evidenznamen bleiben erhalten.
- #25: Service Worker akzeptierte SKIP_WAITING ohne Absenderprüfung. Nur ein Window-Client derselben Origin darf nun aktivieren. Lifecycle-Test prüft fremde Origin, Worker-Absender und fehlenden Absender negativ sowie den echten gleichursprünglichen Window-Pfad positiv. Weiterhin kein sichtbarer Updatebanner und kein Reload laufender Entwürfe.
- #24: bedingte Zusatzautorisierung eines optionalen Datei-Filters, kein belegter Bypass. Unbedingtes documents:read, Mandantenkriterium und Ausschluss jedes nicht lesbaren Dateizwecks gelten auch ohne Filter. Ergänzter tatsächlicher Route-/Datenbanktest: HR darf Dokumente listen, sieht die Kundendatei ohne Filter nicht und erhält mit Kundenfilter 403. Bestehende Cross-Tenant-/Download-Gates bleiben erhalten; Migrationstest bestanden. Kein Rollenrecht erweitert, keine Meldung pauschal unterdrückt.
- #2: historischer Browser-SaaS-Store; Datei bereits in `747558a8d4833856553bd1a0a8da5b258118ea70` gelöscht. Im aktuellen Git-Baum nicht vorhanden. Kein produktiver Pfad dieses Befunds; Alert bleibt bis zur nachvollziehbaren GitHub-Auflösung sichtbar.
- #21/#22: aus Repositorydateien abgeleitete synthetische HTTP-Proben an ausdrücklich isolierten lokalen Servern. Erster Server ohne DATABASE_URL; zweiter mit validierter leerer lokaler Testdatenbank. Keine frei wählbare externe Zieladresse und keine Übertragung produktiver Datensätze.
- #23: vorgesehenes Stripe-Readinesswerkzeug liest die berechtigt bereitgestellte private Konfiguration und authentifiziert ausschliesslich GET-Abfragen an api.stripe.com. Kein Zahlungs-/Nachrichtenversand dieses Releases ausgeführt.
- Dependabot #1: braces, ausschliesslich Entwicklungswerkzeuge; exakte befristete Ausnahme GHSA-vfj7-8cjw-p6xm bis 24.10.2026 bleibt im bestehenden Security-Gate erzwungen. Produktionsaudit ohne bekannte Schwachstelle. Nicht als behoben ausgegeben.

Die Korrekturen benötigen den vollständigen erneuten CI-Lauf auf ihrem tatsächlichen Commit. Keine Alerts ungeprüft geschlossen und keine Security-Analyse deaktiviert.

## Gesicherter Rückweg

Letzter nachgewiesen funktionsfähiger Release vor diesem Paket: `116ad260d98123b433449f5d53f47f64b09827c5`, Quality #38787452134 und Azure-Deploy #38791178281. Health/Readiness des vorhandenen Azure-Ziels stimmen damit überein. Geprüftes Git-Bundle der Ausgangshistorie vorhanden. Dieses Paket enthält keine Migration oder produktive Datenänderung. Rückweg gemäss `docs/production-rollback.md`: Code per zulässigem Revert-PR auf diesen geprüften Tree zurückführen, Quality für den neuen aktuellen Main-Commit vollständig erfolgreich durchführen und dessen gebundenes Artefakt über den vorhandenen Azure-Workflow ausliefern. Danach Version/Health/Readiness und sichere Kern-Smokes erneut prüfen. Keine rückwärtige Datenmigration. Dies dokumentiert den Rückweg, keine praktisch durchgeführte Rollbackprobe.

PR-CodeQL #33 beanstandete die Regex-Entfernung externer Script-Tags im neuen Referenzrenderer. Dieser unnötige Schritt ist entfernt: die versionierten freigegebenen Referenzen behalten ihre beabsichtigten Inline-Interaktionen; sämtliche Remote-Ressourcen werden bereits durch die eigene Context-Route gesperrt. Dies ist kein Sanitizer für fremdes HTML und kein Produkt-Renderpfad. Kein Scanbefund unterdrückt; CodeQL muss die Korrektur auf dem aktuellen Commit bestätigen.
