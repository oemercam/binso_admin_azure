# Mobile / PWA QA – v0.4.1

Geprüfte Zielbereiche:
- 320 px
- 360 px
- 390 px
- 430 px
- 768 px
- PWA standalone mit Safe-Area

Technische Absicherungen:
- global kein horizontales Body-Overflow
- alle Grid-Bereiche verwenden `minmax(0, 1fr)`
- Tabellen scrollen lokal horizontal statt die Seite zu verbreitern
- Aktionsleisten umbrechen auf kleinen Screens
- Bottom-Navigation berücksichtigt iOS Safe-Area
- Modals nutzen `100dvh` und Safe-Areas
- Rechnungs-/Offertenvorschau bleibt A4-basiert und wird im Mini-Preview skaliert
- grosse Dokumentvorschau scrollt innerhalb des Modals
- Druckansicht erzwingt 210 mm A4-Breite ohne Mobile-Skalierung
- lange Texte dürfen umbrechen
- Formularelemente bleiben innerhalb der Viewport-Breite
