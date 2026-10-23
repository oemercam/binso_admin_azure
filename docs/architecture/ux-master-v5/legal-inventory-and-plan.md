# Rechtsquellen und verbleibende Migration

| Dokument | Einzige bestehende Textquelle | Versionsquelle |
|---|---|---|
| Impressum | app/impressum/page.tsx | Vorhandenes Stand-Datum; keine separate Versions-ID nachgewiesen |
| Datenschutz | app/datenschutz/page.tsx | config/legal.ts privacyVersion 2026-10-05.2 |
| AGB | app/agb/page.tsx | config/legal.ts termsVersion 2026-10-05 |
| DPA | app/auftragsbearbeitung/page.tsx | config/legal.ts dpaVersion 2026-10-05 |
| Unterauftragsbearbeiter | app/unterauftragsbearbeiter/page.tsx | Vorhandenes Stand-Datum; keine separate Versions-ID nachgewiesen |

Das vorhandene Datum bleibt 5. Oktober 2026. DE/FR/IT/EN verwenden bestehende Textkataloge; eine rechtliche Freigabematrix für diese Übersetzungen und TR ist nicht belegt. Nichtdeutsche interne Fassungen zeigen einen entsprechenden Hinweis. Keine neue rechtlich verbindliche TR-Fassung erzeugt.

Die neue Kunden-App-Route /einstellungen/rechtliches/[document] benötigt requireSession und erlaubt nur die fünf bekannten Dokumente. Sie verwendet dieselben vorhandenen Seitenfunktionen im internen Modus des LegalPage-Owners, mit unveränderten Abschnittsankern und auf interne Dokumente umgelegten Querverweisen. Öffentliche Routen bleiben ohne Login vorhanden. Bestehende Zustimmungs- und Widerrufsspeicherung unangetastet.

Offene nächste Schritte: gleicher Lesemodus in der vorhandenen Admin-Shell mit deren Authentifizierung; vollständige Bestandslinkmigration aller Rollen; formaler Rechtsfreigaberegister mit Verantwortlichen/Sprachen/Versionen ohne rückwirkende Zustimmungsversionen zu ändern; Ablauf-/Session-/Deep-Link-Prüfung und reale Geräteabnahme. Nicht als erledigt markieren.
