# Binso Admin v16 – UX-System

## Fünf Seitentypen
1. **Liste** – finden, filtern, auswählen.
2. **Object/Detail** – Objekt verstehen und in Bereiche wechseln.
3. **Bottom Sheet** – kurze Aufgabe, Auswahl oder 1–4 Felder.
4. **Full-Screen Edit (Mobile/PWA)** – lange Formulare und komplexe Regeln.
5. **Full-Screen Preview** – Angebot, Rechnung, Mahnung und andere Dokumente.

## Plattformregeln
- Desktop: Dialog/Sheet zentriert, nie grösser als Viewport.
- Mobile/PWA: kurze Aufgaben Bottom Sheet, lange Aufgaben Full-Screen.
- Globale Pille wird ausgeblendet, sobald ein Sheet/Dialog offen ist.
- Sticky Header und Sticky Action Bar innerhalb von Formularen.
- Safe Areas oben/unten berücksichtigt.
- Mindest-Touchfläche 44 px.
- Inputs auf Mobile 16 px, damit Safari nicht automatisch zoomt.
- Binäre Zustände verwenden Toggle; Mehrfachauswahl verwendet Checkbox.
- Kein Blur/Fade bei normalen Seitenwechseln; native Scrollmechanik.
- Dokumentvorschau übernimmt den kompletten Bildschirm und blendet App-Chrome aus.

## Zuordnung im Projekt
- Kunden erfassen/bearbeiten: Full-Screen Edit auf Mobile.
- Mitarbeitende erfassen/bearbeiten: Full-Screen Edit auf Mobile.
- Auftrag erstellen/bearbeiten und Auftragsregeln: Full-Screen Edit auf Mobile.
- Zeit erfassen: Full-Screen Edit auf Mobile.
- Angebot/Rechnung erstellen/bearbeiten: Full-Screen Edit auf Mobile.
- E-Mail-Versand, Zahlung, Nachweis, Zuweisung: Bottom Sheet.
- PDF-/Dokumentvorschau: Full-Screen Preview.
