# Monitoring

`/api/health` liefert nur einen minimalen öffentlichen Health-Status und die App-Version. Der geschützte Betreiberbereich erhält zusätzlich Datenbank-Latenz, Deployment-Version sowie den Konfigurationszustand kritischer Dienste, ohne Secrets offenzulegen. Strukturierte Logs redigieren sensible Felder.
