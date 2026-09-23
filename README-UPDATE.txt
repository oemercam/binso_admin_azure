Binso Admin V20 - Current Full V32

V32 korrigiert Seitenabstände und Kundenübersicht.

Korrektur Seitenabstand:
- Ursache war doppeltes Mobile-Padding: app-main hatte bereits den gleichen Abstand wie das Logo, mobile-standard-page fügte nochmals 16 px hinzu.
- Jetzt besitzt nur app-main den horizontalen Seitenabstand.
- Seiten selbst haben links/rechts kein zusätzliches Padding mehr.
- Dadurch beginnen Überschrift, Listen, Kennzahlen und Inhalte auf derselben vertikalen Linie wie das Logo.
- Gilt zentral für alle Seiten auf Mobile/PWA.

Kunden:
- Mobile Kundenliste zeigt nur Name/Kundennummer sowie kompakt Ansprechperson und Ort.
- Status und Zahlungsziel werden dort nicht zusätzlich gezeigt.
- Kundendetail-Übersicht zeigt nur echte Stammdaten: Kundennummer, Ansprechperson, E-Mail, Telefon und Adresse.
- Zahlungsziel, Status und offener Betrag wurden aus der allgemeinen Kundenübersicht entfernt.
- Angebote/Aufträge/Verträge bleiben als kompakte Dreierzeile bestehen.

Alle bisherigen Anpassungen bleiben enthalten.

Prüfen:
npm run typecheck
npm run lint
npm run architecture:check
npm run actions:check
npm run process:check
npm run build
