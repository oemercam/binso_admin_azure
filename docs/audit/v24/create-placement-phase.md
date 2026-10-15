# Erste zentrale Korrektur – Erstellen-Aktionen

Basis: cb1e5574 plus Audit-PR #251. Begrenzter Foundation-Fix zu V24 Abschnitten 3–5; keine Abnahme aller UX- oder Security-Phasen.

## Ursache und Änderung

F001/F002: Der zentrale Dock-Renderer und beide Portal-Shells besassen eine zweite Erstellen-Aktion. Gleichzeitig versteckte responsive.css die vorhandenen Seitenaktionen. Browserprüfungen verlangten genau diese inzwischen überholte Platzierung.

- MobileDock besitzt jetzt ausschliesslich Navigation. Beide Shells verwenden ihn ohne angehängtes Plus.
- QuickCreateAction verwendet ausschliesslich die bestehende CreateAction im Seiten-Aktionsbereich. Der Dashboard-Katalog und seine Berechtigungsprüfung bleiben bestehen.
- Kontextbezogene Listenaktionen werden auf Mobile nicht mehr ausgeblendet. Die gemeinsame Suche-/Filter-Zeile erhält wieder die dritte Spalte für ihre schon vorhandene Erstellen-Aktion.
- Operator-Seitenaktionen bleiben sichtbar, nur der im App-Header bereits vorhandene Titel wird im Seiten-Aktionsbereich ausgeblendet.
- Bestehende Navigationselemente, Reihenfolge, Icons, CSS-Material, Tokens, Zugriff und Scroll-Logik wurden nicht verändert. Die bisherigen beiden Navigation-Hash-Gates bestehen unverändert; kein Referenzsnapshot neu generiert.
- Der obsolete page-create-action-Marker und der Dock-Zweig wurden entfernt. Alte Dock-CSS-Regeln bleiben bis zur dokumentierten Usage-/Browser-Regression erhalten; keine vorschnelle Legacy-Bereinigung.

## Tests und Abnahme

Bestanden: unveränderte navigation-contract-test und navigation-foundation-test; glass-ux-test einschliesslich Rendering des tatsächlichen MobileDock; v23-2-ux-test; css:check; lint und typecheck. Build bestanden; vollständiges Protokoll: qa/phase1-build.txt. Browser-Test wurde gezielt auf den V24-Platzierungsvertrag angepasst: genau ein sichtbares Dashboard-Plus im Seitenbereich, kein Dock-Plus, kontextbezogenes Kunden-Plus und keine Navigation im Formular. Die übrigen Header-/Glass-/Touch-/Fokusprüfungen bleiben aktiv.

**Runtime-/visuelle Abnahme offen:** Der Browser-Testversuch scheiterte bereits vor dem Start an ERR_MODULE_NOT_FOUND für playwright (qa/phase1-browser.txt). Zusätzlich sind lokale Scanner-Listener nachweislich blockiert. Es gibt keinen Browser-Laufzeitnachweis. Das vollständige pnpm-test-Gate ist weiterhin durch den unveränderten Scanner-Test blockiert (F006). Keine Releasefreigabe.

## Offene Punkte

- F001/F002: implementiert, Browser-/CI-Abnahme ausstehend; nicht endgültig geschlossen.
- Rollen-/Readonly-/Plan-Matrix und Operator-Erstellen-Sheets im echten Browser prüfen.
- Gleichzeitige Arbeit in PR #250 vor Integration erneut abgleichen; diese Änderung enthält dessen Code nicht.
- F003–F009 und sämtliche übrigen V24-Anforderungen bleiben offen. Noch keine Chart-, Demo-, Prozess-, i18n-, Security-Control- oder Infrastrukturvollständigkeit behauptet.
- Kein Merge/Deploy/Migration/Produktionszugriff. Produktivfreigabe weiterhin erforderlich.

## CI-Nachtrag

Quality Run 38728122353 für dd491c5e scheiterte in checks am veralteten Source-Fingerprint des bestehenden Integration-Inventars. Das war ein ausgelassener Generierungsschritt, kein Socket-Fehler. `pnpm architecture:inventory` regeneriert die bestehende Datei und Routenmatrix; der unveränderte foundation-integration-test besteht danach lokal. Kein Gate oder Snapshot-Vertrag wurde abgeschwächt.

Im selben Run bestanden CodeQL, scanner-engine (echter ClamAV), Build und authentifizierte sowie anonyme API-HTTP-Prüfungen. DB-Parallelitäts- und Browserjobs waren wegen des fehlgeschlagenen checks-Jobs noch nicht erfolgreich nachgewiesen. Neuer Run bleibt abzuwarten.
