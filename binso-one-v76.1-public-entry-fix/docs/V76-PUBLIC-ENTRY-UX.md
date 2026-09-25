# V76 – Public Entry UX, Login, Onboarding und Marketing-Screenshots

## Ziel

V76 verbessert die sichtbare Einstiegsstrecke von Binso One. Die Darstellung der authentifizierten Kundenanwendung bleibt unverändert. Funktionale Erweiterungen innerhalb der Anwendung sind weiterhin möglich, aber Navigation, Hell-/Dark-Modus und bestehende In-App-Designsprache werden durch V76 nicht neu gestaltet.

## Enthalten

- neue Landingpage mit klarerer Produktpositionierung und weniger Marketingfloskeln
- überarbeitete Login-Maske mit sichtbarem Microsoft-Anmeldeweg
- Registrierung mit klaren, wenigen Pflichtangaben
- geführtes Onboarding in drei kurzen Schritten
- optionale Firmenadresse und UID im Onboarding; Werte werden beim Erstellen des Unternehmens übernommen
- einheitliche Produktsprache und zentrale Marketing-Inhalte
- Cookie-/Consent-Verhalten nur dann als Banner, wenn optionale Statistik tatsächlich aktiviert ist
- explizite Favicon-, Apple-Icon- und Metadaten-Konfiguration
- echte Screenshot-Pipeline mit Playwright für Landingpage, Login und zentrale Produktseiten
- Marketing-Screenshot-Komponente: verwendet echte Dashboard-Screenshots, sobald sie erzeugt wurden; sonst fällt sie auf die vorhandene Produktvisualisierung zurück
- zusätzliche V76-Checks für CI

## Onboarding

Das Onboarding ist bewusst kurz:

1. Angaben prüfen
2. Unternehmen optional ergänzen
3. Binso One starten

Logo, Bankverbindung, Vorlagen, Mitarbeitende und weitere Einstellungen werden nicht beim ersten Einstieg erzwungen. Sie können später ergänzt werden.

## Cookie-/Consent-Regel

`NEXT_PUBLIC_OPTIONAL_ANALYTICS=false` ist der Standard. Solange keine optionale Statistik aktiv ist, erscheint kein unnötiger Consent-Banner. Über den Footer können die Cookie-Informationen trotzdem geöffnet werden.

Erst wenn optionale Statistik technisch eingebunden und dokumentiert ist, darf `NEXT_PUBLIC_OPTIONAL_ANALYTICS=true` gesetzt werden.

## Marketing-Screenshots

Lokal ausführen:

```powershell
pnpm marketing:screenshots
```

Die Screenshots werden deterministisch nach `public/marketing/screenshots/` geschrieben. Erfasst werden Desktop und Mobile für:

- Landingpage
- Login
- Dashboard
- Kunden
- Angebote
- Aufträge
- Zeiterfassung
- Rechnungen

Die Produktseiten werden mit der echten Binso-One-Oberfläche im lokalen Demo-Modus aufgenommen. Für Live-Demos auf einer Nicht-Produktionsumgebung bleibt zusätzlich der bestehende geschützte Demo-Mandant verfügbar.

## Sprachstandard

- Deutsch Schweiz
- kurze, klare Sätze
- bekannte Begriffe aus dem Arbeitsalltag
- keine KI- oder Marketingfloskeln
- gleiche Begriffe in Landingpage, Login, Onboarding, Hilfe und Kundenbereich
- primär: Kunde, Angebot, Auftrag, Zeiterfassung, Rechnung, Mitarbeitende, Abonnement, Support
