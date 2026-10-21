# Aktuelle Abnahmequelle und historische Nachweise

Revision7 ersetzt die alten V25-Masteraufträge. Der bisherige Compliance-Report
aggregierte weiterhin 432 Einträge: 40 technische UX-Verträge und 392 importierte
V22-Nachweise. Fehlende alte Originalfreigaben erschienen dadurch als aktuelle
Blocker, während die 573 verbindlichen Revision7-Klauseln nur separat inventarisiert
waren. Ein grüner Entwicklungslauf war damit keine aktuelle Gesamtabnahme.

## Korrektur

- `scripts/compliance/authority.mjs` prüft Original-Quellhash, alle56 Kapitel,
  alle573 eindeutigen Klauseln, Kapitelzuordnung und Klauseltext/-hash.
  Fehlende oder manipulierte Register blockieren statt auf alte Quellen zurückzufallen.
- Aktive Coverage:573 aktuelle Review-Pflichten plus alle40 unveränderten technischen
  Verträge. Die392 historischen Einträge bleiben vollständig als
  `historicalTraceability` im Bericht und in ihrer bestehenden Quelldatei erhalten.
- Historische Erfolge und generierte Implementierungsstatus erteilen keine neue
  Freigabe. Aktuelle Klauselfreigaben müssen Original- und Klauselhash, konkrete
  Evidenz und ausdrücklichen unabhängigen Review enthalten.
- Fehlgeschlagene Einzelprüfungen bleiben blockierend, auch wenn ein historischer
  Nachweis umklassifiziert wird. Laufzeit-, Rollen-, Geräte- und Referenzlücken
  werden dadurch weder entfernt noch bestanden.
- Die Evidenzidentität bindet nun zusätzlich die aktuelle Originalquelle und das
  Anforderungsregister. Alte Messungen werden nach einer Änderung nicht übernommen.
- Bestehende Branch Protection, Pflichtchecks und die exakt validierte historische
  Development-Release-Autorisierung sind unverändert. Ihr alter Deferred-Label
  `complete-432-requirement-approval` bleibt aus Integritätsgründen erhalten und
  wird im Bericht als historischer Autorisierungstext erklärt. Es ist keine
  Freigabe der573 aktuellen Klauseln oder eines Produktivdeployments.

## Tatsächliche Prüfungen

`compliance/authority-test.mjs`, bestehender `compliance/report-test.mjs` und
`compliance/selftest.mjs` bestanden: vollständige aktuelle Quelle, alle technischen
Verträge erhalten, ungültige/fehlende/doppelte Klauseln und falsche Hashes gesperrt,
keine Freigabe durch Statusprosa oder alte Erfolge, veraltete Quell-/Klauselbindung
abgelehnt, fehlender unabhängiger Reviewer bleibt offen und Fehler dominieren.

Der tatsächliche Report wurde lokal mit statischen Prüfungen, jedoch ohne
Browserdateien erzeugt:613 aktive Anforderungen,392 historische Datensätze,
78 Routen,0 aktuelle Browserfälle, `compliant:false`, `developmentRelease.ready:false`.
Dies ist ein negativer Gate-Nachweis, keine visuelle oder fachliche Abnahme.
Die aktuelle CI mit Browser-/Parallelprüfungen steht noch aus.

## Zusammenführungsregression

Quality auf90f74839 fand im neuen Kundenreferenz-Wächter eine Änderung des
Fehlervertrags: bei einem unter RLS unsichtbaren Kunden kam23503 statt42501.
Der Wächter verwendet nun wieder die generische Zugriffsverweigerung42501,
ohne die Existenz eines fremden Kunden preiszugeben. Die unveränderten
`workforce-regression-test.mjs`-Assertions und tatsächliche Runtime-RLS bestehen.
Kein Test wurde abgeschwächt; die früher fehlgeschlagene CI bleibt fehlgeschlagen.

## Evidenzbindung ohne Ergebnis-Zirkelschluss

Die Quellidentität bindet weiterhin alle ausführbaren App-, Komponenten-, API-,
Konfigurations-, Skript- und UX-Vertragsquellen sowie die unveränderten Originalbytes.
Für das Revision7-Register wird zusätzlich seine validierte normative Projektion
gebunden: Klausel-ID, Kapitelzuordnung, Priorität, Originaltext/-hash und konkrete
Reviewpflichten. Veränderliche Ergebnisprosa und generierter Implementierungsstatus
sind keine normative Quelle. Ihr Nachtragen darf identischen Code nicht nachträglich
zu einem anderen geprüften Programm machen. Dies erteilt keine Klauselfreigabe.

Der echte Git-Fixturetest weist nach: Ergebnisprosa lässt den Digest unverändert;
eine Prioritätsänderung verändert ihn; ersetzte Klauseln und veränderte Originalbytes
mit veraltetem Register werden abgelehnt. Bereits vorhandene negative Review- und
Quellbindungsprüfungen bleiben erhalten. Kein fehlgeschlagener Fall wird akzeptiert.

## Gesicherter Integrationsnachweis

Commit 7bc770a43bc3215ae5dba956dbb617c56d391c5c: Standard-Quality39691340506,
CodeQL39691340507 und Full Development39691829176 erfolgreich, einschliesslich
echter PostgreSQL-Parallelprüfungen, beider funktionalen Browserjobs und aller sechs
Responsive-Jobs. Diese erfolgreichen Entwicklungsgates sind keine vollständige
fachliche oder visuelle Abnahme der573 Klauseln. Nachfolgende Quellenänderungen
benötigen eigene aktuelle Prüfungen.
