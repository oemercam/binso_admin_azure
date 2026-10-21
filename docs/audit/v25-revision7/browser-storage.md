# Browser-Speicher und optionale Messung — geprüfter Codebestand

Codeprüfung am Revision-7-Entwicklungsbranch; keine Aussage über zusätzliche
Azure-/Proxy-/Provider-Konfigurationen oder eine juristische Freigabe.

| Technik | Zweck und Inhalt | Lebensdauer / Grenze | Code-Owner |
|---|---|---|---|
| binso_session, binso_operator_session (konfigurierbar) | Zufällige Sitzungsreferenz, serverseitig gehasht | HttpOnly, SameSite=Lax, Secure in Produktion; Ablauf laut Sitzungsrichtlinie | lib/server/session.ts, lib/server/operator/session.ts |
| binso_locale | de/fr/it/en, keine Identitätsdaten | 1 Jahr, SameSite=Lax, Secure unter HTTPS | lib/client/locale.tsx |
| binso.theme.mode, binso.theme | Gewähltes/resolviertes Farbschema | LocalStorage bis Änderung/Löschung | lib/theme.ts |
| binso.desktop-navigation | Eingeklappte Desktopnavigation | LocalStorage bis Änderung/Löschung | components/desktop-navigation.tsx |
| binso.privacy.preferences.v1 | Version, notwendig=true, Performance-Entscheid, Zeitstempel | LocalStorage bis Widerruf/Änderung/Löschung; ungültige Version gewährt keine Zustimmung | components/privacy-consent.tsx |
| binso.statistics:* | Gewählter Statistikzeitraum | Tab-SessionStorage; keine Berichtsresultate | components/statistics.tsx, components/cash-statistics.tsx |
| binso.process-draft.v1:* | Noch nicht gespeicherte Eingaben, benutzer-/mandanten-/rollenbezogen | Tab-SessionStorage, 24 Stunden; Bereinigung bei Sessionwechsel/Logout; keine Passwörter oder API-Antworten vorgesehen | lib/client/process-draft.ts, components/use-process-draft.ts |
| binso.session.changed | Zeitpunkt der Sessionänderung, Tab-Synchronisation | LocalStorage, letzter Wert | lib/client/backend.ts |
| binso-one-shell-v7 | Öffentliche Offline-Seite, Marken-/Manifestdateien | Service-Worker-Cache, Versionsbereinigung | public/sw.js |
| Eigene Web-Vitals | CLS/FCP/INP/LCP/TTFB, Wert/Bewertung und minimierter Routenpfad | Optional, vor Opt-in kein aktiver Reporter; Widerruf sperrt jeden Versand | components/web-vitals-reporter.tsx, components/web-vitals-active.tsx |

Die geprüften Root-/Marketing-Owner binden keine Google-Analytics-, Clarity-,
Hotjar- oder vergleichbaren Drittanbieter-Tracker ein. Externe Links sind keine
automatisch geladenen Tracker. Diese Quellcodeaussage beweist nicht die Abwesenheit
zusätzlicher Laufzeit-Injektion ausserhalb des Repositories.

Privates Such-/Listenmaterial bleibt im Arbeitsspeicher. Der Service Worker
speichert weder APIs noch authentifizierte Seitenantworten oder Next-Builddateien.
Browser-HTTP-Caches sind davon getrennt zu beurteilen.

Offen: tatsächliche Netzwerkmessung vor/nach Einwilligung auf aktuellen Builds,
Laufzeit-Cookie-Inventar inklusive Identity-/Hosting-Provider, juristische
Einordnung der erforderlichen Speichertechniken und Retention der serverseitigen
Messdaten. Geschäftsentwürfe können personenbezogene Eingaben enthalten;
SessionStorage ist keine Verschlüsselung. Dessen Risiko-/Schutzprüfung ist
weiter offen und darf nicht als vollständig sichere Offlineablage gelten.
