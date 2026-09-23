# Binso One — Produktidentität V66

- **Produkt:** Binso One
- **Entwickler und Betreiber:** Binso GmbH
- **Rolle von Binso GmbH:** Hersteller, Betreiber und Plattformadministrator.
- **Rolle der Kunden:** Kundenorganisationen nutzen Binso One als Mandanten der SaaS-Plattform.
- Technische Azure-Ressourcennamen wie `binso-admin-prod` bleiben unverändert, weil sie Infrastrukturbezeichner und keine Produktnamen sind.
- Die öffentliche Authentifizierung verwendet den extern weitergeleiteten Host bzw. `WEBSITE_HOSTNAME` und darf nie auf einen internen Containerhost verlinken.
