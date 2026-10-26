# Binso One – Dependency Security Review

Stand: 26. Oktober 2026

## Verbindliche Gates

Quality führt `pnpm security:scan` und `pnpm security:scan:all` aus. Die erste
Prüfung erfasst die Produktionsabhängigkeiten; die zweite prüft zusätzlich die
Entwicklungswerkzeuge. High- und Critical-Advisories blockieren beide Gates.
Nicht lesbare Antworten, Registry-Fehler und fehlgeschlagene Audit-Prozesse
werden nicht als bestandene Prüfung behandelt.

Es gibt keine Advisory-Ausnahme. Die frühere Beschreibung einer Ausnahme für
`GHSA-vfj7-8cjw-p6xm` war veraltet und widersprach dem aktuellen Gate. Die
betroffene alte transitive Werkzeug-Abhängigkeit wurde bereits entfernt; die
gezielte Patch-Datei und Overrides stehen in package.json und pnpm-lock.yaml.
Ihre weitere Notwendigkeit ist bei einem kontrollierten Toolchain-Upgrade erneut
zu prüfen. Der Prüfmechanismus darf dafür nicht abgeschwächt werden.

## Aktueller lokaler Nachweis

Am 26. Oktober lieferten die strukturierten pnpm-Audits sowohl für die
Produktionsabhängigkeiten (385 erfasste Abhängigkeiten) als auch für den
vollständigen Lockfile-Baum (579 erfasste Abhängigkeiten) null gemeldete
Schwachstellen aller Schweregrade. Das ist ein Registry-Snapshot, keine Garantie
für unbekannte oder erst später veröffentlichte Schwachstellen. CI muss den
Audit für den tatsächlich freizugebenden Commit erneut ausführen.

## Installations- und Aktualisierungsregeln

- Node 24 und pnpm 10.17.1 bilden den bestehenden Laufzeitvertrag.
- Direkte Paketversionen und Integritäten sind festgelegt. CI und Packaging
  installieren mit `--frozen-lockfile`.
- Produktionspakete enthalten die mit `--prod` ausgewählten Laufzeitpakete;
  notwendige deklarierte Patches werden vor der Installation exakt kopiert.
- Updates müssen mit Lockfile, Security-Audit, Lint-/Typprüfung und betroffenem
  Laufzeit-/Artefakttest zusammen geprüft werden. Eine höhere Versionsnummer
  allein ist kein Beleg für Kompatibilität oder bessere Sicherheit.
- Repository- und Registry-Audits ersetzen weder RBAC-/RLS-Tests noch den
  vollständigen Browser-, Provider- und Geräte-Nachweis vor einer Freigabe.
