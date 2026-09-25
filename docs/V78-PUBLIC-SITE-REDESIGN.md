# V78 – Public Site Redesign, Real Product Screenshots and Access Separation

## Ziel

Der öffentliche Auftritt zeigt die echte Binso-One-Anwendung statt illustrierter Demo-Oberflächen. Navigation, Footer und Einstiege werden vereinfacht. Kunden-Login und interner Binso-Admin-Zugang sind sichtbar und technisch getrennt vorbereitet.

## Umgesetzt

- Landingpage mit echten Dashboard-, Kunden-, Angebots-, Auftrags-, Zeit- und Rechnungs-Screenshots.
- Feature-Seite und Ablauf-Seite nutzen dieselben echten Produktansichten.
- Öffentliche Navigation auf die wichtigsten Bereiche reduziert; Startseite bleibt über das Logo erreichbar.
- Footer in Produkt, Hilfe, Zugang und Rechtliches getrennt.
- `/sign-in` ist der klare Kunden-Login.
- `/admin-access` ist ein eigener, nicht indexierbarer interner Binso-Zugang mit Microsoft-Anmeldung.
- Auth-Route unterstützt `audience=customer|admin` und getrennte Provider-Konfiguration.
- `AUTH_PROVIDER_NAME` bleibt der Kunden-Provider; `AUTH_ADMIN_PROVIDER_NAME` steuert den Binso-Admin-Provider und fällt auf `aad` zurück.
- Registrierung verwendet den Kunden-Login und nennt Microsoft nicht mehr als zwingende Kundenmethode.
- V78-Check validiert Kernlinks, Zugangstrennung und das Vorhandensein der echten Screenshots.

## Azure-Zielbild

Bis Entra External ID für Kunden vollständig konfiguriert ist, kann `AUTH_PROVIDER_NAME` weiterhin auf den bestehenden Provider zeigen. Sobald External ID bereitsteht, wird nur der Kunden-Provider auf z. B. `external_id` umgestellt. `AUTH_ADMIN_PROVIDER_NAME=aad` bleibt für die internen Binso-Konten bestehen.
