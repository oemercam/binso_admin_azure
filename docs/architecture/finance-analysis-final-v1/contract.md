# Finanzanalyse Final V1

Die unveränderte source.md ist die neue verbindliche Vorgabe für diese Seitenfamilie. Sie ersetzt den grossen Verlauf der Kunden-Finanzanalyse durch vier gemeinsame KPI-Karten, zwei Vergleichsbalken und zwei zunächst geschlossene kontrollierte DetailDisclosure-Bereiche. Bestehende Dashboard-, Kunden-Dossier- und sonstige Statistikdiagramme bleiben erforderlich und werden nicht entfernt. Navigation/FAB, Backend-Finanzberechnungen, Mandantengrenzen und Rechte bleiben unverändert. Keine GitHub-Aktionen, Migrationen oder Deployments.

Zahlungswerte: vorhandene cashStatisticEvents + aggregateStatistics + sumMoney. Vergleich: vorhandene previousStatisticBounds und metricTrend, gleich langer unmittelbar vorhergehender inklusiver Zeitraum. Keine erfundene Vergleichsbasis. Negative Nettoeingänge bleiben als Betrag sichtbar; rein visuelle Balkenbreiten werden bei null gekappt.

Offen und Forderungs-Summe: aktueller Stichtagsbestand open + overdue aus financialMetricsData; die beiden offenen Betragsteile sind durch due_date >= Stichtag bzw. < Stichtag getrennt. Es gibt keine historischen Bestandssnapshots: deshalb kein Prozenttrend für Offen. Der Ring heisst ausdrücklich Rechnungsbestand und enthält beglichene plus ausstehende Betragsanteile. Sein Gesamtbetrag ist nicht der offene Forderungsbetrag.

Angebotszahlen: vorhandene /api/reports-Projektion mit identischem Zeitraum und bestehenden Berichts-/Angebotsrechten; counts werden über Währungen addiert, Geldbeträge niemals. Fehlende Rechte/Daten bleiben unbekannt; keine fiktiven Nullen. Die bestehende Berichtsquelle begrenzt individuelle Zeiträume auf ein Jahr.

Auswertungszeitraum bleibt im vorhandenen useStatisticPeriod-Owner. Nur Anzeigezustand und Scrollposition werden im vorhandenen flüchtigen listStateStore gehalten und mit dessen Sessiongrenzen gelöscht. Keine Datensätze oder privaten Suchtexte im neuen Zustand. Statuslinks verwenden bestehende Listenfilter. Die Listen zeigen ihre bestehenden Statusgruppen; keine neue Historien-/Anteilsfilterung wird vorgetäuscht.

Die separaten Admin-Plattformfinanzen haben Vertragsumsatz und Betriebskosten statt dieser identischen Zahlungs-/Forderungsprojektion. Sie werden nicht mit Kunden-Forderungen oder einem erfundenen Cashsaldo befüllt. Die gemeinsamen Komponenten sind wiederverwendbar; Admin-Ansichten sind in diesem Block nicht browserabgenommen.
