# Binso One – Azure PostgreSQL Backup- und Restore-Test

Stand: 5. Oktober 2026

## Ziel
Vor dem kommerziellen Go-live muss ein echter Point-in-Time-Restore von Azure Database for PostgreSQL erfolgreich durchgeführt und dokumentiert werden.

## Prüfablauf
1. Aktuelle Backup-Retention und frühesten Restore-Zeitpunkt des produktiven Flexible Servers dokumentieren.
2. Einen eindeutig identifizierbaren, nicht sensitiven Testdatensatz bzw. Zeitstempel für den Restore-Nachweis festlegen.
3. Einen Point-in-Time-Restore in einen getrennten temporären PostgreSQL Flexible Server durchführen. Niemals direkt über die Produktionsinstanz restaurieren.
4. Netzwerk-/TLS-Zugriff auf den Restore-Server kontrolliert freigeben.
5. Mit read-only Prüfungen bestätigen:
   - Datenbank erreichbar
   - erwartetes Schema vorhanden
   - Migrationstabelle auf erwarteter Version
   - Testdatensatz zum gewählten Zeitpunkt vorhanden
   - zentrale Tenant-Tabellen lesbar
6. Keine produktive Anwendung auf den Restore-Server umschalten, ausser bei einem echten Disaster-Recovery-Fall mit separater Freigabe.
7. Temporären Restore-Server nach dokumentiertem Erfolg wieder entfernen, damit keine unnötigen Kosten oder Datenkopien bestehen bleiben.

## Nachweis
Dokumentieren:
- Datum/Uhrzeit
- gewählter Restore-Zeitpunkt
- Restore-Dauer
- verantwortliche Person
- Ergebnis
- allfällige Abweichungen
- nächster geplanter Test

Ein Restore-Test gilt nur als bestanden, wenn der wiederhergestellte Server tatsächlich erreichbar war und die erwarteten Daten geprüft wurden.
