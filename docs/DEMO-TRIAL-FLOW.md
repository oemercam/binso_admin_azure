# Demo und 14-Tage-Test

## Demo öffnen
- Kein Konto und keine Registrierung.
- Server erstellt eine isolierte Demo-Organisation mit Beispieldaten.
- Business-Funktionsumfang, bereits eingerichtet.
- Demo-Sitzung ist auf 24 Stunden begrenzt.
- Keine Kreditkarte, keine echte Zahlung und keine produktiven E-Mails.

## 14 Tage kostenlos testen
- Echte eigene Organisation mit eigenem Benutzerkonto.
- Business-Funktionsumfang für 14 Tage.
- Eigenes Onboarding und eigene Daten.
- Keine Kreditkarte beim Start des Tests.
- E-Mail-Verifikation wird erzeugt; der Test kann direkt nach der Registrierung eingerichtet werden.
- Nach Ablauf ist ein regulärer Plan erforderlich.

## Technische Regeln
- Demo und Trial verwenden serverseitige Sessions in Production.
- Same-Origin-Schutz akzeptiert die konfigurierte Produktionsdomain sowie die tatsächlich weitergeleitete Host-Domain.
- `/api/me` ist die kanonische Quelle für Onboarding-, Plan- und Trial-Status.

## Datenbank und RLS

Die Demo wird mit derselben Row-Level-Security wie normale Mandanten ausgeführt. Nach dem Anlegen von Demo-Organisation und Demo-Benutzer setzt der Server innerhalb derselben Transaktion `app.organization_id` und `app.user_id`, bevor Beispieldaten in `records` geschrieben werden. Die Demo umgeht RLS ausdrücklich nicht.
