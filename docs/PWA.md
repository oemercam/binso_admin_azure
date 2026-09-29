# PWA

Es existieren getrennte Manifeste für Website, Kundenportal und Betreiberbereich. Der Service Worker cached nur öffentliche/statische Inhalte kontrolliert. API-Routen, Kundenmodule, Portal und Betreiberbereich werden nicht als vertrauliche Offline-Daten gecached. Updates werden erkannt und erst nach Benutzeraktion aktiviert. Mobile Safe Areas, Standalone-Modus und App-Shell-Navigation werden berücksichtigt.
