## Ergänzung – Globaler Standard für Seiten, Bottom Sheets und Aktionsmenüs

Prüfe die gesamte bestehende Binso-One-Anwendung auf die korrekte Verwendung von ganzen Seiten, Bottom Sheets, Dialogen und Drei-Punkte-Menüs.

Implementiere eine einheitliche Darstellungslogik:

1. Umfangreiche Formulare, mehrstufige Geschäftsprozesse und Detailansichten verwenden ganze Seiten.
2. Kurze Eingaben, Auswahlen, Filter und kontextspezifische Aktionen verwenden Bottom Sheets.
3. Auf Desktop werden für kurze Aktionen geeignete kompakte Menüs oder Dialoge verwendet.
4. Bottom Sheets müssen inhaltsabhängig dimensioniert, keyboard-aware, scrollbar und vollständig Safe-Area-kompatibel sein.
5. Ganze Seiten verwenden einen einheitlichen Header, zentrale Seitenränder, konsistente Abschnittstrennungen und eine klare Text- und Informationshierarchie.
6. Formularaktionen müssen jederzeit erreichbar sein, dürfen aber weder Inhalte noch Eingabefelder verdecken.
7. Keine verschachtelten Bottom Sheets, doppelten Header oder unnötigen Zwischenseiten.
8. Keine eigenständigen lokalen Sheet-, Modal- oder Header-Implementierungen, wenn bereits zentrale Komponenten vorhanden sind.
9. Bestehende Navigation und Floating-Plus-Button unverändert beibehalten.
10. Alle Änderungen auf iPhone Safari, iOS-PWA, iPad und Desktop sowie in Light und Dark Mode prüfen.

Die Firmenvervollständigung wird ausdrücklich als eine einzige ganze Seite umgesetzt. Optionale Einstellungen werden aus diesem Ablauf ausgelagert.

Für andere Bereiche zunächst die vorhandene Darstellungsform fachlich bewerten. Nur nachweislich ungeeignete Darstellungen korrigieren und bestehende funktionierende Abläufe erhalten.

Ziel ist eine durchgehend einheitliche, einfache und moderne Benutzerführung ohne unnötige Klicks, verschachtelte Oberflächen oder widersprüchliche Darstellungsstandards.
