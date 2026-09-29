# Binso One – Berechtigungskonzept v1.0.0

## 1. Trennung der Identitäten

Binso One trennt zwei Sicherheitsdomänen vollständig:

1. **Kunden-/Mandantenbenutzer** (`users`, `sessions`)
2. **Binso One Betreiberbenutzer** (`platform_users`, `platform_sessions`)

Ein Betreiberkonto ist **kein** Kundenkonto. Betreiberrollen erhalten standardmässig keinen Zugriff auf Rechnungen, Projekte, Personal-, Lohn-, Dokument- oder sonstige Fachinhalte eines Kundenmandanten.

## 2. Kundenrollen

| Rolle | Zweck | Kernrechte |
|---|---|---|
| Inhaber (`owner`) | rechtlicher/organisatorischer Kontoinhaber | Vollzugriff inkl. Abo, Benutzer, Rollen, Audit |
| Admin (`admin`) | Mandantenadministration | fast Vollzugriff, aber kein Abo-Sonderrecht des Inhabers |
| Finanzen (`finance`) | Finanzadministration | Rechnungen, Zahlungen, Einkauf, Buchhaltung, Bank, MWST, Berichte |
| Personal (`hr`) | HR/Lohn | Mitarbeitende, Abwesenheiten, Lohn, HR-Dokumente |
| Projektleitung (`project_manager`) | operative Projektverantwortung | Kunden, Verkauf, Projekte, Zeit, Spesen, Aufgaben |
| Mitarbeiter (`member`) | persönliche operative Arbeit | Projekte lesen, eigene Zeit/Spesen/Aufgaben erfassen |
| Lesen (`reader`) | kontrollierter Lesebetrieb | lesender Zugriff auf nicht sensible Geschäftsbereiche; kein Lohn |

### Sonderregeln
- Nur `owner` darf das Abo ändern.
- `owner` und `admin` dürfen Benutzer verwalten.
- Nur `owner` darf eine Inhaberrolle vergeben oder den letzten aktiven Inhaber verändern.
- Lohnzugriff erhalten nur `owner`, `admin` und `hr`.
- `member` erhält für Zeit, Spesen und Aufgaben einen **Own-Record-Scope**: in der produktiven Records-API werden nur selbst erstellte Datensätze gelesen/geändert.
- Navigation ist nur UX. Die verbindliche Berechtigungsprüfung findet in der API statt.

## 3. Betreiberrollen Binso One

| Rolle | Zweck | Rechte |
|---|---|---|
| Plattform-Inhaber (`platform_owner`) | höchste Plattform-Governance | alle Betreiberrechte |
| Plattform-Admin (`platform_admin`) | Plattformbetrieb | Mandantenmetadaten, Abos, Operatoren, Audit |
| Support (`support`) | Kundensupport | Mandantenmetadaten lesen, keine Fachinhalte |
| Billing (`billing`) | Abo-/Zahlungsbetrieb | Mandanten- und Aboinformationen, Abos verwalten |
| Security Auditor (`security_auditor`) | Kontroll-/Auditfunktion | Operatoren lesen, Plattform-Audit lesen |

### Explizit nicht erlaubt
Keiner Betreiberrolle wird über das Betreiber-API Zugriff auf folgende Kundeninhalte gegeben:
- Rechnungspositionen und Belege
- Projektinhalte
- Zeiterfassungsdetails
- Spesenbelege
- Personal- und Lohndaten
- Kundendokumente
- Vertragsinhalte
- Buchungsdetails

Ein zukünftiger Support-Zugriff auf Kundendaten müsste als separater, zeitlich begrenzter Break-Glass-Prozess mit Kundeneinwilligung, Begründung, Audit und automatischem Ablauf implementiert werden. Er ist in v1.0.0 bewusst **nicht** vorhanden.

## 4. Technische Durchsetzung

### Mandantentrennung
- Jeder produktive Geschäftsdaten-Datensatz enthält `organization_id`.
- API-Abfragen filtern explizit nach `organization_id`.
- PostgreSQL RLS schützt `customers`, `records` und `audit_logs` zusätzlich.
- `withTenant()` setzt den Tenant-Kontext nur innerhalb einer DB-Transaktion.

### RBAC
- Gemeinsame Berechtigungsdefinition: `lib/permissions.ts`
- Serverseitige Mandantenprüfung: `lib/server/rbac.ts`
- Serverseitige Betreiberprüfung: `lib/server/operator/rbac.ts`
- Rollen werden niemals nur über ausgeblendete Menüpunkte geschützt.

### Sessions
- Kunden- und Betreiber-Sessions verwenden getrennte Tabellen und Cookies.
- Betreiber-Cookie ist auf `/operator` begrenzt und `SameSite=Strict`.
- Sessiontoken wird nur gehasht in PostgreSQL gespeichert.

### Audit
- Kundenaktionen: `audit_logs`
- Betreiberaktionen: `platform_audit_logs`
- Operator Login/Logout und Rollenänderungen werden protokolliert.

## 5. Tests, die vor Produktion zwingend sind

1. Benutzer A aus Firma A kann keine ID aus Firma B lesen/ändern/löschen.
2. `reader` kann keinen POST/PATCH/DELETE auf Fachmodule durchführen.
3. `member` kann fremde Zeit-/Spesen-/Aufgabendatensätze nicht ändern.
4. `finance` erhält keinen Lohnzugriff.
5. `hr` erhält keinen Bank-/Buchhaltungs-Schreibzugriff.
6. `admin` kann keinen letzten Inhaber deaktivieren.
7. Betreiber-Support kann `/api/operator/organizations` lesen, aber weder `/api/records` noch Kunden-Fachinhalte über Betreiber-Endpunkte abrufen.
8. Security Auditor kann Audit lesen, aber keine Operatorrollen ändern.
9. Billing kann Abometadaten verwalten, aber keine Operatoren verwalten.
10. Betreiber- und Kunden-Cookies sind gegenseitig nicht austauschbar.
