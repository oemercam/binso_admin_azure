BINSO ONE – NEUEN FREIGEGEBENEN UX-STANDARD VOLLSTÄNDIG UMSETZEN

Repository: oemercam/binso_admin_azure

AUFTRAG UND FREIGABE

Die bisherige Entwicklung wurde von mir als ZIP heruntergeladen.
Erstelle keine erneute vollständige ZIP-Sicherung als Voraussetzung.
Erfasse vor Änderungen trotzdem den aktuellen Commit und Arbeitsstand
und sichere zulässige bestehende Änderungen nachvollziehbar in Git.
Arbeite in einem eigenen Feature-Branch.

Setze jetzt den freigegebenen neuen UX-Standard tatsächlich im bestehenden
Produkt um: Landingpage, Kundenportal, Adminportal und sämtliche Unterseiten,
Formulare und Systemzustände.

Die Freigabe umfasst Implementierung, Fehlerkorrekturen, PRs, zulässigen
Merge und Produktivdeploy nach erfolgreichen Pflichtprüfungen.

1. VERBINDLICHE GRUNDLAGEN

- Bestehender V24-Master für Fachfunktionen, Sicherheit und Architektur.
- Die zuletzt freigegebenen Designvorschauen aus dem UX-Gespräch.
- Die folgenden konkreten Designentscheidungen haben Vorrang vor älteren,
  widersprüchlichen Gestaltungsvorgaben.

Freigegebene Gestaltung:
- Eigenständige BINSO-ONE-Oberfläche in Microsoft-365-inspirierter Richtung.
- Light Mode vollständig mit weissen Grundflächen: Seite, Header,
  Navigation und Inhaltsbereiche.
- Keine grossflächigen grauen Hintergründe.
- Dezente blaue Akzente für Fokus, Hover, Auswahl und geeignete Aktionen.
- Klare Typografie, abgestimmte Schriftgrössen, gut lesbare Beschriftungen,
  präzise Ausrichtung und konsistente Abstände.
- Originale Binso-Logos und Assets; keine erfundenen Ersatzlogos.
- Dark Mode als konsistente eigene Variante.
- Gemeinsame Grundkomponenten, aber unterschiedliche Bedienung und Layouts
  für Desktop, Mobile/PWA und Marketingseiten.

Die Vorschauen zeigen die Gestaltung. Ihre Platzhalter, Beispieldaten,
vereinfachten Diagramme und unvollständigen Interaktionen dürfen nicht
als fertige Produktimplementierung übernommen werden.

Sind die Referenzansichten nicht zugänglich, benenne genau, welche fehlen.
Behaupte keine exakte Übereinstimmung ohne Referenz.

2. AKTUELLEN STAND PRÜFEN

- Aktuellen Main-Stand, Arbeitsbranch, offene PRs und relevante Issues prüfen.
- Bereits integrierte Korrekturen berücksichtigen.
- Vorhandene Komponenten, Tokens, Stylesheets, Layouts und Tests erfassen.
- Ursachen bestehender Abweichungen untersuchen:
  CSS-Kaskade, Importreihenfolge, Spezifität, doppelte Overrides,
  konkurrierende Komponenten und lokale Sonderimplementierungen.
- Vorhandene Arbeiten bewahren; keine fremden Änderungen verwerfen.
- Keine parallele UX-Foundation erstellen.

3. ZENTRALE FOUNDATION UMSTELLEN

Bestehende geeignete Komponenten konsolidieren und zentral anpassen:

- Typografie, Farben, Spacing, Inhaltsbreiten und Breakpoints.
- Buttons, Iconbuttons, Links und Aktionsgruppen.
- FormField, Input, Select, Textarea, Checkbox, Radio und Switch.
- Dateiupload mit dem freigegebenen dezenten Dateiauswahl-Button.
- Listen, Tabellen, Detailzeilen, Settings-Zeilen und Status-Badges.
- Header, Navigation, Tabs, Suche, Filter und Sortierung.
- Sheets, Dialoge, Popover und Seitenpanels.
- KPI, Ring/Donut, Linien-/Balkendiagramme, Tooltip und Drilldown.
- Loading, Empty, Error, Success, Toast, Undo und fehlende Berechtigung.

Regeln:
- Zustände für Fokus, Hover, Pressed, Disabled, Loading und Fehler einheitlich.
- Trennlinien nur zwischen Einträgen, niemals nach dem letzten Eintrag.
- Keine doppelten Rahmen oder Trennlinien.
- Keine unnötigen Cards in Cards.
- Keine seitenspezifischen CSS-Workarounds.
- Wiederkehrende Aktionen zentral nach Rolle und Datensatzstatus definieren.
- Fachlich erforderliche Varianten ausdrücklich definieren.

4. DESKTOP-STANDARD

- Linke Navigation standardmässig offen und manuell einklappbar.
- Firmen-/Arbeitsbereichsauswahl klar positioniert.
- Globale Suche, Benachrichtigungsglocke und Profil-Avatar oben rechts.
- Fachliche Aktionen in einer gemeinsamen Aktionsleiste im Seitenarbeitsbereich.
- Position und Reihenfolge der Aktionen auf vergleichbaren Seiten gleich.
- Eine hervorgehobene Hauptaktion, weitere Aktionen dezent daneben
  beziehungsweise unter „Weitere Aktionen“.
- Import/Export kontextbezogen und konsistent einordnen.
- Keine einzeln übereinander umbrechenden Buttons.
- Bei Platzmangel die Aktionsgruppe kontrolliert umstellen oder sekundäre
  Aktionen in ein Menü überführen.
- Keine permanente Toolbox-Spalte auf allen Seiten.
- Zusätzliche Panels nur bei Bedarf.
- Keine Bottom Sheets auf Desktop; Dialog, Popover, Seitenpanel oder Arbeitsseite.
- Lokale Suche, Filter, Sortierung und Status-Tabs direkt bei den Daten.
- Tabellen und Detailansichten nutzen die verfügbare Breite sinnvoll.
- Keine erzwungenen Drei-Spalten-Layouts oder überbreiten einfachen Listen.
- Dokumentbearbeitung und Vorschau fachlich passend kombinieren.
- Dokumentwerkzeuge wie Seitenwechsel und Zoom direkt am Dokument.
- Filter, Auswahl und Scrollposition beim Zurückkehren erhalten.

5. MOBILE-/PWA-STANDARD

- Kompakte App-Ansichten entsprechend den freigegebenen Vorschauen.
- Bestehende Bottom-Navigation in Design, Reihenfolge, Funktion und
  Animation unverändert bewahren.
- Die schematische Navigation der Vorschauen ist kein Ersatz dafür.
- Einheitlicher Hauptseitenheader mit Original-Branding, Suche, Glocke, Avatar.
- Detailseiten mit klarer Zurück-Navigation und rechtsbündigen Aktionen.
- Kontextbezogener schwarzer runder Plus-Button mit weissem Plus.
- Datensatz öffnen durch Antippen; weitere Aktionen unter ···.
- Suche links, Filter rechts daneben; Tabs in eigener horizontal scrollbarer Zeile.
- Zentrale Action-, Selection-, Filter- und Form-Sheets.
- Sheets inhaltsabhängig dimensionieren; keine unnötigen Leerflächen
  und keine doppelten Titel.
- Tastatur, Safe Areas, Footer-Aktionen und Scroll-Verhalten zentral lösen.
- Kein horizontaler Seitenoverflow und keine verdeckten Inhalte.
- Tablet nach verfügbarem Platz sinnvoll zwischen den Layouts behandeln.

6. ALLE BEREICHE UMSTELLEN

Vollständiges Routen- und Zustandsinventar aus dem Repository erstellen.
Bestehende und laut V24 erforderliche Bereiche abgleichen:

Öffentlich:
- Landingpage, Funktionen, Ablauf, Preise, FAQ, Kontakt und rechtliche Seiten.
- Vorhandene weitere öffentliche Seiten und Statusseite konsistent behandeln.
- Landingpage mit echten Produktansichten statt erfundenen Screenshots.
- Anmeldung gut sichtbar; Adminzugang nicht als primäre Marketingaktion.
- SEO, Metadaten und Übersetzungen erhalten.

Zugang:
- Login und Logout.
- Registrierung und E-Mail-Verifikation.
- MFA-Einrichtung, Codeprüfung und Wiederherstellung.
- Passwort vergessen und neues Passwort setzen.
- Einladungen, Onboarding und Firmeneinrichtung.
- Abgelaufene Links, ungültige Codes, Session-Ablauf und gesperrte Konten.

Kundenportal:
- Dashboard.
- Kunden und Kontakte.
- Angebote.
- Aufträge und Projekte.
- Rechnungen, Zahlungen, Mahnungen und Gutschriften.
- Zeiterfassung und Spesen.
- Produkte.
- Personal und Mitarbeiterdetails.
- Lohn, MWST und Berichte.
- Dokumente.
- Support und Chat.
- Profil, Firma, Benutzer/Rollen, Sicherheit und Geräte.
- Benachrichtigungen, Sprache/Darstellung, Abo und Abrechnung.

Adminportal:
- Dashboard, Mandanten und Benutzer.
- Abos, Zahlungen und Billing-Übersicht.
- Support/Tickets.
- Monitoring/Wallboard, Logs und Audit.
- Integrationen, Jobs, Plattformsettings und Wartungsmodus.
- Alle weiteren vorhandenen Adminseiten und erlaubten Aktionen.

Systemzustände:
- 404, unerwarteter Fehler, Wartung und Offline.
- Loading, keine Daten, keine Treffer, fehlende Berechtigung.
- Erfolgs-, Validierungs- und Wiederherstellungszustände.

Für jede Seite Übersicht, Detail, Erstellen, Bearbeiten und Aktionen prüfen,
soweit fachlich anwendbar. Fehlende Fachfunktionen getrennt dokumentieren.
Keine funktionslosen Bedienelemente als fertig darstellen.

7. WICHTIGE FACHANSICHTEN

Kennzahlen und Diagramme:
- Gleiche KPI-/Chart-Foundation in allen Bereichen.
- Maximal vier primäre KPIs, weitere über „Mehr anzeigen“.
- Ringe nur für Anteile/Fortschritt.
- Ringwert und zugehöriges Label exakt im Zentrum ausrichten.
- Legende vertikal und horizontal sauber ausrichten, Farben korrekt zuordnen.
- Einheitliche Abstände, Zahlenformate, Tooltip und Drilldown.
- Reale fachliche Datenquellen verwenden; keine erfundenen Kennzahlen.

Zeiterfassung:
- Timer/Einträge, Kunde/Projekt, Start/Pause/Stop.
- Heute-Summe und manuelle Erfassung.
- Einträge mit Suche, Filter, Gruppierung und Status.
- Keine dekorative Timer-Kreisgrafik.
- Laufzeit bei Navigation und Wiederöffnung korrekt erhalten.

Rechnungen/Angebote:
- Klare Liste mit Nummer, Kunde, Datum, Betrag und Status.
- Detail mit Positionen, MWST, Total und Zahlungsfrist.
- Korrekter Zahlungsstand; bei bezahlt Bezahldatum anzeigen.
- Vorschau Mobile über weitere Aktionen.
- Desktop mit geeigneter Arbeits-/Dokumentansicht.
- Eine Dokumentseite gleichzeitig; Seitenwechsel für weitere Seiten.
- Schweizer QR-Rechnung und bestehende Dokumentlogik erhalten.

Benachrichtigungen/Profil:
- Kompakte konsistente Einträge mit lesbarem Inhalt und Zeitangabe.
- Ungelesen-Zustand und Öffnen des zugehörigen Vorgangs.
- Keine zusätzliche Aktion „Als gelesen markieren“.
- Profilbearbeitung, Firmenwechsel, Sicherheit, Geräte und Einstellungen verbinden.

Supportchat:
- Klarer Chatverlauf, Anhänge, Zustell-/Fehlerstatus und Retry.
- Eingabe auf Mobile bei geöffneter Tastatur erreichbar.
- Kein erzwungenes Scrollen beim Lesen älterer Nachrichten.

8. APP-VERHALTEN

- Dezentes unmittelbares Pressed-/Hover-/Fokusfeedback.
- Gemeinsame Motion-Tokens und ruhige Übergänge ohne Layoutsprünge.
- Reduced Motion beachten.
- Loadingfeedback und Doppelsubmit-Schutz.
- Eingaben bei Fehlern erhalten.
- Datenverlustschutz bei ungespeicherten Änderungen.
- Fokusführung, Escape/Back und Scroll-Lock für Overlays.
- Gesten nur dort einsetzen, wo sie zuverlässig und konfliktfrei funktionieren.
- Keine sichtbaren PWA-Update-Banner.
- Barrierefreiheit, Tastatur und Screenreader berücksichtigen.
- DE/FR/IT/EN/TR sowie lange Inhalte prüfen.

9. FUNKTIONEN BEWAHREN UND ALTLASTEN ENTFERNEN

Erhalte bestehende:
- Geschäftslogik, Statusmaschinen und Datenflüsse.
- Authentifizierung, Rollen und Tenant-Isolation/RLS.
- APIs, Migrationen und Daten.
- Stripe, Microsoft Graph, Entra und Azure-Integrationen.

Entferne nach geprüfter Ablösung:
- konkurrierende UI-Komponenten
- ungenutzte Styles und Layouts
- doppelte Overrides
- überholte UX-Patterns und widersprüchliche Dokumentation

Keine pauschale Löschung alter Projektverzeichnisse.
Keine Secrets veröffentlichen, produktiven Daten löschen oder
Sicherheitskontrollen deaktivieren.

10. AUTONOM BIS ZUM PRODUKTIVDEPLOY

Arbeite selbstständig:
Analyse → zentrale Umsetzung → lokale Prüfungen → PR →
GitHub-Prüfungen → Merge → Main-Prüfungen → Deploy → Liveprüfung.

- Auftragsrelevante Code-, Test-, Build-, Workflow- und Deployfehler
  anhand der tatsächlichen Logs analysieren und korrigieren.
- Nach Änderungen die betroffenen Prüfungen erneut ausführen.
- Nicht nach dem Start eines Workflows aufhören.
- Keine vollständige Browser-Suite nach jeder Kleinänderung:
  gezielte Checks pro Änderungspaket, vollständige Release-QA am Ende.
- Pflicht-Gates, Security-Scans, Reviews und Branch-Schutz respektieren.
- Keine Prüfungen deaktivieren, Fehler verschweigen oder Referenzen
  lediglich zum Erzwingen grüner Ergebnisse ändern.
- Andere offene PRs nicht ungeprüft mergen oder schliessen.

Deploy nur, wenn:
- verpflichtende Prüfungen für den konkreten Release-Commit erfolgreich sind
- keine releaseblockierenden Security-Befunde offen sind
- notwendige Reviews und Merge-Voraussetzungen erfüllt sind

Nach Deploy:
- Deploymentstatus kontrollieren.
- Ausgelieferten Commit/Version zuordnen.
- Health/Readiness und relevante Live-Smoke-Tests durchführen.
- Bei Betriebsbeeinträchtigung den gesicherten sicheren Rollback verwenden.

Keine echten Zahlungen oder externen Testnachrichten auslösen.
Keine neuen kostenpflichtigen Ressourcen, grundlegenden Zugriffsänderungen
oder risikoreichen produktiven DB-/Infrastrukturänderungen ohne separate Freigabe.

Nur bei einer tatsächlichen, nicht selbst lösbaren Blockade eine konkrete
Nutzeraktion anfordern. Ursache und bereits versuchte Lösungen nennen.
Keinen Erfolg behaupten, solange die Blockade besteht.

11. NACHWEISE UND ABSCHLUSS

Dokumentation unter docs/audit/v24/ fortführen:
- Ausgangsstand
- verbindlicher neuer UX-Standard
- vollständige Seiten-/Zustandsmatrix
- zentrale Komponenten und entfernte Altlasten
- Root Causes und Korrekturen
- Prüfergebnisse und offene Risiken

Status strikt unterscheiden:
Entworfen → implementiert → geprüft.

Abschluss liefern mit:
- PRs und finalem Commit
- umgesetzten Bereichen und verbleibenden Lücken
- Quality-/Security-Ergebnissen
- Deploy-Lauf, ausgelieferter Version und Liveprüfung
- produktiver URL
- vollständigem neuem Quellcode-ZIP ohne Secrets oder Build-Abhängigkeiten

Beginne jetzt mit dem aktuellen Repository-Stand und setze den Auftrag um.
Stoppe nicht nach einer Planung oder Dokumentation.