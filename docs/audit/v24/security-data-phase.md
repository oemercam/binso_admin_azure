# Architektur/Security/Daten – kontrollierte Fortsetzung

## Zusammenführung vorhandener Implementierung

Auf einem separaten Review-Branch wurde PR #250 (Head 1c860005) mit dem Audit und dem Erstellen-Fix zusammengeführt. Kein Merge nach main. Konflikte in AppShell, Operator und QuickCreateAction wurden so aufgelöst, dass die vorhandene Lokalisierung und die neue ausschliesslich seitenbezogene Erstellen-Aktion erhalten bleiben. Bestehende Navigation-Referenzen bestehen unverändert.

## V24-F011 – unbegrenzter lokaler Rate-Limit-Speicher (P2)

Quelle: lib/server/rate-limit.ts. Die frühere New-Key-Verzweigung kehrte vor der Bereinigung zurück. Neue Schlüssel konnten daher unbegrenzt im Prozess verbleiben; auch aktive Schlüssel durften nicht pauschal verdrängt werden, weil dadurch das Limit zurückgesetzt würde.

Fix: maximale Bucket-Zahl in config/limits.ts. Ablaufbereinigung beim frühesten bekannten Ablauf, auch vor neuen Schlüsseln. Bei voller Kapazität keine Verdrängung aktiver Limits, sondern 429 mit positivem Retry-After. Der atomare PostgreSQL-Pfad bleibt erhalten.

Test: scripts/rate-limit-test.mjs führt die tatsächliche Funktion aus und prüft erschöpfte Limits, wechselnde Schlüssel, volle Kapazität, Ablauf/Wiederverwendung, unveränderte aktive Sperren sowie den Produktions-DB-Pfad. In pnpm test eingebunden. Lokal bestanden. CI-/Release-Abnahme separat erforderlich.

## Prüfstand und verbleibende Arbeit

- work-items.json zerlegt die Originalabsätze zusätzlich in nachverfolgbare Sätze. Aufzählungen innerhalb eines Satzes benötigen weiterhin Einzelprüfungen; keine automatische Vollständigkeitsbehauptung.
- license-inventory.json erfasst installierte Paket-/Lizenzmetadaten ohne lokale Hostpfade. Sie ersetzt keine vollständige Lizenzpflichtenprüfung oder signierte SPDX-SBOM.
- Bestehende Schutzmechanismen im Quellcode nachgewiesen: Demo-Dokumentversand und Einladungen blockiert; Stripe-Checkout und Billing-Synchronisation schliessen Demo-Organisationen aus; private JSON-Antworten sind no-store; Dokument-/Zahlungsoperationen besitzen vorhandene Idempotenz-/Transaktionsprüfungen. Jeder Laufzeitnachweis muss an den exakten Commit gebunden bleiben.
- Offene Risiken: CSP erlaubt Inline-Skripte; vollständige nonce-/hashbasierte Umstellung braucht SSR-/PWA-/PDF-Regression. Production-Rollen, Azure-Einstellungen, Restore, Retention und fachliche Rechtsprüfung sind nicht durch Code allein bewiesen.
- Aktuelle Normversionen werden mit offiziellen Quellen abgeglichen. Keine Zertifizierung oder vollständige ISO-Konformität behauptet; nicht zugängliche Volltext-Control-IDs bleiben offen.

Kein Produktivdeploy, keine produktive Migration, keine Infrastrukturänderung, keine reale Zahlung und keine externe Nachricht ausgeführt.
