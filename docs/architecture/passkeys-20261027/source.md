# Binso One – Passkeys, biometrische Anmeldung und moderne Authentifizierung

## 1. Auftrag und Ziel

Analysiere die gesamte bestehende Authentifizierungsarchitektur von Binso One und implementiere eine moderne, sichere, benutzerfreundliche und produktionsreife Passkey-Anmeldung auf Basis von FIDO2/WebAuthn.

**Primäres Ziel:** Kunden sollen sich mit Face ID, Touch ID, Fingerabdruck, Windows Hello oder einem anderen kompatiblen Passkey-Authenticator anmelden können, ohne Passwort oder manuelle Authenticator-Codeeingabe.

Dies ist ein verbindlicher Implementierungsauftrag, keine reine Konzeptarbeit.

Arbeite direkt in der bestehenden Codebasis. Analysiere vor Änderungen die vorhandenen Authentifizierungs-, Benutzer-, Rollen-, Session-, Backend-, API- und Datenbankimplementierungen. Verwende bestehende Infrastruktur und bewährte Bibliotheken.

## 2. Unterstützte Anmeldeverfahren

Implementiere folgende Anmeldemethoden:

| Methode | Verwendung |
|---|---|
| Passkey / Face ID | Bevorzugte Anmeldung auf kompatiblen Apple-Geräten |
| Passkey / Touch ID | Anmeldung per Fingerabdruck |
| Passkey / Windows Hello | Anmeldung auf Windows-Geräten |
| Passkey / Android | Anmeldung mit kompatibler biometrischer Geräteentsperrung oder PIN |
| FIDO2-Sicherheitsschlüssel | Zusätzliche sichere Anmeldemethode |
| Passwort + TOTP | Bestehende Alternative über Authenticator |
| Microsoft Entra ID | Bestehende interne Anmeldung, sofern vorhanden |

Passkeys müssen auf kompatiblen Geräten die Anforderungen für starke Multifaktor-Authentifizierung erfüllen können. User Verification (UV) muss serverseitig durchgesetzt werden.

Eine zusätzliche manuelle TOTP-Eingabe nach erfolgreicher Passkey-Authentifizierung ist im normalen Anmeldeprozess nicht erforderlich, sofern die definierte Sicherheitsrichtlinie bereits erfüllt ist.

Die Microsoft-Authenticator-Push-Bestätigung mit Number Matching ist nicht Bestandteil dieser Implementierung. Sie darf nicht mit TOTP oder Passkeys verwechselt werden.

## 3. Registrierung neuer Kunden

Untersuche den bestehenden Registrierungsprozess und integriere Passkeys ohne Bruch des bestehenden Onboardings.

Gewünschter Ablauf:

1. Kunde registriert sich bei Binso One.
2. Die E-Mail-Adresse wird sicher verifiziert.
3. Der bestehende Registrierungs- und Unternehmens-Onboardingprozess wird abgeschlossen.
4. Der Kunde kann einen Passkey auf seinem Gerät einrichten.
5. Der Passkey wird sicher seinem bestehenden Benutzerkonto zugeordnet.
6. Bei künftigen Anmeldungen wird die Passkey-Anmeldung bevorzugt.

Ein Benutzerkonto ist für den aktuellen Produktumfang genau einem Unternehmen zugeordnet. Bestehende Tenant- und Rollenregeln müssen unverändert sicher bleiben.

Eine Passkey-Registrierung darf weder E-Mail-Verifizierung noch Unternehmensaktivierung oder andere Berechtigungsprüfungen umgehen.

## 4. Anmeldung bestehender Kunden

Bestehende Kunden müssen sich weiterhin problemlos anmelden können.

Nach einer erfolgreichen bestehenden Anmeldung soll Binso One die Einrichtung eines Passkeys anbieten.

Beispiel:

**Schneller und sicherer anmelden**

„Melde dich künftig mit Face ID, Fingerabdruck oder deiner Geräteentsperrung an.“

Aktionen:
- Passkey einrichten
- Später

Die Einrichtung darf übersprungen werden und soll nicht bei jeder Anmeldung erneut störend erscheinen.

Wenn bereits ein Passkey vorhanden ist, soll dieser künftig bevorzugt für die Anmeldung verwendet werden.

## 5. Login-Oberfläche und UX

Überarbeite die bestehende Login-Oberfläche behutsam und konsistent mit dem aktuellen Binso-One-Design.

Anforderungen:

- Passkey-Anmeldung als bevorzugte Aktion, wenn eingerichtet und unterstützt.
- Eine klar erkennbare Alternative „Mit Passwort anmelden“.
- Native Face-ID-, Touch-ID- und Windows-Hello-Dialoge des Betriebssystems.
- Passkey-Autofill beziehungsweise Conditional Mediation, soweit unterstützt.
- Keine unnötigen zusätzlichen Zwischenschritte.
- Keine erneute Codeeingabe bei erfolgreicher Passkey-Authentifizierung.
- Korrekte Behandlung von Abbruch, Timeout, Gerätewechsel und fehlendem Passkey.
- Keine unnötigen modalen Dialoge oder mehrfachen Bestätigungen.
- Responsive auf Mobile, Tablet und Desktop.
- Keyboard-, Safe-Area- und iOS-PWA-kompatibel.
- Bestehende Sprachen und Übersetzungsstruktur vollständig unterstützen.
- Marktübliche, konsistente und verständliche Begriffe verwenden.

Behalte das bestehende Binso-One-Design mit Inter, der zentralen Formularimplementierung, konsistenter Typografie, Abständen und gerundeten Eingabefeldern bei.

Die bestehende Bottom-Navigation und der Floating-Plus-Button dürfen nicht verändert werden. Es dürfen keine PWA-Update-Banner eingeführt werden.

## 6. Passkey-Verwaltung im Benutzerprofil

Integriere die Verwaltung der Anmeldemethoden sinnvoll in die bestehenden Profileinstellungen beziehungsweise Sicherheitseinstellungen.

Folgende Funktionen werden benötigt:

- Passkeys anzeigen
- Neuen Passkey hinzufügen
- Passkey benennen
- Letzte Verwendung anzeigen
- Passkey entfernen
- Weitere Anmeldemethoden verwalten
- Sicherheitseinstellungen überprüfen

Unterstütze mehrere Passkeys pro Benutzer, beispielsweise iPhone, Notebook und Sicherheitsschlüssel.

Beim Hinzufügen oder Entfernen von Passkeys ist eine frische, starke Reauthentifizierung erforderlich.

Der letzte funktionsfähige Anmelde- beziehungsweise Wiederherstellungsweg darf nicht unkontrolliert entfernt werden.

Alle Änderungen sind sicherheitsrelevant und müssen nachvollziehbar protokolliert werden.

## 7. Backend, API und Datenbank

Implementiere vollständige WebAuthn-Registrierungs- und Authentifizierungsprozesse.

Verwende eine etablierte und aktiv gepflegte WebAuthn-Bibliothek, die zum bestehenden technischen Stack passt.

Anforderungen:

- Kryptografisch sichere, kurzlebige Single-Use-Challenges.
- Konsequente Prüfung von Origin, RP ID, Challenge, Signatur und User Verification.
- Sichere serverseitige Zuordnung von Credentials zu Benutzerkonten.
- Schutz gegen Replay, Credential-Missbrauch und Account-Takeover.
- Geeignete Datenbanktabellen beziehungsweise Erweiterungen für Passkey-Credentials und notwendige Metadaten.
- Korrekte Behandlung synchronisierter Passkeys und Signature Counter.
- Keine Speicherung biometrischer Daten.
- Keine Speicherung privater Passkey-Schlüssel auf dem Server.
- Schutz vor CSRF, XSS und Session Fixation.
- Rate Limiting und Missbrauchsschutz.
- Sichere Session- und Token-Verwaltung.
- HTTPS und exakt definierte erlaubte Origins.
- Korrekte Konfiguration für Development, Preview und Production.
- Keine hartcodierten Secrets, Domains oder Zugangsdaten.

Die bestehende Authentifizierungsarchitektur soll erweitert und nicht durch ein unkontrolliertes zweites Login-System ersetzt werden.

Vermeide doppelte Benutzeridentitäten, parallele Session-Systeme und unnötige neue Datenstrukturen.

## 8. Sicherheit, MFA und Rollen

Prüfe die existierenden Benutzerrollen und Berechtigungen.

Besonders zu schützen sind:

- Unternehmensinhaber
- Unternehmensadministratoren
- Benutzer mit Finanzberechtigungen
- Interne Binso-Administratoren

Passkeys mit überprüfter User Verification sollen als starke Anmeldung verwendet werden können.

Für Passwortanmeldungen muss die bestehende risikogerechte MFA-Absicherung erhalten bleiben.

Eine schwächere Alternativmethode darf verpflichtende MFA-Anforderungen nicht umgehen.

Für besonders sensible Aktionen ist erforderlichenfalls Step-up-Authentifizierung umzusetzen.

Vorhandene Microsoft-Entra-Anmeldungen für interne Administratoren dürfen weder beschädigt noch ungewollt migriert werden.

## 9. Kontowiederherstellung und Gerätewechsel

Implementiere beziehungsweise überprüfe sichere Abläufe für:

- Neues Smartphone
- Verlorenes Gerät
- Gelöschten Passkey
- Mehrere Geräte
- Nicht unterstützte Geräte
- Passwort vergessen
- Verlust des Authenticators
- Abgelaufene Sessions

Ein Passkey-Verlust darf nicht zwangsläufig zum vollständigen Kontoverlust führen.

Gleichzeitig darf eine einfache E-Mail-Bestätigung bei besonders geschützten Konten keine starke MFA-Anforderung aushebeln.

Definiere sichere Wiederherstellungsmechanismen mit risikobasierter Identitätsprüfung, Benachrichtigung, Auditierung und geeigneter Missbrauchsprävention.

Bestehende Benutzer und Daten dürfen bei der Einführung nicht verloren gehen.

## 10. Technische Qualitätsprüfung

Überprüfe im Zusammenhang mit der Authentifizierung:

- Registrierung und Benutzeraktivierung
- Login und Logout
- Session-Ablauf
- Token-Erneuerung
- Passwort-Zurücksetzen
- Rollen und Berechtigungen
- Tenant-Isolation
- Datenbankmigrationen
- API-Sicherheit
- Fehlerbehandlung
- Mobile Browser
- iOS-PWA
- Android
- Safari
- Chrome
- Edge
- Windows Hello

Nach erfolgreichem Logout oder Session-Ablauf muss die geschützte Anwendung korrekt verlassen und auf die passende Anmeldeseite weitergeleitet werden.

Browser-Zurück-Navigation darf keine bereits gesperrten geschützten Inhalte wieder zugänglich machen.

Prüfe die Anwendung nach OWASP ASVS, OWASP Authentication/Session Management, OWASP Passkey Security und aktuellen FIDO2/WebAuthn-Empfehlungen.

## 11. Performance und Codequalität

Die Anmeldung muss schnell, stabil und ressourcenschonend sein.

Vermeide unnötige API-Aufrufe, zusätzliche Rendering-Zyklen, mehrfach ausgelöste Authentifizierungsprozesse und überflüssige Abhängigkeiten.

Verwende bestehende zentrale Komponenten und gemeinsame Design-Tokens.

Keine lokalen CSS-Workarounds, kein duplizierter Authentifizierungscode, keine Mock-Implementierungen für produktive Anmeldeabläufe und keine deaktivierten Sicherheitstests.

Ergänze gezielte automatisierte Tests für Registrierung, Anmeldung, Credential-Management, Fehlerfälle, Kontowiederherstellung und Berechtigungen.

## 12. Effiziente Umsetzung und QA

Arbeite in dieser Reihenfolge:

1. Aktuellen Ist-Zustand und technischen Stack untersuchen.
2. Bestehende Authentifizierung und Datenbankabhängigkeiten erfassen.
3. Geeignete Passkey-Architektur in die vorhandene Struktur integrieren.
4. Backend, API und Datenbankmigrationen implementieren.
5. Login, Registrierung und Benutzerprofil anpassen.
6. Sicherheits- und Recovery-Prozesse vervollständigen.
7. Gezielte Tests durchführen und Fehler beheben.
8. Einmalige vollständige Abschlussprüfung mit Lint, Typecheck, Tests und Build.
9. Änderungen und verbleibende Einschränkungen dokumentieren.

Keine unnötigen vollständigen Builds nach jeder kleinen Änderung durchführen. Bei Fehlern zunächst die betroffenen Tests wiederholen.

Führe keine unbegründeten Refactorings ausserhalb des Authentifizierungsbereichs durch.

## 13. Lieferung und Deployment

Erstelle eine vollständige funktionsfähige Implementierung, keine Demo und keinen reinen Entwurf.

Liefere:

- Übersicht der vorgenommenen Änderungen
- Angepasste Backend- und Frontend-Implementierung
- Datenbankmigrationen
- Aktualisierte Sicherheits- und Authentifizierungsdokumentation
- Ergebnisse der automatisierten Tests
- Hinweise zu benötigten Umgebungsvariablen und Konfigurationen
- Vollständiges ZIP des aktuellen Binso-One-Projekts, ohne Secrets und generierte Abhängigkeitsverzeichnisse
- Einen vollständigen PowerShell-Block für Installation, Lint, Typecheck, Tests, Build, Git-Status, Commit, Pull mit Rebase und Push sowie die Prüfung der bestehenden GitHub-Actions-/Azure-Pipeline

Arbeite in einem geeigneten Git-Branch. Bereite Änderungen zur nachvollziehbaren Übernahme vor.

Die produktive Anmeldung darf während der Einführung nicht unterbrochen werden. Die Aktivierung neuer Anmeldefunktionen muss bei Bedarf über die bestehende Feature-Flag-Architektur steuerbar sein.

Ein Produktionsdeployment darf erst erfolgen, wenn die erforderlichen Tests erfolgreich sind und die bestehende Release- und Freigabelogik eingehalten wird.

## 14. Verbindliche Akzeptanzkriterien

Die Implementierung ist abgeschlossen, wenn:

1. Ein bestehender Kunde einen Passkey sicher registrieren kann.
2. Derselbe Kunde sich mit Face ID, Fingerabdruck oder Windows Hello anmelden kann.
3. Bei erfolgreicher Passkey-Anmeldung keine manuelle TOTP-Eingabe erforderlich ist.
4. Nicht unterstützte Geräte weiterhin sicher angemeldet werden können.
5. Bestehende Kundenkonten und Anmeldeverfahren funktionieren.
6. MFA- und Rollenrichtlinien nicht umgangen werden können.
7. Passkeys im Profil hinzugefügt, verwaltet und entfernt werden können.
8. Geräteverlust und Kontowiederherstellung sicher behandelt werden.
9. Login, Logout, Session-Ablauf und Berechtigungen korrekt funktionieren.
10. Die bestehende Binso-One-Navigation und das Design unverändert konsistent bleiben.
11. Die vorgesehenen Sicherheitstests, Typechecks und Builds erfolgreich abgeschlossen sind.
12. Die Implementierung inklusive vollständiger Projektdateien und technischer Dokumentation bereitsteht.

**Wichtig:** Beginne mit der tatsächlichen Codeanalyse und führe die Implementierung durch. Frage nicht nach bereits aus der Codebasis eindeutig ermittelbaren Informationen. Dokumentiere notwendige externe Konfigurationen präzise und behaupte keine erfolgreichen Gerätetests, die nicht tatsächlich durchgeführt wurden.