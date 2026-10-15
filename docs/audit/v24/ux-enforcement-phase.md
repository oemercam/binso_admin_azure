# UX enforcement – 15.10.2026

## Basis und Integration

Main: `746374485f81a376a56e4d8c6141ba0d41dfbbfc`; vorhandener V24-Kandidat PR #253: `de9bf8ed67ad854cce8e6355d73d380346ad1ab1`. Offene Vorgänger #251/#252 sind im Kandidaten enthalten und dürfen nicht separat erneut implementiert werden. Issue #238 bleibt die vollständige Produktionsabnahme. Main wurde integriert; Konflikte waren ausschliesslich generierte Architekturberichte, neu erzeugt mit dem vorhandenen Generator. Keine fachlichen Konflikte aufgelöst durch Überschreiben.

## Vertrag und Matrix

`ux-contract.json` verbindet zwölf Regelbereiche mit vorhandenen Eigentümern, Kriterien und offenen Nachweisen. Es ist ein erster maschinenlesbarer Vertragsstand, noch kein vollständig präzisierter Vertrag für jede Unterregel. `ux-token-snapshot.json` enthält die tatsächlichen Werte und Theme-Kontexte der vorhandenen Tokens. Neue Festlegung dieses Pakets: gemeinsame Fokusfarbe auch für Auth-/öffentliche Formulare = `--app-accent`; Fehlerfarbe hat Vorrang. Keine weiteren ungeprüften Werte erfunden.

`page-matrix.json` enthält alle 76 Quellseiten, Layouts, statisch erreichbare Komponenten, Rollenhinweise, Overlay-Kandidaten sowie zwölf Operator-Dispatchvarianten. Jeder Eintrag weist Mobile/Tablet/Desktop, Themes, Sprachen und Datenzustände ausdrücklich als noch nicht geprüft aus. Fehlende konkrete Action-/Zustands-/Referenzzuordnungen bleiben offen. Der AST-Graph kann bedingte Komponenten erfassen, beweist aber keine tatsächliche Darstellung. Systemdateien sind separat aufgeführt.

## Nachgewiesener Codebefund UX24-RC-001

- Stellen vor Änderung: `app/styles/base.css` input/select/textarea focus; `app/styles/app.css` app-root/operator-root/sheet/header focus; `app/styles/responsive.css` mobile focus-visible.
- Ursache: konkurrierende Fokus-Eigentümer. Basis verwendete Textfarbe, Portale Akzentfarbe; die spätere responsive `:focus-visible`-Regel konnte den roten Invalid-Outline überschreiben. Der konkrete Browserzustand vor Änderung wurde nicht gemessen; behauptet wird der nachgewiesene Kaskadenkonflikt, keine rückwirkende Geräteabnahme.
- Zentrale Lösung: Basis besitzt normalen und Invalid-Fokus; Fehlerregel mit `:root` bleibt gegen Dark-Control-Border wirksam. Drei lokale/portalweite Fokus-Overrides entfernt. Bestehende Invalid-Border-Regeln anderer Kontexte bleiben bis zum umfassenden Kaskadenabgleich erhalten.
- Betroffene Seiten: alle über die bestehenden zentralen Stylesheets versorgten Formularflächen, inklusive Auth, Kunde und Operator. Rechte/Handler/Datenfluss unverändert.
- Nachweis: AST-/PostCSS-Vertragsprüfung plus vorhandene Foundation-/Navigationstests. Browserabnahme und physische PWA separat dokumentieren.

## Entscheidungen und Konflikte

V24 vom 15.10.2026 nennt Glass auch für die Bottom-Navigation. Der aktuelle Auftrag vom selben Tag schützt sie ausdrücklich und verbietet, aus allgemeinen Glass-Regeln Änderungsfreigabe abzuleiten. Für dieses Paket gilt deshalb der eingefrorene vorhandene Navigationsstand; keine Referenz erneuert. Ältere Layout-/KPI-/Plus-Vorgaben in der Historie werden nicht pauschal neu interpretiert. Eine vollständige Quellenkonfliktliste ist noch offen.

## Technische Durchsetzung

Bestehende ESLint-Owner-Regeln, CSS-Importreihenfolge, verbotene Legacy-Styles und Navigationsgates bleiben aktiv. `ux:contract` ergänzt echte AST-Routen-/Komponentenparität und PostCSS-Fokusownership. Neue Seiten oder geänderte Besitzer ohne aktualisierte Matrix schlagen fehl. Dies verhindert keine beliebigen semantisch konkurrierenden Komponenten und ist keine visuelle Abnahme. Die bestehende Architekturprüfung wird nicht durch textbasierte Platzhalter ersetzt.

Das Gate läuft im bestehenden `test` und bei relevanter Fast-QA. Kein zusätzlicher kompletter Browserlauf nach jeder Änderung. Bestehende gebündelte Release-/Security-/DB-/Quality-Gates aus #253 bleiben erhalten. Keine Produktionsbereitstellung, Migration oder Infrastrukturänderung.

## Offen / Release-Bereitschaft

Nicht releasebereit als vollständige UX-Abnahme. Offen: vollständige atomare Regelpräzisierung, seitenbezogene Aktions-/Zustandslogik, Farb-/Spacing-Ausnahmen, vollständige Legacy-/Cascade-Bereinigung nach Verwendungsnachweis, freigegebene Referenzbindung, Rollen-/Sprach-/Datenmatrix, vollständige Geschäftsprozessprüfung und reale iOS-/Android-PWA-Abnahme. Ein grüner Build oder dieses statische Inventar schliesst diese Punkte nicht.

## Prüfergebnisse dieses Pakets

Bestanden: Frozen Install pnpm 10.17.1; Produktionsbuild (141 generierte Seiten inkl. Framework/API-Routen); TypeScript; vollständiger ESLint; CSS-Architektur; Dokumentations-/Releasechecks; UI-Foundation; Navigation-Contract und -Foundation ohne Snapshot-Neugenerierung; Theme; Glass; QA-Plan; neues UX-Vertragsgate. Die 141 Build-Einträge sind keine 141 abgenommenen UX-Seiten.

Blockiert/fehlgeschlagen: vollständiges `pnpm test` am File-Scanner-Socket `listen EPERM`; kein Gate entfernt. Route/CSS-HTTP-Prüfung liefert lokal `fetch failed`, auch nach Start auf explizitem Loopback-Port. Browserinstallation scheitert am ungültigen/trunkierten Downloadarchiv; Browser-Lauf nicht durchgeführt. Keine echte Geräteprüfung, keine neue Pixel-Freigabe, kein RLS-/DB-/Geschäftsprozessnachweis dieses Pakets.

## Zentrale Token-Durchsetzung und Deploy-Freigabe – 15.10.2026

Nutzerfreigabe um 20:24:41 Europe/Zurich: „ja dann mach doch ohne zu fragen bis deploy“. Dies autorisiert Merge, bestehende vollständige Release-QA und anschliessenden Deploy des geprüften Stands; es erklärt fehlende Nachweise nicht zu bestandenen Anforderungen. Der bestehende begrenzte Entwicklungsumfang und alle Pflicht-Gates bleiben unverändert.

17 bereits verwendete Button-/Titel-/KPI-Werte sind als semantische Tokens zentralisiert; 18 atomare CSS-Bindungen werden im bestehenden UX-Vertragsgate geprüft. Werte und Responsive-Overrides bleiben erhalten. Die Navigationstoken/-quellen und Referenzen wurden nicht verändert. Gegenprüfungen verwerfen rohe Ersatzwerte, fremde Token-Aliase, lokale Fallbackwerte, fehlende und doppelte Eigentümer sowie dokumentationswidrige Tokenwerte. Dies ist technische Durchsetzung für diese konkreten Bindungen, kein allgemeiner Beweis für alle CSS-Regeln.

Befund UX24-RC-002: `.form-field` setzt in app.css einmal in der zentralen Gruppendefinition und später nochmals separat `grid-template-columns:minmax(0,1fr)`. PostCSS-Inventar zeigt exakt diese zwei identischen Deklarationen ohne zwischenliegenden Grid-Owner für diesen Selektor. Die spätere identische Regel wurde entfernt. Browserregression bleibt für das neue Paket verpflichtend.

Historischer Paketnachweis auf Head 7b4b3b46: Quality 38778531197 vollständig erfolgreich, inklusive Chromium/WebKit/Scanner und Schlussgate. WebKit bestand erst im gezielten Wiederholungslauf; sporadischer Kunden-Recovery-Timeout bleibt offen. Der Nachweis gilt nicht automatisch für die neuen Tokenänderungen.

Der atomare Vertrag hat nun 30 Regeln; vollständige fachliche UX-/V24-/Geräteabnahme bleibt offen. Diese Offenheit darf beim Entwicklungsdeploy nicht in eine behauptete vollständige Umsetzung umbenannt werden.
