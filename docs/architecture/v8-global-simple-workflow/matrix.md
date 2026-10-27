# V8 – Ist-Soll-Matrix vor Implementierung

Status: **Vorhanden** = im bestehenden Code belegt; **Teilweise** = Umsetzung oder
Nachweis unvollständig; **Fehlend** = geprüfter Pfad ohne benötigte Funktion;
**Fehlerhaft** = konkrete Abweichung; **Blockiert** = Freigabe/externer Nachweis fehlt.
Status vor Beginn der V8-Codeänderungen, keine Produktabnahme.
Die vollständige Einzelaufnahme zu Seiten, Feldern, Aktionen, Rollen, API-/Datenquellen
liegt in [inventory.json](inventory.json); nicht einzeln verifizierte dynamische
Zustände bleiben ausdrücklich teilweise/offen und erhalten keinen Pauschal-Pass.

| ID / Bereich | Ist / Beleg | Soll / Entscheidung | Status |
| --- | --- | --- | --- |
| A Inventar | Kanonische UX-/Daten-/Schema-Owner; aktueller Ausgangshash | Gemeinsame vollständige statische Momentaufnahme | Vorhanden |
| B Navigation | `config/workspace-navigation.ts`, `app-shell.tsx`, V7-Verträge | Ziele/Geometrie/FAB erhalten; persönliche Firmenverwaltung getrennt | Vorhanden |
| B Kunden-Zentrale | Acht Kundenbereiche und kundengefilterte Listen in `pages/customers.tsx` | Führende Daten und Rückwege erhalten; vollständige dynamische Matrix offen | Teilweise |
| B Formular-Owner | `FormPage` und ältere Inhaltscontainer teilen `.form-page` | Aktiven Editor eindeutig kennzeichnen, keine Kollateralselektoren | Fehlerhaft |
| B Visuelle Foundation | Gemeinsame Tokens/Rows/Icons; 2'528 CSS-Regeln | Gegenfälle, lange Übersetzungen, Zoom und vollständige Routen prüfen | Teilweise |
| C Registrierung | bestehende Verifikation/Trial-/Einladungsroute und Recovery | Weiterverwenden; echte Mailzustellung separat qualifizieren | Teilweise |
| C Firmeneinrichtung | eine Seite/atomarer API-Pfad; lokaler Draft geht bei Reload verloren | Zentraler Draft-Owner, Fortschritt, eindeutiger Abschluss | Teilweise |
| C Kunden | zwingende Kontaktpaar-Validierung; zwei Formularschritte | Firmenname/Kontakt direkt, optionale Angaben aufklappbar; Validierungen erhalten | Teilweise |
| C Kontakte | bestehende Kontaktpflege/Primärkontakt-Schutz | Erst Details, kontextbezogene Bearbeitung/Kommunikation; UI-Nachweis offen | Teilweise |
| C Angebote | Versionen, Positionen, Entwürfe, Versand/outbox vorhanden | Sechs gemeinsame Modelle sind nicht vollständig modelliert | Teilweise |
| C Auftrag erstellen | Name/Kunde; erfolgreicher Pfad führt teilweise direkt zur Zeitansicht | Bestätigte Auftragsdetails, Aufrufer erhalten | Fehlerhaft |
| C Auftrag planen | `project-workspace.ts`: Stundenbudget, Team, Status/Version | Vollständige Zentrale, Modell/Phasenprüfung, Kostenbudget | Teilweise |
| C Budget | `Number(body.hoursBudget ?? 0)` und existierende Defaults | Nicht gesetzt von tatsächlicher Null unterscheiden; Migrationsfreigabe nötig | Blockiert |
| C Zeit | persistierter Timer, gemeinsame Picker, getrennte Review/Billing-Pfade | Zustand/Batch-/Rollen-/Offline-Gegenfälle erhalten und final prüfen | Teilweise |
| C Rechnungen | bestehende Snapshot-, QR-, Zeit-/Mengen-, Credit-Pfade | Gemeinsame Preislogiken, Akonto-/Teil-/Schlussrechnung vollständig | Teilweise |
| C Zahlungen | exakter Saldo, Teil-/Überzahlung, Erstattung, Idempotenz | Bestehende Finanzengine erhalten, vollständigen E2E-Pfad nachweisen | Vorhanden |
| D Spesen/Ausgaben | bestehender Beleg-/Erstattungs-/Zahlungsquellenpfad | Einfache Pflichtangaben und klare Zahlungsquelle; keine doppelte Buchung | Teilweise |
| D Belegerkennung | Azure-Integration existiert; ungeprüfte Operation-URL erhält Schlüssel; keine Gesamtlaufzeitgrenze | Ressourcengebundene, begrenzte Vorschläge; keine behauptete Aktivierung | Fehlerhaft |
| D Support | Liste → Details → Unterhaltung bereits vorhanden | Erhalten; reale iOS-Tastatur-/PWA-Abnahme offen | Teilweise |
| D Mitarbeiter/Rechte | Einladungen, Rollen/Module, Widerruf, explizite sensible Grants | Kein zweites Rollenmodell, vollständige Negativfälle/Abnahme | Vorhanden |
| D Finanzen/Berichte | führende Statistik-/Berichtspfade, getrennte Währungen, Exporte | Auswahl/Zeitraum/Ergebnis erhalten; vollständige visuelle Abnahme | Teilweise |
| D Einstellungen | persönlicher Avatar, Firmenbereiche, zentrale Row-/Toggle-Owner | Vereinfachung nur bei nachgewiesenen Abweichungen | Teilweise |
| D Admin | Entra-/serverseitige MFA, Operatorrollen/Auditpfade | Zwingende MFA bewahren; Live-Policy/Provider separat belegen | Teilweise |
| E Kundenlogin | letzte Owner-Antwort: bestehenden Passwortlogin beibehalten | Widersprechenden V8-Kunden-MFA-Login nicht reaktivieren | Vorhanden |
| E Fünf Sprachen | 3'694 katalogisierte Quellschlüssel; locale/Legal-Gates | Alle neuen Texte in EN/FR/IT/TR; linguistische/Legal-Abnahme nicht erfinden | Teilweise |
| E Daten/API | 158 Endpunkte, 125 Tabellen, 109 Migrationen/RLS | Bestehende Tenant-/Transaktions-/Auditgrenzen bewahren; neue Fachmodelle freigeben | Teilweise |
| E Abhängigkeiten/Build | gepinnte Runtime/Lockfile, bestehende Sicherheits-/Build-Gates | Frischer Scan und finale Tests, keine Ersatztools | Teilweise |
| E Azure/GitHub | bestehende OIDC-/Release-Gates und Produktionsbasis | Read-only prüfen; keine externen Änderungen ohne Freigabe | Teilweise |
| F Gesamtabnahme | gezielte Browsernachweise auf Vorgängerbasis; keine neue V8-Abnahme | Alle vorgegebenen Breiten/Themes/Zoom/E2E am finalen Stand | Blockiert |
| F Native DB/real iOS | lokale PostgreSQL-/Docker-Engine zuletzt nicht verfügbar; keine physischen Geräte | Tatsächliche vorgesehene Testumgebung und reale Gerätenachweise | Blockiert |

Die zwölf Pflichtpfade aus Kapitel 11 bleiben bis zur tatsächlichen Ausführung
**Teilweise**, Sicherheits-/Provider-/Geräteanteile **Blockiert**. Bereits vorhandene
Unit-/PGlite-/Browser-Belege sind Bausteine, kein Ersatz für diese E2E-Abnahme.
