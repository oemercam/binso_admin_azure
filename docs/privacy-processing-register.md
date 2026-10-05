# Binso One – Verzeichnis der Datenbearbeitungen

Stand: 5. Oktober 2026

Dieses Dokument ist die betriebliche Grundlage für die Datenschutzdokumentation von Binso One. Es ist bei neuen Funktionen, Integrationen oder Datenkategorien zu aktualisieren.

## 1. Öffentliche Website
- Betroffene: Website-Besucher
- Daten: IP-/Request-Metadaten, technische Browser-/Geräteinformationen, Performance-Telemetrie
- Zweck: Auslieferung, Sicherheit, Fehleranalyse, Performance
- Empfänger: Microsoft Azure
- Aufbewahrung: gemäss konfigurierter Betriebs-/Log-Retention
- Ausland: abhängig von Microsoft-Support-/Unterauftragsstrukturen

## 2. Kundenkonto und Authentifizierung
- Betroffene: Kundenbenutzer
- Daten: Name, Firmenname, E-Mail, Passwort-Hash, Verifikationsstatus, MFA-/Recovery-Informationen, Sitzungs- und Sicherheitsmetadaten
- Zweck: Registrierung, Login, Kontosicherheit, Rollen/Berechtigungen
- Empfänger: Microsoft Azure; Microsoft Graph / Microsoft 365 für transaktionale E-Mails
- Besondere Massnahmen: Passwort-Hashing, OTP nur gehasht, MFA, Recovery Codes nur gehasht, Session-Cookies httpOnly/secure

## 3. Kundengeschäftsdaten
- Betroffene: Kunden des Binso-Kunden, Mitarbeitende, Lieferanten, Kontakte und weitere Geschäftspartner
- Daten: Stamm-, Kontakt-, Projekt-, Zeit-, Spesen-, Rechnungs-, Dokument- und Kommunikationsdaten
- Zweck: Bereitstellung der vom Kunden genutzten Binso-One-Funktionen
- Rolle Binso: Auftragsbearbeiter
- Empfänger: Microsoft Azure; weitere Unterauftragsbearbeiter nur soweit funktionsbezogen erforderlich
- Mandantentrennung: organization_id/RLS und serverseitige Berechtigungsprüfung

## 4. Abonnement und Zahlung
- Betroffene: Firmeninhaber, Billing-Kontakte
- Daten: Plan, Abrechnungsintervall, Stripe-Kunden-/Subscription-Referenzen, Rechnungs-/Zahlungsstatus; keine vollständigen Kartendaten in Binso One
- Zweck: Vertrag, Billing, Zahlungsverfolgung
- Empfänger: Stripe
- Rolle: teilweise eigene Verantwortlichkeit von Binso und Stripe gemäss jeweiligem Verarbeitungskontext
- Aufbewahrung: nach gesetzlichen Vertrags-/Buchführungsanforderungen

## 5. Support und Feedback
- Betroffene: Kundenbenutzer und in Supportinhalten erwähnte Personen
- Daten: Nachricht, Anhänge, Diagnosekontext, Route/Build, Kontaktdaten
- Zweck: Support, Fehlerbehebung, Produktverbesserung
- Empfänger: Microsoft Azure; E-Mail-Provider soweit Kommunikation per E-Mail erfolgt

## 6. Interne Binso-Administration
- Betroffene: Binso-Mitarbeitende
- Daten: Entra Object ID, Tenant ID, E-Mail, Name, App Role, Login-/Audit-Metadaten
- Zweck: sicherer interner Plattformbetrieb
- Empfänger: Microsoft Entra ID / Azure
- Authentifizierung: Microsoft Entra ID, Microsoft Authenticator/MFA nach Entra-Policy
- Lokale Operator-Passwörter: produktiv deaktiviert

## 7. Transaktionale E-Mails
- Betroffene: Empfänger von Konto-/Sicherheitsmails
- Daten: Empfängeradresse, Nachricht, technische Zustellmetadaten
- Zweck: E-Mail-Verifikation, Login-Code, Passwort-Reset, Systemkommunikation
- Empfänger: Microsoft Graph / Microsoft 365
- Verarbeitung: gemäss Microsoft-Vertrags- und Datenstandortmodell; Kernplattform in Azure Switzerland North, zusätzliche Verarbeitungsorte je nach Microsoft-Dienst möglich

## Review
Verantwortlich für die Aktualisierung: Geschäftsführung / technische Produktverantwortung der Binso GmbH.
Review mindestens jährlich und zusätzlich bei jeder neuen wesentlichen Datenbearbeitung.
