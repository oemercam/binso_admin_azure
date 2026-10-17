# Navigation: begrenztes Referenz-/Accessibility-Paket, 17.10.2026

## Basis und Rangfolge

PR #273 wurde nach ausdrücklicher SHA-Freigabe regulär als 65c2b22589bde8b5b5fe6c87134c57ab241f603b integriert. Vorher wurden Head 65b58cc93d2cf7ddec295cbe958221f2bb75a9fa, erfolgreiche quality/analyze, leere Reviews/Threads und die aktuelle main-Schutzregel geprüft: PR erforderlich, aktuelle Basis, beide GitHub-Actions-Checks, Gesprächsauflösung und kein Admin-Bypass/Force-Push/Löschen. Keine Protection-Änderung und kein Deployment.

Das Microsoft-Original vom 15.10. und die Rangfolge vom 17.10. gelten weiter. Kein neues Referenzpaket, keine neue Foundation. Nächster kontrollierter Teil der Navigation ist die vorhandene Desktop-Bedienung, nicht eine pauschale Neugestaltung des mobilen Docks.

## Nachgewiesene Lücken und Änderung

- Original desktop-login.html nennt am Einklappschalter die nächste Aktion: Navigation öffnen beziehungsweise Navigation einklappen. Der vorhandene DesktopNavigationToggle meldete immer nur Navigation. Jetzt stimmen Name und Tooltip mit dem Zustand überein, einschliesslich EN/FR/IT. aria-expanded und aria-controls bleiben erhalten.
- Support und Einstellungen waren in der Kundensidebar optisch aktiv, meldeten aber kein aria-current. Beide Links melden jetzt page ausschliesslich auf der entsprechenden aktiven Seite.
- Native Buttons, vorhandene Shells und Storage-Präferenz werden weiterverwendet. Keine Navigation entfernt, kein Ziel oder Zugriff geändert, kein CSS/Token verändert.

## Verifikation

Die neue Regression schlug gegen den bisherigen Build tatsächlich beim alten Namen Navigation fehl. Lint, Typecheck, Build, Übersetzungskatalog/Abdeckung, UI-/Referenz-/Integrationsprüfungen und beide bestehenden Navigationsverträge bestanden. Neue Browserprüfungen decken Zustandsname und Controls-Ziel, Space/Enter, Fokuserhalt, Reload sowie den Wechsel Kunden-/Operator-Shell und aktive Support-/Einstellungslinks ab. Die bestehenden Chrome-Regressionen mit Rollen, Schreibschutz, mobilen Touchzielen, Safe Areas und sieben Viewportbreiten bleiben aktiv.

Browserabschluss: 20 Chromium/Edge-Routen-/Viewport-/Theme-Fälle bestanden (Kunden, Support, Einstellungen, Operator und Operator-Kunden bei 390/1440 px in Light/Dark). Die vollständigen vorhandenen Chrome-Interaktionen mit sieben Breiten bestanden in beiden Themes, einschliesslich neuer Zustands-/Persistenz-/Fokusprüfungen. Screenshots der eingeklappten Kunden- und Operator-Shell visuell geprüft. Berechtigungsselbstprüfungen bestanden ebenfalls. GitHub-Pflichtchecks bleiben offen bis zum tatsächlichen CI-Abschluss; offene Checks sind keine bestandene Abnahme. Der neue PR wird ohne weitere Freigabe nicht gemergt.

## Visuelle Nachweise und bewusste Grenzen

Unverändertes Original erneut bei 1440 × 1000 mit gebündelten Icons und blockiertem Remotezugriff gerendert: ux-navigation-reference/desktop-{expanded,collapsed}-1440.png. Nur äussere Body-Abstände/Maximalbreite angepasst; Vorschau-Schalter sind noch sichtbar und keine Produktanforderung. Frühere bereinigte Vergleichsansichten liegen unter ux-next-reference. App-/Operator-Screenshots und Geometrie unter ux-navigation-after. Ausschliesslich synthetische Fixtures, keine echten Tenantdaten.

Die Referenz zeigt die eingeklappte Icon-Leiste. Im Produkt bleiben deren zugängliche 68 px sowie vorhandene Icons, Gruppen, Markenassets und berechtigte Fachziele erhalten. Diese Werte werden hier nicht als neue pixelgenaue Freigabe behauptet. Dark Mode und Operator-Darstellung sind abgeleitet.

Offen bleiben ein gesonderter konkreter visueller Ersatzentscheid für das mobile Glass-/Dock-Design gegenüber der schematischen Vorschau, vollständige physische Geräte-/Releaseabnahme und weitere Formular-/Dokument-/Timer-Pakete. Die alte Bottom-Navigation ist nicht pauschal geschützt; zugleich liegt mit diesem kleinen Semantikpaket kein belegter neuer Ersatz vor. Deshalb bleiben ihre Hashes, Assertions, CSS und Motion unverändert. Keine stillschweigende Baseline-Akzeptanz.
