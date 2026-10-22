# braces: tatsächliche Ursache und eng begrenzte Behebung

Stand: 22.10.2026, Fortsetzung auf `feat/v25-revision7`.

Der betroffene Entwicklungsweg war ausschliesslich
`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces@3.0.3`.
Der Next-Linthelfer verwendete `fast-glob` zur Ermittlung von Root-Verzeichnissen.
Die Laufzeit-App hatte diesen Importweg nicht. Das macht den hohen Befund nicht
akzeptabel: Auch der Entwicklungs-Audit bleibt verbindlich.

Zum Prüfzeitpunkt bietet die [offizielle Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
keine reparierte braces-Version. Die geprüften aktuellen Upstream-Pakete beseitigen
die Kette ebenfalls nicht. Ein zunächst geprüfter tinyglobby-Alias wurde wegen
abweichender Windows-/absoluter Pfadsemantik verworfen und ist nicht konfiguriert.

Der versionierte pnpm-Patch ändert nur den Root-Verzeichnishelfer der exakt
gebundenen Next-Lintplugin-Version16.3.8 auf die vorhandene Node24-`fs.globSync`-API.
Er normalisiert Windows-Trenner, filtert tatsächliche Verzeichnisse und lehnt
überlange beziehungsweise übermässig verschachtelte Muster ausdrücklich ab.
Die ausschliesslich dort benötigte fast-glob-Abhängigkeit wird über den engen
pnpm-Override entfernt. Keine weiteren Next-Regeln oder Lint-Konfigurationen ändern
sich. Patch und Integrität im Lockfile wurden mit pnpm erzeugt, nicht fingiert.

Lokale Nachweise am geänderten Quellbaum:

- Frozen-Lockfile-Installation mit pnpm10.17.1 erfolgreich.
- Vollständiges ESLint erfolgreich; tatsächliche Next-Regel gegen interne Links
  positiv und negativ ausgeführt, unveränderte Core-Web-Vitals-Konfiguration.
- Verzeichnis-/Brace-/Bereichsmuster, absolute Windows-Pfade, Unicode, Leerzeichen,
  Root-Arrays und Default-Root geprüft; Dateien werden nicht als Root akzeptiert.
- Verschachtelung200 (unterhalb der Längengrenze) und6000 in separatem Prozess mit
  Zeit-/Speichergrenze kontrolliert abgewiesen; kein Stacküberlauf.
- `security-exception-test.mjs` prüft den früher ausgenommenen genauen High-Befund,
  andere High-/Critical-Befunde und defekte Auditantworten als blockierend.
- Produktions- und vollständiger Dependency-Audit: keine bekannten Befunde.

Die bisherige befristete Ausnahme ist vollständig aus dem Audit entfernt.
Kein Ablaufdatum wurde verlängert. Der unveränderte Produktions-Audit läuft zuerst;
ein fehlgeschlagener Voll-Audit oder ungültiges Ergebnis bleibt ein Fehler.
Die vollständige Linux-CI muss den neuen Commit zusätzlich qualifizieren. Ältere
grüne Läufe und dieser lokale Befund schliessen keinen GitHub-Alert auf Main und
erteilen weder technische Gesamt- noch Produktionsfreigabe.

Der erste Folge-CI-Lauf39707525079 bestätigte die tatsächlichen Linux-Tests und
CodeQL39707524892, scheiterte jedoch korrekt bei der Produktionspaketierung:
Das vorhandene Packaging kopierte nur Manifest/Lockfile, nicht den darin genannten
Patch. Auch eine reine Produktionsinstallation benötigt die Patchdatei für pnpm-
Integritätsprüfung. `package-patches.mjs` ergänzt deshalb ausschliesslich deklarierte,
unveränderte Patchbytes vor der weiterhin eingefrorenen Installation. Fehlende,
leere, absolute, Traversal- und Symlinkpfade blockieren. Keine Ausnahme oder
Lockfile-Umgehung wurde eingeführt. Positive/negative Regressionen laufen im
bestehenden Runtime-Test; die vollständige Paketierung benötigt den Folge-CI-Lauf.

Bei einem späteren Upstream-Update muss der eng versionsgebundene Patch bewusst
geprüft oder durch eine nachweislich reparierte Originalversion ersetzt werden.
Ein nicht mehr anwendbarer Patch muss die Installation blockieren.
