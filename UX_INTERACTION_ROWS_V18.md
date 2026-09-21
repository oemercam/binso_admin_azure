# Binso Admin v18 – Interactive Row Standard

## Grundregel
Wenn ein Listeneintrag genau ein primäres Detailziel besitzt, ist die gesamte Zeile klick- bzw. tappbar. Der Chevron rechts ist nur ein visueller Hinweis und keine separate kleine Touch-Fläche.

## Angewendet auf
- Kunden
- Mitarbeitende
- Angebote
- Aufträge
- Rechnungen
- Mitarbeiter-/Leistungserbringer-Regeln innerhalb eines Auftrags

## Bewusst nicht angewendet
Zeilen mit mehreren gleichwertigen Inline-Aktionen oder Mehrfachauswahl bleiben normale Zeilen. Beispiele:
- Zeiterfassung mit Checkbox/Freigabeaktion
- Kreditoren mit Freigeben/Bezahlt-Aktion
- Nachweise mit Prüfaktion

Dadurch verhindert die Anwendung versehentliche Navigation, wenn der Benutzer eigentlich eine Inline-Aktion ausführen will.

## Accessibility
- Maus/Tap auf gesamte Zeile
- Tastatur: Enter oder Leertaste bei action-basierten Zeilen
- Link-basierte Zeilen bleiben semantische Links
- sichtbarer Focus-State
- mindestens 44 px Touch-Ziel auf Mobile/PWA
