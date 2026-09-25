export const marketingFeatures = [
  {
    id: 'customers',
    title: 'Kunden und Kontakte',
    shortTitle: 'Kunden',
    description: 'Firmen und Ansprechpersonen zentral erfassen und direkt für Angebote, Aufträge und Rechnungen verwenden.',
    benefit: 'Kundendaten nur einmal erfassen.',
    route: '/customers',
  },
  {
    id: 'quotes',
    title: 'Angebote',
    shortTitle: 'Angebote',
    description: 'Angebote mit Positionen erstellen und angenommene Leistungen ohne doppelte Erfassung weiterführen.',
    benefit: 'Vom Angebot direkt zum Auftrag.',
    route: '/quotes',
  },
  {
    id: 'orders',
    title: 'Aufträge',
    shortTitle: 'Aufträge',
    description: 'Laufende Arbeiten, Kundenbezug und Leistungen an einem Ort verwalten.',
    benefit: 'Der aktuelle Stand bleibt sichtbar.',
    route: '/orders',
  },
  {
    id: 'time',
    title: 'Zeiterfassung',
    shortTitle: 'Zeiten',
    description: 'Arbeitszeit direkt auf Kunden und Aufträge erfassen und für die Abrechnung vorbereiten.',
    benefit: 'Erfasste Arbeit bleibt abrechenbar.',
    route: '/time',
  },
  {
    id: 'invoices',
    title: 'Rechnungen',
    shortTitle: 'Rechnungen',
    description: 'Rechnungen aus Leistungen erstellen und offene, versendete und bezahlte Vorgänge nachvollziehen.',
    benefit: 'Von der Leistung bis zur Zahlung.',
    route: '/invoices',
  },
  {
    id: 'employees',
    title: 'Mitarbeitende und Rollen',
    shortTitle: 'Mitarbeitende',
    description: 'Mitarbeitende verwalten und Zugriffe passend zur Aufgabe steuern.',
    benefit: 'Klare Zuständigkeiten und Berechtigungen.',
    route: '/employees',
  },
] as const

export const marketingFlow = [
  ['01', 'Kunde erfassen', 'Die wichtigsten Angaben genügen für den Start.'],
  ['02', 'Angebot erstellen', 'Leistungen und Preise direkt beim Kunden festhalten.'],
  ['03', 'Auftrag weiterführen', 'Angenommene Leistungen ohne doppelte Erfassung übernehmen.'],
  ['04', 'Zeit erfassen', 'Arbeitszeit dort erfassen, wo der Auftrag bereits bekannt ist.'],
  ['05', 'Rechnung erstellen', 'Abrechenbare Leistungen in die Rechnung übernehmen.'],
  ['06', 'Zahlung im Blick behalten', 'Offene und bezahlte Rechnungen klar unterscheiden.'],
] as const

export const marketingFaq = [
  ['Für wen ist Binso One gedacht?', 'Für Schweizer Dienstleistungsunternehmen und Teams, die Kunden, Angebote, Aufträge, Zeiten und Rechnungen in einer gemeinsamen Anwendung führen möchten.'],
  ['Brauche ich für den Start Zahlungsdaten?', 'Nein. Du kannst dich registrieren und den vorgesehenen Testzugang starten, ohne beim Einstieg Zahlungsdaten zu hinterlegen.'],
  ['Muss ich beim Einrichten alles ausfüllen?', 'Nein. Die Einrichtung fragt nur die Angaben ab, die für den Start sinnvoll sind. Weitere Daten kannst du später ergänzen.'],
  ['Funktioniert Binso One auf dem Smartphone?', 'Ja. Die Anwendung ist für Desktop und Mobile ausgelegt und kann als PWA verwendet werden.'],
] as const

export const publicValuePoints = [
  'Für Schweizer Dienstleistungsunternehmen',
  '30 Tage testen ohne Zahlungsdaten',
  'Desktop, Mobile und PWA',
] as const
