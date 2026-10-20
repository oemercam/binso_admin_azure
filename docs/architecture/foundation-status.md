# Technischer Foundation-Status

Stand 20.10.2026. Dieser Bericht ist ein Wegweiser und Implementierungsnachweis;
er schafft keine weitere UX-Foundation oder parallele Produktregeln. Verbindlich
bleiben [AGENTS](../../AGENTS.md), [aktuelle UX-Entscheidungen](ux-current-approval.md),
[Reference Foundation](reference-foundation.md) und das
[CSS-Manifest](../../app/design-system/manifest.json).

Ausgangspunkt ist der ausgelieferte Main `d2825134deb33cac67a05c6e703b945ff28066e6`
mit erfolgreicher [Full/development-Qualifikation](https://github.com/oemercam/binso_admin_azure/actions/runs/39382833660).
Eine grüne Entwicklungsqualifikation ist keine vollständige Produktabnahme.

## Korrigierte Ursachen

- Review-/Geräteanforderungen können erst bestehen, wenn alle erwarteten Fälle
  individuell bestanden und freigegeben sind. Route, Zustand, Engine, Theme,
  Breite, Rolle und Geräteplattform werden beim Fallabgleich berücksichtigt.
  Fehlende Falllisten, Freigaben oder echte Geräte bleiben offen; Fehler dominieren.
- Für 36 aktuelle Anforderungen sind 768 explizite Mindestfälle im bestehenden
  Anforderungsregister geplant. Diese Falllisten sind keine Testergebnisse.
  Die 392 importierten historischen Anforderungen ohne aktuelle Fallzuordnung
  bleiben ausdrücklich offen. `approvalScopeComplete` wird nicht erteilt.
- Menschliche Style-Abnahmetexte verwenden dieselben Binding-Daten wie der
  ausführbare Vertrag. Ein neuer Test blockiert widersprüchliche Alttexte.
  Bestehende Tokenwerte und die freigegebene Darstellung werden nicht geändert.
- Der Nachweis-Digest umfasst auch aktive UX-Verträge und Domain-Konfiguration,
  damit deren Änderungen alte Messungen ungültig machen. Evidence-Archive bleiben
  vom Quelldigest ausgeschlossen.
- Acht bewiesen überholte CSS-Deklarationen wurden entfernt. Die konservative
  Analyse erkennt nun auch vollständige Überdeckung durch einfache Selektorlisten.
  Teilüberlappung, progressive Fallbacks, Prioritäten, abweichende Bedingungen und
  unbekannte zusätzliche Pseudoselektoren bleiben geschützt. Navigation und
  Floating-Plus-Darstellung werden nicht neu gestaltet.
- Historische V21-Inventare sind am Einstieg als historische Belege markiert.
  Der frühere v3-Geometrieverweis ist auf den aktiven v4-Vertrag richtiggestellt;
  der Header-Vertrag fordert keine laufende Zeitmessung mehr.

## Sicherheitsblockade statt ungeprüfter Dependency-Änderung

Der lesende Audit meldet `braces@3.0.3` über
`eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch` als high.
Die [offizielle Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
nennt derzeit keine reparierte Version. Registry-Prüfung: `braces` aktuell 3.0.3;
auch `@next/eslint-plugin-next` 16.4.2 verwendet weiterhin `fast-glob`.
Ein blindes Next-/ESLint-Upgrade oder erfundener Override würde den belegten Pfad
nicht sicher beheben. Keine Dependency wurde deshalb ausgetauscht.

Die vorhandene eng gebundene Dev-Ausnahme endet am 24.10.2026 00:00 UTC und wurde
nicht verlängert. Der produktive Dependency-Gate bleibt verbindlich. Bis ein
qualifizierter Upstream-Fix oder ein separat geprüfter Ersatz vorliegt, ist dieser
Punkt **offen**, nicht behoben und nicht als fehlerfreie Basis auszuweisen.

## Abnahme, die technische Korrekturen nicht ersetzen

- Freigegebene Pixelbaselines fehlen weiterhin. Die vorhandene leere Baseline
  wird nicht automatisch mit aktuellen Screenshots gefüllt.
- Historische Review-Anforderungen benötigen fallweise Abgleich mit den neuesten
  Entscheidungen; alte Erwartungen dürfen nicht pauschal Tests zurückgestalten.
- Echte iOS-/Android-PWA-, Tastatur-/Screenreader-Nachweise und durchgehende
  Geschäftsprozesse E01–E10 bleiben laut [App-Abnahme](app-acceptance.md) offen.
- Grosse Operator-/Dokument-/Settings-Komponenten sind Wartungsrisiken, kein
  belegter Grund für pauschale Löschung. Fachliche Zerlegung und reale
  Ladezeitmessungen benötigen eigenständige Verhaltensnachweise. Keine zweite
  Businesslogik, keine neuen Caches und keine ungeprüfte Neugestaltung daraus ableiten.

## Verifikation dieses Pakets

Gezielte lokale Regressionen bestanden: ESLint für geänderte Skripte, CSS-Owner,
Presentation-Kaskade, Style-Verträge, Registry-/Report-Gegenfälle inklusive
Rollen/Plattformen/fehlender Dimensionen, Source-Digest-Fences, Navigation,
Dokumentationskonsistenz, Dependency-Ausnahme und Architektur-Fingerprint.
Der isolierte Chromium-Messadapter besteht ebenfalls; seine CSS-Gegenprobe
vergleicht Browser-Computed-Styles vor/nach dem Pruning bei 390 und 1440px.
Kein lokaler Vollbuild und keine lokale App-Browsermatrix wurden gestartet.
Die gemeinsame PR-Quality-/CodeQL- und Browserqualifikation ist vor Integration
erforderlich. Dieses Paket autorisiert weder Merge noch Deployment; bis zur
separaten Freigabe bleibt der neue PR offen. Offene Nachweise werden nicht grün
deklariert und keine bestehende Schutzregel wird abgeschwächt.
