# Binso Admin – Architektur

## Ziel

Die Anwendung ist nach fachlichen Domänen gegliedert. UI-Routen bleiben im Next.js `app/`-Router; wiederverwendbare Geschäftsregeln liegen in `modules/`; gemeinsame technische Infrastruktur in `lib/`; UI-Bausteine in `components/`.

## Schichten

- `app/`: Routing und Seitenkomposition. Keine komplexe Geschäftslogik.
- `components/`: wiederverwendbare UI, Navigation, Dokumente und App-Shell.
- `modules/`: fachliche Typen und Regeln (Orders, Time, Contracts, Billing, Workforce).
- `lib/`: Auth, Security, Datenadapter, Konfiguration, Demo-Daten.
- `types/`: aktuell noch kompatible zentrale Domain-Typen; neue Regeln werden schrittweise in die Module verschoben.
- `database/`: Zielmodell für PostgreSQL.

## Modulregeln

1. Seiten importieren Business-Regeln aus `modules/*`, statt sie lokal zu duplizieren.
2. Client-State dient nur der Demo. Produktion ersetzt `components/state/business-store.tsx` durch serverseitige Repositories.
3. Rechnungs-/Zeitquellen besitzen eindeutige IDs, damit nichts doppelt fakturiert wird.
4. Externe Nachweise werden pro Auftrag/Mitarbeiter geregelt, nicht global.
5. Rollenprüfung erfolgt serverseitig; UI-Ausblendung allein ist keine Berechtigung.

## Produktionspfad

1. Azure PostgreSQL + Migrationen
2. serverseitige Repository-Schicht
3. Blob Storage für Dokumente/Nachweise
4. Microsoft Graph für E-Mail
5. Job/Queue für Mahnungen und Lohnläufe
6. Audit-Log und unveränderbare Dokumentversionen
