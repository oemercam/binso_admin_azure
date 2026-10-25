# Gemeinsame Inhaltskarten – Owner-Auftrag vom 25. Oktober 2026

## Umsetzung

Die bestehende Kundendetailseite ist die Referenz. Bestehende Inhalts-Owner
verwenden zentral dieselbe dünne Umrandung, 16 px Rundung und 16 px Innenabstand.
Navigationsgruppen behalten ihre 48-px-Zeilen, 18-px-Icons, rechts ausgerichtete
Werte und 16-px-Chevrons. Die Gruppenüberschrift steht ausserhalb der Karte.
Trennlinien stehen zwischen Einträgen, nicht nach dem letzten Eintrag.

Der gemeinsame Material-Owner liegt in `app/design-system/layout.css`.
Die bisherigen gegensätzlichen Rahmen-/Inset-Regeln wurden aus den jeweiligen
CSS-Ownern entfernt. Bestehende `WorkspaceSection`, `SettingsGroup`, `ActionRow`,
`ListRow`, Tabellen, Detail- und Formularbereiche werden weiterverwendet.
Es gibt keine zusätzliche Komponentenbibliothek und keine seitenlokale CSS-Datei.

Betroffen sind Dashboard, Finanzübersicht und Diagramme, Datensatzlisten und
Details, Einstellungen einschliesslich Unterseiten, Zeiterfassung sowie die
entsprechenden Admin-Inhaltsgruppen. Eingebettete Tabellen, Diagramme und
Abschnitte besitzen keinen zweiten Kartenrahmen. Bestehende Bereichs-Icons aus
dem Navigationskatalog werden für navigierbare kompakte Informationszeilen
wiederverwendet; reine Datenfelder werden nicht zu fingierten Navigationen.
Rechnungs-/Angebotsdetails, Spesen, Admin-Kontextbereiche und Ankündigungen
verwenden ebenfalls den gemeinsamen Material-Owner. `EntityFiles` übernimmt
zuletzt die bestehende Abschnittsklasse für den Abstand zwischen Belegdaten
und Dateibereich; Upload-, Freigabe- und Löschabläufe wurden nicht verändert.

Öffentliche Website, Authentifizierung, Dokumentausgabe und Dialoggeometrie
behalten ihre bisherigen Owner. Die fachlichen Formulare, Tabellen, Filter,
Sortierungen, Zeit-/Finanzberechnungen, Datenquellen und Berechtigungen bleiben
erhalten. Bottom-Navigation und blauer Floating-Plus-Button sind unverändert.

## Nachweise und Abnahme

`UX24-SURFACE` dokumentiert die neue ausdrückliche Freigabe und ersetzt die
historische Erwartung rahmenloser Inhaltsgruppen. Die Browserprüfung misst
Rahmen, Rundung und Insets in beiden Themes und prüft weiterhin letzte Zeilen,
Überläufe, Formularfelder und Navigationsgeometrie. Gegenproben müssen bei
2-px-Rahmen, 7-px-Rundung, 11-px-Inset und einem verschachtelten zweiten
Kartenrahmen fehlschlagen.

## Lokale Prüfergebnisse

Der geprüfte Arbeitsstand ist ein uncommitteter Nachfolger von
`582f502c527a53721c71fd5f6f17b6ca26310b8b`. Die abgegrenzten Quellfingerprints,
Prüfschritte und verbleibenden Grenzen stehen in [content-cards-qa.json](content-cards-qa.json).

| Prüfung | Ergebnis und Geltungsbereich |
| --- | --- |
| Standardmatrix | 1.020 erfolgreiche Kombinationen: 102 Ansichten, 375/430/820/1024/1440 px, Hell/Dunkel; vorhandene synthetische API-Fixtures |
| Bedienabläufe | Alle 14 bestehenden Ablaufgruppen in beiden Themes erfolgreich, einschliesslich Formulare, Rückwege, Zahlungsergebnisse und acht gleichzeitig geöffneter Zahlungsansichten |
| Letzter Abstandsschritt | Anschliessend 50 erfolgreiche Dateibereich-Kombinationen auf denselben fünf Grössen, beide Themes; Dokument- und Mitarbeiterabläufe nochmals erfolgreich |
| WebKit | Auf dem finalen Stand zwölf erfolgreiche Kunden-/Einstellungs-/Belegansichten bei 390/768 px in beiden Themes; keine physische PWA-Abnahme |
| Finaler Code | Optimierter Build einschliesslich Typprüfung, alle 19 betroffenen Prüfpakete, Lint, CSS-/Quellverträge und lokaler Release-Resolver erfolgreich |
| Tatsächlicher Backend-Stand | Acht PNG-Aufnahmen aus der lokalen Anwendung mit isolierten Testdaten, ohne API-Mocks oder injizierte Darstellung: Einstellungen, Kundenhub, Rechnung und Admin-Dashboard, jeweils 390/1440 px; keine horizontalen Überläufe |

Die Bilder liegen im Workspace-Ordner `V7-Vorschau-20261025` unter
`karten-final-*.png`. Einstellungen mobil/Desktop, Rechnung mobil und Admin mobil
wurden zusätzlich bildlich kontrolliert. Die übrigen Aufnahmen sind technische
Nachweise, keine stellvertretende Owner-Abnahme.

Die Nachprüfung ist bewusst gestuft: Nach dem vollständigen Kartenlauf wurde
nur die zentrale Dateikomponente auf die bereits geprüfte Abschnittsklasse
umgestellt. Dafür folgten die gezielten Datei-/Dokument-/Mitarbeiterprüfungen
und der finale Build; die unveränderten übrigen Seiten wurden nicht nochmals
vollständig wiederholt.

Ein früherer paralleler Matrixlauf scheiterte beim Start-Warten; sein Versuch,
den Seiteninhalt zu protokollieren, lief ebenfalls in ein Zeitlimit. Die
Diagnose bewahrt jetzt den ursprünglichen Fehler. Derselbe Umfang bestand
anschliessend in kleineren Paketen mit unveränderten Assertions und Zeitlimits.
Der abgebrochene Lauf wird nicht als Erfolg gewertet; seine Ursache ist nicht
abschliessend belegt und bestätigt keine Behebung produktiver PWA-Startprobleme.

Abgeleitete Ansichten werden durch die technische Prüfung nicht automatisch
visuell abgenommen. Echte iPhone-/iPad-PWA-, vollständige Sprach-/Rollen- und
Rechtsübersetzungsabnahmen bleiben offen. Nicht alle bedingten Monatsrapport-
und Belegmodal-Zustände wurden nach dem letzten Abstandsschritt einzeln geöffnet.
Die bestehenden Sicherheits-, Finanz- und Freigabegrenzen bleiben verbindlich.

Keine GitHub-Aktionen, produktiven Datenänderungen oder Deployments gehören
zu diesem Auftrag.
